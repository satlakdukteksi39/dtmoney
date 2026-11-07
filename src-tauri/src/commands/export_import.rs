// Export/Import commands
use super::*;
use crate::db::Database;
use crate::models::*;
use tauri::State;
use uuid::Uuid;
use chrono::Utc;
use csv::Writer;
use calamine::{Reader, Xlsx};

pub mod export {
    use super::*;

    #[tauri::command]
    pub async fn export_data(
        state: State<'_, Arc<Database>>,
        format: String, // "csv" or "xlsx"
    ) -> Result<String, String> {
        let db = state.inner().pool();

        // Export accounts
        let accounts = sqlx::query_as::<_, crate::models::Account>(
            "SELECT * FROM accounts WHERE is_active = 1"
        )
        .fetch_all(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        // Export transactions
        let transactions = sqlx::query_as::<_, crate::models::Transaction>(
            "SELECT * FROM transactions ORDER BY date DESC"
        )
        .fetch_all(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        // Export categories
        let categories = sqlx::query_as::<_, crate::models::Category>(
            "SELECT * FROM categories WHERE is_active = 1"
        )
        .fetch_all(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        // Export budgets
        let budgets = sqlx::query_as::<_, crate::models::Budget>(
            "SELECT * FROM budgets"
        )
        .fetch_all(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        // Export categories
        let categories = sqlx::query_as::<_, crate::models::Category>(
            "SELECT * FROM categories WHERE is_active = 1"
        )
        .fetch_all(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        // Build JSON export
        let export_data = serde_json::json!({
            "version": "1.0",
            "exported_at": chrono::Utc::now().to_rfc3339(),
            "accounts": accounts,
            "transactions": transactions,
            "categories": categories,
            "budgets": budgets,
        });

        let json = serde_json::to_string_pretty(&export_data).map_err(|e| e.to_string())?;

        if format == "json" {
            Ok(serde_json::to_string_pretty(&export_data).map_err(|e| e.to_string())?)
        } else if format == "csv" {
            // Generate CSV files (simplified - return JSON for now)
            Ok(serde_json::to_string_pretty(&export_data).map_err(|e| e.to_string())?)
        } else {
            Err("Unsupported format".to_string())
        }
    }
}

pub mod import {
    use super::*;

    #[tauri::command]
    pub async fn import_data(
        state: State<'_, Arc<Database>>,
        json_data: String,
    ) -> Result<serde_json::Value, String> {
        let import_data: serde_json::Value = serde_json::from_str(&json_data)
            .map_err(|e| e.to_string())?;

        let mut imported = serde_json::json!({
            "accounts": 0,
            "transactions": 0,
            "categories": 0,
            "budgets": 0
        });

        let db = state.inner().pool();
        let mut tx = state.inner().pool().begin().await.map_err(|e| e.to_string())?;

        // Import accounts
        if let Some(accounts) = import_data.get("accounts").and_then(|v| v.as_array()) {
            for acc in accounts {
                sqlx::query(
                    r#"
                    INSERT OR REPLACE INTO accounts (id, name, account_type, currency, balance, parent_id, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    "#
                )
                .bind(acc.get("id").and_then(|v| v.as_str()).unwrap_or(""))
                .bind(acc.get("name").and_then(|v| v.as_str()).unwrap_or(""))
                .bind(acc.get("account_type").and_then(|v| v.as_str()).unwrap_or("asset"))
                .bind(acc.get("currency").and_then(|v| v.as_str()).unwrap_or("IDR"))
                .bind(acc.get("balance").and_then(|v| v.as_i64()).unwrap_or(0))
                .bind(acc.get("parent_id").and_then(|v| v.as_str()))
                .bind(acc.get("is_active").and_then(|v| v.as_bool()).unwrap_or(true))
                .bind(acc.get("created_at").and_then(|v| v.as_str()).unwrap_or(""))
                .bind(acc.get("updated_at").and_then(|v| v.as_str()).unwrap_or(""))
                .execute(state.inner().pool())
                .await
                .map_err(|e| e.to_string())?;
        }
    }

    #[tauri::command]
    pub async fn import_csv(
        state: State<'_, Arc<Database>>,
        csv_data: String,
        import_type: String, // "transactions", "accounts", "categories"
    ) -> Result<i64, String> {
        let mut reader = csv::Reader::from_reader(import_data.as_bytes());
        let mut count = 0;

        let mut tx = state.inner().pool().begin().await.map_err(|e| e.to_string())?;

        for result in reader.deserialize() {
            let record: csv::StringRecord = result.map_err(|e| e.to_string())?;
            
            match import_type.as_str() {
                "transactions" => {
                    // Parse transaction CSV
                    // Expected: date, description, amount, from_account, to_account, category, tags, notes
                }
                "accounts" => {
                    // Parse account CSV
                }
                "categories" => {
                    // Parse category CSV
                }
                _ => return Err("Invalid import type".to_string()),
            }
            count += 1;
        }

        tx.commit().await.map_err(|e| e.to_string())?;
        Ok(count)
    }
}