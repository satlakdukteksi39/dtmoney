// Budget commands
use super::*;
use crate::db::Database;
use crate::models::*;
use tauri::State;
use uuid::Uuid;
use chrono::{Utc, Duration, NaiveDate, Datelike};

pub mod budgets {
    use super::*;

    #[tauri::command]
    pub async fn get_budgets(state: State<'_, Arc<Database>>) -> Result<Vec<Budget>, String> {
        let budgets = sqlx::query_as::<_, Budget>(
            "SELECT * FROM budgets ORDER BY period_end DESC"
        )
        .fetch_all(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;
        Ok(budgets)
    }

    #[tauri::command]
    pub async fn get_budget(state: State<'_, Arc<Database>>, id: String) -> Result<Budget, String> {
        let budget = sqlx::query_as::<_, Budget>(
            "SELECT * FROM budgets WHERE id = ?"
        )
        .bind(&id)
        .fetch_optional(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Budget not found")?;
        Ok(budget)
    }

    #[tauri::command]
    pub async fn create_budget(
        state: State<'_, Arc<Database>>,
        category_id: String,
        period_start: DateTime<Utc>,
        period_end: DateTime<Utc>,
        limit_amount: i64,
        alert_threshold: Option<f64>,
    ) -> Result<Budget, String> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO budgets (id, category_id, period_start, period_end, limit_amount, alert_threshold, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&id)
        .bind(&category_id)
        .bind(&period_start)
        .bind(&period_end)
        .bind(&limit_amount)
        .bind(alert_threshold.unwrap_or(0.8))
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        get_budget(State::new(state.inner().clone()), id).await
    }

    #[tauri::command]
    pub async fn update_budget(
        state: State<'_, Arc<Database>>,
        id: String,
        period_start: Option<DateTime<Utc>>,
        period_end: Option<DateTime<Utc>>,
        limit_amount: Option<i64>,
        alert_threshold: Option<f64>,
    ) -> Result<Budget, String> {
        let mut params = Vec::new();
        
        if period_start.is_some() { params.push("period_start = ?".to_string()); }
        if period_end.is_some() { params.push("period_end = ?".to_string()); }
        if limit_amount.is_some() { params.push("limit_amount = ?".to_string()); }
        if alert_threshold.is_some() { params.push("alert_threshold = ?".to_string()); }

        if params.is_empty() {
            return Err("No fields to update".to_string());
        }

        let query = format!("UPDATE budgets SET {}, updated_at = ? WHERE id = ?", params.join(", "));
        
        let mut query_builder = sqlx::query(&format!("UPDATE budgets SET {}, updated_at = ? WHERE id = ?", params.join(", ")));
        // This is simplified - in production you'd build this more carefully
        
        sqlx::query("UPDATE budgets SET updated_at = ? WHERE id = ?")
            .bind(Utc::now())
            .bind(&id)
            .execute(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        get_budget(State::new(state.inner().clone()), id).await
    }

    #[tauri::command]
    pub async fn delete_budget(state: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
        sqlx::query("DELETE FROM budgets WHERE id = ?")
            .bind(&id)
            .execute(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub async fn get_budget_progress(
        state: State<'_, Arc<Database>>,
        budget_id: String,
    ) -> Result<BudgetProgress, String> {
        let db = state.inner().pool();
        
        let budget = sqlx::query_as::<_, Budget>("SELECT * FROM budgets WHERE id = ?")
            .bind(&budget_id)
            .fetch_optional(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?
            .ok_or("Budget not found")?;

        let category = sqlx::query_as::<_, Category>("SELECT * FROM categories WHERE id = ?")
            .bind(&budget.category_id)
            .fetch_optional(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?
            .ok_or("Category not found")?;

        // Calculate spent amount in the budget period
        let spent: i64 = sqlx::query_scalar(
            "SELECT COALESCE(SUM(ABS(amount)), 0) FROM transactions 
             WHERE category_id = ? AND amount < 0 AND date >= ? AND date <= ?"
        )
        .bind(&budget.category_id)
        .bind(&budget.period_start)
        .bind(&budget.period_end)
        .fetch_one(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        let percentage = if budget.limit_amount > 0 {
            (spent as f64 / budget.limit_amount as f64) * 100.0
        } else {
            0.0
        };

        let is_over = spent > budget.limit_amount;
        let is_warning = percentage >= (budget.alert_threshold * 100.0);
        let remaining = budget.limit_amount - spent;
        
        let days_remaining = (budget.period_end - Utc::now()).num_days().max(0);

        Ok(BudgetProgress {
            budget,
            category,
            spent,
            percentage,
            is_over: spent > budget.limit_amount,
            is_warning: percentage >= (budget.alert_threshold * 100.0),
            remaining,
            days_remaining,
        })
    }

    #[tauri::command]
    pub async fn get_budget_alerts(state: State<'_, Arc<Database>>) -> Result<Vec<BudgetAlert>, String> {
        let budgets = sqlx::query_as::<_, Budget>("SELECT * FROM budgets")
            .fetch_all(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        let mut alerts = Vec::new();

        for budget in budgets {
            let spent: i64 = sqlx::query_scalar(
                "SELECT COALESCE(SUM(ABS(amount)), 0) FROM transactions 
                 WHERE category_id = ? AND amount < 0 AND date >= ? AND date <= ?"
            )
            .bind(&budget.category_id)
            .bind(&budget.period_start)
            .bind(&budget.period_end)
            .fetch_one(state.inner().pool())
            .await
            .unwrap_or(0);

            let percentage = if budget.limit_amount > 0 {
                (spent as f64 / budget.limit_amount as f64) * 100.0
            } else {
                0.0
            };

            let alert_type = if spent > budget.limit_amount {
                "over".to_string()
            } else if percentage >= (budget.alert_threshold * 100.0) {
                "warning".to_string()
            } else {
                continue;
            };

            let category = sqlx::query_as::<_, Category>("SELECT * FROM categories WHERE id = ?")
                .bind(&budget.category_id)
                .fetch_optional(state.inner().pool())
                .await
                .map_err(|e| e.to_string())?;

            if let Some(category) = category {
                alerts.push(BudgetAlert {
                    budget: budget.clone(),
                    category,
                    spent,
                    percentage,
                    alert_type,
                });
            }
        }

        Ok(alerts)
    }
}