// Reports commands
use super::*;
use crate::db::Database;
use crate::models::*;
use tauri::State;
use uuid::Uuid;
use chrono::{Utc, Duration, NaiveDate, Datelike, Timelike};
use sqlx::Row;

pub mod reports {
    use super::*;

    #[tauri::command]
    pub async fn get_spending_by_category(
        state: State<'_, Arc<Database>>,
        from_date: Option<DateTime<Utc>>,
        to_date: Option<DateTime<Utc>>,
    ) -> Result<Vec<SpendingByCategory>, String> {
        let db = state.inner().pool();

        let mut query = r#"
            SELECT 
                c.id as category_id,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon,
                COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as amount
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.amount < 0
        "#.to_string();

        let mut conditions = Vec::new();
        let mut params: Vec<String> = vec![];

        if let Some(from_date) = &from_date {
            params.push(format!("t.date >= '{}'", from_date.to_rfc3339()));
        }
        if let Some(to_date) = &to_date) {
            params.push(format!("t.date <= '{}'", to_date.to_rfc3339()));
        }

        if !params.is_empty() {
            query.push_str(" AND ");
            query.push_str(&params.join(" AND "));
        }

        query.push_str(" GROUP BY c.id, c.name, c.color, c.icon ORDER BY amount DESC");

        let rows = sqlx::query(&query)
            .fetch_all(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        let mut results = Vec::new();
        for row in rows {
            let amount: i64 = row.try_get("amount").unwrap_or(0);
            results.push(SpendingByCategory {
                category_id: row.try_get("category_id").unwrap_or_default(),
                category_name: row.try_get("category_name").unwrap_or_default(),
                category_color: row.try_get("category_color").unwrap_or_default(),
                category_icon: row.try_get("category_icon"),
                amount: row.try_get("amount").unwrap_or(0),
                percentage: 0.0, // Will calculate after total
            });
        }

        // Calculate percentages
        let total: i64 = results.iter().map(|r| r.amount).sum();
        for r in &mut results {
            r.percentage = if total > 0 {
                (r.amount as f64 / total as f64) * 100.0
            } else {
                0.0
            };
        }

        Ok(results)
    }

    #[tauri::command]
    pub async fn get_spending_by_month(
        state: State<'_, Arc<Database>>,
        year: Option<i32>,
    ) -> Result<Vec<SpendingByMonth>, String> {
        let year = year.unwrap_or_else(|| Utc::now().year());
        
        let query = r#"
            SELECT 
                strftime('%Y-%m', date) as month,
                COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expense
            FROM transactions
            WHERE strftime('%Y', date) = ?
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month
        "#;

        let rows = sqlx::query(&format!(
            "SELECT 
                strftime('%Y-%m', date) as month,
                COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expense
            FROM transactions
            WHERE strftime('%Y', date) = '{}'
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month", 
        ))
        .fetch_all(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        let mut results = Vec::new();
        for row in rows {
            let month: String = row.try_get("month").unwrap_or_default();
            let income: i64 = row.try_get("income").unwrap_or(0);
            let expense: i64 = row.try_get("expense").unwrap_or(0);
            
            results.push(SpendingByMonth {
                month,
                income,
                expense,
                net: 0, // Will calculate
            });
        }

        for r in &mut results {
            r.net = r.income - r.expense;
        }

        Ok(results)
    }

    #[tauri::command]
    pub async fn get_income_vs_expense(
        state: State<'_, Arc<Database>>,
        months: Option<i32>,
    ) -> Result<Vec<IncomeVsExpense>, String> {
        let months = months.unwrap_or(12);
        
        let query = format!(
            "SELECT 
                strftime('%Y-%m', date) as period,
                COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expense
            FROM transactions
            WHERE date >= date('now', '-{} months')
            GROUP BY strftime('%Y-%m', date)
            ORDER BY period",
            months
        );

        let rows = sqlx::query(&format!(
            "SELECT 
                strftime('%Y-%m', date) as period,
                COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expense
            FROM transactions
            WHERE date >= date('now', '-{} months')
            GROUP BY strftime('%Y-%m', date)
            ORDER BY period", 
        ))
        .fetch_all(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        let mut results = Vec::new();
        for row in rows {
            let period: String = row.try_get("period").unwrap_or_default();
            let income: i64 = row.try_get("income").unwrap_or(0);
            let expense: i64 = row.try_get("expense").unwrap_or(0);
            
            results.push(IncomeVsExpense {
                period,
                income,
                expense,
                net: 0, // will calculate
            });
        }

        for r in &mut results {
            r.net = r.income - r.expense;
        }

        Ok(results)
    }

    #[tauri::command]
    pub async fn get_net_worth(
        state: State<'_, Arc<Database>>,
    ) -> Result<Vec<NetWorthPoint>, String> {
        // This would ideally use historical snapshots
        // For now, return current net worth
        let assets: i64 = sqlx::query_scalar(
            "SELECT COALESCE(SUM(balance), 0) FROM accounts WHERE account_type = 'asset' AND is_active = 1"
        )
        .fetch_one(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        let liabilities: i64 = sqlx::query_scalar(
            "SELECT COALESCE(SUM(ABS(balance)), 0) FROM accounts WHERE account_type = 'liability' AND is_active = 1"
        )
        .fetch_one(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        let net_worth = assets - liabilities;

        Ok(vec![NetWorthPoint {
            date: Utc::now(),
            assets,
            liabilities,
            net_worth,
        }])
    }

    #[tauri::command]
    pub async fn get_cash_flow(
        state: State<'_, Arc<Database>>,
        months: Option<i32>,
    ) -> Result<Vec<CashFlowPoint>, String> {
        let months = months.unwrap_or(12);
        
        let query = format!(
            "SELECT 
                strftime('%Y-%m', date) as date,
                COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as inflow,
                COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as outflow
            FROM transactions
            WHERE date >= date('now', '-{} months')
            GROUP BY strftime('%Y-%m', date)
            ORDER BY date",
            months
        );

        let rows = sqlx::query(&query)
            .fetch_all(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        let mut results = Vec::new();
        for row in rows {
            let date_str: String = row.try_get("date").unwrap_or_default();
            let date = DateTime::parse_from_rfc3339(&format!("{}-01T00:00:00Z", date_str))
                .unwrap_or_else(|_| Utc::now());
            let inflow: i64 = row.try_get("inflow").unwrap_or(0);
            let outflow: i64 = row.try_get("outflow").unwrap_or(0);
            
            results.push(CashFlowPoint {
                date,
                inflow,
                outflow,
                net: inflow - outflow,
            });
        }

        Ok(results)
    }
}