// Transaction commands
use super::*;
use crate::db::Database;
use crate::models::*;
use tauri::State;
use uuid::Uuid;
use chrono::{Utc, NaiveDate, NaiveDateTime, Datelike, Timelike};
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateTransactionRequest {
    pub date: DateTime<Utc>,
    pub description: Option<String>,
    pub amount: i64,
    pub from_account_id: Option<String>,
    pub to_account_id: Option<String>,
    pub category_id: Option<String>,
    pub tags: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateTransactionRequest {
    pub date: Option<DateTime<Utc>>,
    pub description: Option<String>,
    pub amount: Option<i64>,
    pub from_account_id: Option<String>,
    pub to_account_id: Option<String>,
    pub category_id: Option<String>,
    pub tags: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionFilter {
    pub account_id: Option<String>,
    pub category_id: Option<String>,
    pub from_date: Option<DateTime<Utc>>,
    pub to_date: Option<DateTime<Utc>>,
    pub min_amount: Option<i64>,
    pub max_amount: Option<i64>,
    pub search: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub mod transactions {
    use super::*;

    #[tauri::command]
    pub async fn get_transactions(
        state: State<'_, Arc<Database>>,
        filter: Option<TransactionFilter>,
    ) -> Result<Vec<TransactionWithDetails>, String> {
        let db = state.inner().pool();

        let mut query = r#"
            SELECT 
                t.*,
                fa.name as from_account_name,
                ta.name as to_account_name,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon
            FROM transactions t
            LEFT JOIN accounts fa ON t.from_account_id = fa.id
            LEFT JOIN accounts ta ON t.to_account_id = ta.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE 1=1
        "#.to_string();

        let mut conditions = Vec::new();
        let mut params: Vec<String> = vec![];

        if let Some(filter) = &filter {
            if let Some(account_id) = &filter.account_id {
                params.push(format!("(t.from_account_id = '{}' OR t.to_account_id = '{}')", account_id, account_id));
            }
            if let Some(category_id) = &filter.category_id {
                params.push(format!("t.category_id = '{}'", category_id));
            }
            if let Some(from_date) = &filter.from_date {
                params.push(format!("t.date >= '{}'", from_date.to_rfc3339()));
            }
            if let Some(to_date) = &filter.to_date {
                params.push(format!("t.date <= '{}'", to_date.to_rfc3339()));
            }
            if let Some(min_amount) = filter.min_amount {
                params.push(format!("t.amount >= {}", min_amount));
            }
            if let Some(max_amount) = filter.max_amount {
                params.push(format!("t.amount <= {}", max_amount));
            }
            if let Some(search) = &filter.search {
                params.push(format!("t.description LIKE '%{}%'", search));
            }
        }

        if !params.is_empty() {
            query.push_str(" AND ");
            query.push_str(&params.join(" AND "));
        }

        query.push_str(" ORDER BY t.date DESC");

        if let Some(limit) = filter.as_ref().and_then(|f| f.limit) {
            query.push_str(&format!(" LIMIT {}", limit));
        }
        if let Some(offset) = filter.as_ref().and_then(|f| f.offset) {
            query.push_str(&format!(" OFFSET {}", offset));
        }

        let transactions = sqlx::query_as::<_, TransactionWithDetails>(&query)
            .fetch_all(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        Ok(transactions)
    }

    #[tauri::command]
    pub async fn get_transaction(
        state: State<'_, Arc<Database>>,
        id: String,
    ) -> Result<TransactionWithDetails, String> {
        let transaction = sqlx::query_as::<_, TransactionWithDetails>(
            r#"
            SELECT 
                t.*,
                fa.name as from_account_name,
                ta.name as to_account_name,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon
            FROM transactions t
            LEFT JOIN accounts fa ON t.from_account_id = fa.id
            LEFT JOIN accounts ta ON t.to_account_id = ta.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = ?
        "#
        )
        .bind(&id)
        .fetch_optional(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Transaction not found")?;

        Ok(transaction)
    }

    #[tauri::command]
    pub async fn create_transaction(
        state: State<'_, Arc<Database>>,
        request: CreateTransactionRequest,
    ) -> Result<Transaction, String> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let mut tx = state.inner().pool().begin().await.map_err(|e| e.to_string())?;

        sqlx::query(
            r#"
            INSERT INTO transactions (id, date, description, amount, from_account_id, to_account_id, category_id, tags, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&id)
        .bind(&request.date)
        .bind(&request.description)
        .bind(&request.amount)
        .bind(&request.from_account_id)
        .bind(&request.to_account_id)
        .bind(&request.category_id)
        .bind(&request.tags)
        .bind(&request.notes)
        .bind(&now)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        // Update account balances
        if let Some(from_id) = &request.from_account_id {
            sqlx::query("UPDATE accounts SET balance = balance - ? WHERE id = ?")
                .bind(&request.amount)
                .bind(&request.from_account_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }

        if let Some(to_id) = &request.to_account_id {
            sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
                .bind(&request.amount)
                .bind(&request.to_account_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }

        tx.commit().await.map_err(|e| e.to_string())?;

        let transaction = get_transaction(State::new(state.inner().clone()), id).await?;

        Ok(Transaction {
            id: TransactionWithDetails { transaction: transaction.clone() }.transaction.id,
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            from_account_id: transaction.from_account_id,
            to_account_id: transaction.to_account_id,
            category_id: transaction.category_id,
            tags: transaction.tags,
            notes: transaction.notes,
            created_at: transaction.created_at,
            updated_at: transaction.updated_at,
        })
    }

    #[tauri::command]
    pub async fn update_transaction(
        state: State<'_, Arc<Database>>,
        id: String,
        request: UpdateTransactionRequest,
    ) -> Result<Transaction, String> {
        // Get old transaction for balance adjustment
        let old_tx = get_transaction(state.inner().clone(), id.clone()).await?;

        let mut updates = Vec::new();
        if request.date.is_some() { updates.push("date = ?"); }
        if request.description.is_some() { /* handled separately */ }
        if request.amount.is_some() { /* handled separately */ }
        if request.from_account_id.is_some() { /* handled separately */ }
        if request.to_account_id.is_some() { /* handled separately */ }
        if request.category_id.is_some() { /* handled separately */ }
        if request.tags.is_some() { /* handled separately */ }
        if request.notes.is_some() { /* handled separately */ }

        // For simplicity, we'll rebuild the whole transaction
        // In production, you'd do more granular updates
        let mut tx = state.inner().pool().begin().await.map_err(|e| e.to_string())?;

        // Reverse old balances
        if let Some(from_id) = &old_tx.from_account_id {
            sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
                .bind(&old_tx.amount)
                .bind(&old_tx.from_account_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }
        if let Some(to_id) = &old_tx.to_account_id {
            sqlx::query("UPDATE accounts SET balance = balance - ? WHERE id = ?")
                .bind(&old_tx.amount)
                .bind(&old_tx.to_account_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }

        // Delete old transaction
        sqlx::query("DELETE FROM transactions WHERE id = ?")
            .bind(&id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        // Create new transaction with updated values
        let new_id = Uuid::new_v4().to_string();
        let now = Utc::now();
        let amount = request.amount.unwrap_or(0);
        let from_id = request.from_account_id.or(old_tx.from_account_id);
        let to_id = request.to_account_id.or(old_tx.to_account_id);
        let cat_id = request.category_id.or(old_tx.category_id);
        let desc = request.description.or(old_tx.description);
        let tags = request.tags.or(old_tx.tags);
        let notes = request.notes.or(old_tx.notes);
        let date = request.date.unwrap_or(old_tx.date);

        sqlx::query(
            r#"
            INSERT INTO transactions (id, date, description, amount, from_account_id, to_account_id, category_id, tags, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&new_id)
        .bind(&date)
        .bind(&desc)
        .bind(&amount)
        .bind(&from_id)
        .bind(&to_id)
        .bind(&cat_id)
        .bind(&request.tags)
        .bind(&notes)
        .bind(&Utc::now())
        .bind(&now)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        // Update new balances
        if let Some(from_id) = &from_id {
            sqlx::query("UPDATE accounts SET balance = balance - ? WHERE id = ?")
                .bind(&amount)
                .bind(&from_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }
        if let Some(to_id) = &to_id {
            sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
                .bind(&amount)
                .bind(&to_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }

        tx.commit().await.map_err(|e| e.to_string())?;

        get_transaction(State::new(state.inner().clone()), new_id).await
    }

    #[tauri::command]
    pub async fn delete_transaction(state: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
        let old_tx = get_transaction(state.inner().clone(), id.clone()).await?;

        let mut tx = state.inner().pool().begin().await.map_err(|e| e.to_string())?;

        if let Some(from_id) = &old_tx.from_account_id {
            sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
                .bind(&old_tx.amount)
                .bind(&old_tx.from_account_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }
        if let Some(to_id) = &old_tx.to_account_id {
            sqlx::query("UPDATE accounts SET balance = balance - ? WHERE id = ?")
                .bind(&old_tx.amount)
                .bind(&old_tx.to_account_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }

        sqlx::query("DELETE FROM transactions WHERE id = ?")
            .bind(&id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(())
    }

    #[tauri::command]
    pub async fn get_transactions_by_account(
        state: State<'_, Arc<Database>>,
        account_id: String,
    ) -> Result<Vec<TransactionWithDetails>, String> {
        let filter = TransactionFilter {
            account_id: Some(account_id),
            ..Default::default()
        };
        get_transactions(state, Some(filter)).await
    }

    #[tauri::command]
    pub async fn get_transactions_by_category(
        state: State<'_, Arc<Database>>,
        category_id: String,
    ) -> Result<Vec<TransactionWithDetails>, String> {
        let filter = TransactionFilter {
            category_id: Some(category_id),
            ..Default::default()
        };
        get_transactions(state, Some(filter)).await
    }

    #[tauri::command]
    pub async fn get_transactions_by_date_range(
        state: State<'_, Arc<Database>>,
        from_date: DateTime<Utc>,
        to_date: DateTime<Utc>,
    ) -> Result<Vec<TransactionWithDetails>, String> {
        let filter = TransactionFilter {
            from_date: Some(from_date),
            to_date: Some(to_date),
            ..Default::default()
        };
        get_transactions(state, Some(filter)).await
    }

    #[tauri::command]
    pub async fn import_transactions(
        state: State<'_, Arc<Database>>,
        transactions: Vec<CreateTransactionRequest>,
    ) -> Result<i64, String> {
        let mut tx = state.inner().pool().begin().await.map_err(|e| e.to_string())?;
        let mut count = 0;

        for tx_req in transactions {
            let id = Uuid::new_v4().to_string();
            let now = Utc::now();

            sqlx::query(
                r#"
                INSERT INTO transactions (id, date, description, amount, from_account_id, to_account_id, category_id, tags, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#
            )
            .bind(&Uuid::new_v4().to_string())
            .bind(&tx_req.date)
            .bind(&tx_req.description)
            .bind(&tx_req.amount)
            .bind(&tx_req.from_account_id)
            .bind(&tx_req.to_account_id)
            .bind(&tx_req.category_id)
            .bind(&tx_req.tags)
            .bind(&tx_req.notes)
            .bind(&Utc::now())
            .bind(&Utc::now())
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

            if let Some(from_id) = &tx_req.from_account_id {
                sqlx::query("UPDATE accounts SET balance = balance - ? WHERE id = ?")
                    .bind(&tx_req.amount)
                    .bind(&tx_req.from_account_id)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| e.to_string())?;
            }
            if let Some(to_id) = &tx_req.to_account_id {
                sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
                    .bind(&tx_req.amount)
                    .bind(&tx_req.to_account_id)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| e.to_string())?;
            }

            count += 1;
        }

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(count)
    }

    #[tauri::command]
    pub async fn export_transactions(
        state: State<'_, Arc<Database>>,
        filter: Option<TransactionFilter>,
    ) -> Result<String, String> {
        let transactions = get_transactions(state, filter).await?;
        
        let mut wtr = csv::Writer::from_writer(vec![]);
        wtr.write_record(&[
            "Date", "Description", "Amount", "From Account", "To Account", 
            "Category", "Tags", "Notes"
        ]).map_err(|e| e.to_string())?;

        for tx in transactions {
            wtr.write_record(&[
                tx.transaction.date.to_rfc3339(),
                tx.transaction.description.unwrap_or_default(),
                tx.transaction.amount.to_string(),
                tx.from_account_name.unwrap_or_default(),
                tx.to_account_name.unwrap_or_default(),
                tx.category_name.unwrap_or_default(),
                tx.transaction.tags.unwrap_or_default(),
                tx.transaction.notes.unwrap_or_default(),
            ]).map_err(|e| e.to_string())?;
        }

        wtr.flush().map_err(|e| e.to_string())?;
        String::from_utf8(wtr.into_inner().map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn export_transactions_excel(
        state: State<'_, Arc<Database>>,
        filter: Option<TransactionFilter>,
    ) -> Result<Vec<u8>, String> {
        let transactions = get_transactions(state, filter).await?;
        
        let mut workbook = xlsxwriter::Workbook::new();
        let mut worksheet = workbook.add_worksheet(None)?;
        
        // Headers
        let headers = ["Date", "Description", "Amount", "From Account", "To Account", "Category", "Tags", "Notes"];
        for (col, header) in headers.iter().enumerate() {
            worksheet.write_string(0, col as u16, header, None).map_err(|e| e.to_string())?;
        }
        
        for (row_idx, tx) in transactions.iter().enumerate() {
            let row = (row_idx + 1) as u32;
            worksheet.write_string(row, 0, &tx.transaction.date.to_rfc3339(), None).map_err(|e| e.to_string())?;
            worksheet.write_string(row, 1, &tx.transaction.description.unwrap_or_default(), None).map_err(|e| e.to_string())?;
            worksheet.write_number(row, 2, tx.transaction.amount as f64, None).map_err(|e| e.to_string())?;
            worksheet.write_string(row, 3, &tx.from_account_name.unwrap_or_default(), None).map_err(|e| e.to_string())?;
            worksheet.write_string(row, 4, &tx.to_account_name.unwrap_or_default(), None).map_err(|e| e.to_string())?;
            worksheet.write_string(row, 5, &tx.category_name.unwrap_or_default(), None).map_err(|e| e.to_string())?;
            worksheet.write_string(row, 6, &tx.transaction.tags.unwrap_or_default(), None).map_err(|e| e.to_string())?;
            worksheet.write_string(row, 7, &tx.transaction.notes.unwrap_or_default(), None).map_err(|e| e.to_string())?;
        }
        
        let mut buffer = Vec::new();
        workbook.close_into(&mut buffer).map_err(|e| e.to_string())?;
        Ok(buffer)
    }

    async fn get_transaction(state: Arc<Database>, id: String) -> Result<TransactionWithDetails, String> {
        let transaction = sqlx::query_as::<_, TransactionWithDetails>(
            r#"
            SELECT 
                t.*,
                fa.name as from_account_name,
                ta.name as to_account_name,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon
            FROM transactions t
            LEFT JOIN accounts fa ON t.from_account_id = fa.id
            LEFT JOIN accounts ta ON t.to_account_id = ta.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = ?
        "#
        )
        .bind(&id)
        .fetch_optional(&*state.pool())
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Transaction not found")?;
        Ok(transaction)
    }
}