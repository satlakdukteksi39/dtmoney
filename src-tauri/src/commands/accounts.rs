// Account commands
use super::*;
use crate::db::Database;
use crate::models::*;
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

pub mod accounts {
    use super::*;

    #[tauri::command]
    pub async fn get_accounts(state: State<'_, Arc<Database>>) -> Result<Vec<Account>, String> {
        let db = state.inner().pool();
        let accounts = sqlx::query_as::<_, Account>(
            "SELECT * FROM accounts WHERE is_active = 1 ORDER BY account_type, name"
        )
        .fetch_all(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;
        Ok(accounts)
    }

    #[tauri::command]
    pub async fn get_account(state: State<'_, Arc<Database>>, id: String) -> Result<Account, String> {
        let account = sqlx::query_as::<_, Account>(
            "SELECT * FROM accounts WHERE id = ?"
        )
        .bind(&id)
        .fetch_optional(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Account not found")?;
        Ok(account)
    }

    #[tauri::command]
    pub async fn create_account(
        state: State<'_, Arc<Database>>,
        name: String,
        account_type: String,
        currency: Option<String>,
        parent_id: Option<String>,
    ) -> Result<Account, String> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO accounts (id, name, account_type, currency, parent_id, balance, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 0, 1, ?, ?)
            "#
        )
        .bind(&id)
        .bind(&name)
        .bind(&account_type)
        .bind(currency.unwrap_or_else(|| "IDR".to_string()))
        .bind(&parent_id)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        let account = sqlx::query_as::<_, Account>("SELECT * FROM accounts WHERE id = ?")
            .bind(&id)
            .fetch_one(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        Ok(account)
    }

    #[tauri::command]
    pub async fn update_account(
        state: State<'_, Arc<Database>>,
        id: String,
        name: Option<String>,
        account_type: Option<String>,
        currency: Option<String>,
        parent_id: Option<String>,
        is_active: Option<bool>,
    ) -> Result<Account, String> {
        let mut query = "UPDATE accounts SET updated_at = ?".to_string();
        let mut params: Vec<String> = vec![];

        if let Some(name) = name {
            params.push(format!("name = '{}'", name));
        }
        if let Some(account_type) = account_type {
            params.push(format!("account_type = '{}'", account_type));
        }
        if let Some(currency) = currency {
            params.push(format!("currency = '{}'", currency));
        }
        if let Some(parent_id) = parent_id {
            params.push(format!("parent_id = '{}'", parent_id));
        }
        if let Some(is_active) = is_active {
            params.push(format!("is_active = {}", if is_active { 1 } else { 0 }));
        }

        if params.is_empty() {
            return Err("No fields to update".to_string());
        }

        let query = format!("UPDATE accounts SET {}, updated_at = ? WHERE id = ?", params.join(", "));
        
        sqlx::query(&query)
            .bind(Utc::now())
            .bind(&id)
            .execute(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        get_account(State::new(state.inner().clone()), id).await
    }

    #[tauri::command]
    pub async fn delete_account(state: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
        // Check if account has transactions
        let tx_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM transactions WHERE from_account_id = ? OR to_account_id = ?"
        )
        .bind(&id)
        .bind(&id)
        .fetch_one(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        if tx_count > 0 {
            return Err("Cannot delete account with existing transactions".to_string());
        }

        // Check if account has children
        let children_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM accounts WHERE parent_id = ?"
        )
        .bind(&id)
        .fetch_one(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        if children_count > 0 {
            return Err("Cannot delete account with child accounts".to_string());
        }

        sqlx::query("DELETE FROM accounts WHERE id = ?")
            .bind(&id)
            .execute(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    #[tauri::command]
    pub async fn get_account_balance(
        state: State<'_, Arc<Database>>,
        id: String,
    ) -> Result<i64, String> {
        let balance: i64 = sqlx::query_scalar("SELECT balance FROM accounts WHERE id = ?")
            .bind(&id)
            .fetch_one(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;
        Ok(balance)
    }

    #[tauri::command]
    pub async fn get_account_tree(state: State<'_, Arc<Database>>) -> Result<Vec<AccountTreeNode>, String> {
        let accounts = get_accounts(state.inner().clone()).await?;
        
        let mut account_map: std::collections::HashMap<String, AccountTreeNode> = std::collections::HashMap::new();
        for account in accounts {
            account_map.insert(account.id.clone(), AccountTreeNode {
                account: account.clone(),
                children: Vec::new(),
            });
        }

        let mut roots = Vec::new();
        let mut account_ids: Vec<String> = account_map.keys().cloned().collect();
        
        for id in account_ids {
            if let Some(account) = account_map.get(&id).cloned() {
                if let Some(parent_id) = &account.account.parent_id {
                    if let Some(parent) = account_map.get_mut(parent_id) {
                        parent.children.push(account);
                    } else {
                        roots.push(account);
                    }
                } else {
                    roots.push(account);
                }
            }
        }

        fn sort_tree(nodes: &mut Vec<AccountTreeNode>) {
            nodes.sort_by(|a, b| a.account.name.cmp(&b.account.name));
            for node in nodes {
                sort_tree(&mut node.children);
            }
        }

        sort_tree(&mut roots);
        Ok(roots)
    }

    #[tauri::command]
    pub async fn get_account_balance(state: State<'_, Arc<Database>>, id: String) -> Result<i64, String> {
        let balance: i64 = sqlx::query_scalar("SELECT balance FROM accounts WHERE id = ?")
            .bind(&id)
            .fetch_one(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;
        Ok(balance)
    }
}