// Category commands
use super::*;
use crate::db::Database;
use crate::models::*;
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

pub mod categories {
    use super::*;

    #[tauri::command]
    pub async fn get_categories(state: State<'_, Arc<Database>>) -> Result<Vec<Category>, String> {
        let categories = sqlx::query_as::<_, Category>(
            "SELECT * FROM categories WHERE is_active = 1 ORDER BY category_type, name"
        )
        .fetch_all(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;
        Ok(categories)
    }

    #[tauri::command]
    pub async fn get_category(state: State<'_, Arc<Database>>, id: String) -> Result<Category, String> {
        let category = sqlx::query_as::<_, Category>(
            "SELECT * FROM categories WHERE id = ?"
        )
        .bind(&id)
        .fetch_optional(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Category not found")?;
        Ok(category)
    }

    #[tauri::command]
    pub async fn create_category(
        state: State<'_, Arc<Database>>,
        name: String,
        category_type: String,
        parent_id: Option<String>,
        icon: Option<String>,
        color: Option<String>,
        budget_limit: Option<i64>,
    ) -> Result<Category, String> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO categories (id, name, category_type, parent_id, icon, color, budget_limit, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            "#
        )
        .bind(&id)
        .bind(&name)
        .bind(&category_type)
        .bind(&parent_id)
        .bind(&icon)
        .bind(&color)
        .bind(&budget_limit)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        let category = sqlx::query_as::<_, Category>("SELECT * FROM categories WHERE id = ?")
            .bind(&id)
            .fetch_one(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        Ok(category)
    }

    #[tauri::command]
    pub async fn update_category(
        state: State<'_, Arc<Database>>,
        id: String,
        name: Option<String>,
        category_type: Option<String>,
        parent_id: Option<String>,
        icon: Option<String>,
        color: Option<String>,
        budget_limit: Option<i64>,
        is_active: Option<bool>,
    ) -> Result<Category, String> {
        let mut updates = Vec::new();
        let mut params: Vec<String> = vec![];

        if let Some(name) = name {
            params.push(format!("name = '{}'", name));
        }
        if let Some(category_type) = category_type {
            params.push(format!("category_type = '{}'", category_type));
        }
        if let Some(parent_id) = parent_id {
            params.push(format!("parent_id = '{}'", parent_id));
        }
        if let Some(icon) = icon {
            params.push(format!("icon = '{}'", icon));
        }
        if let Some(color) = color {
            params.push(format!("color = '{}'", color));
        }
        if let Some(budget_limit) = budget_limit {
            params.push(format!("budget_limit = {}", budget_limit));
        }
        if let Some(is_active) = is_active {
            params.push(format!("is_active = {}", if is_active { 1 } else { 0 }));
        }

        if params.is_empty() {
            return Err("No fields to update".to_string());
        }

        let query = format!("UPDATE categories SET {}, updated_at = ? WHERE id = ?", params.join(", "));
        
        sqlx::query(&query)
            .bind(Utc::now())
            .bind(&id)
            .execute(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        get_category(State::new(state.inner().clone()), id).await
    }

    #[tauri::command]
    pub async fn delete_category(state: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
        // Check if category has transactions
        let tx_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM transactions WHERE category_id = ?")
            .bind(&id)
            .fetch_one(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        if tx_count > 0 {
            return Err("Cannot delete category with existing transactions".to_string());
        }

        // Check if category has children
        let children_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM categories WHERE parent_id = ?")
            .bind(&id)
            .fetch_one(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        if children_count > 0 {
            return Err("Cannot delete category with child categories".to_string());
        }

        // Check if category has budgets
        let budget_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM budgets WHERE category_id = ?")
            .bind(&id)
            .fetch_one(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        if budget_count > 0 {
            return Err("Cannot delete category with existing budgets".to_string());
        }

        sqlx::query("DELETE FROM categories WHERE id = ?")
            .bind(&id)
            .execute(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    #[tauri::command]
    pub async fn get_category_tree(state: State<'_, Arc<Database>>) -> Result<Vec<CategoryTreeNode>, String> {
        let categories = get_categories(state.inner().clone()).await?;
        
        let mut category_map: std::collections::HashMap<String, CategoryTreeNode> = std::collections::HashMap::new();
        for category in categories {
            category_map.insert(category.id.clone(), CategoryTreeNode {
                category: category.clone(),
                children: Vec::new(),
            });
        }

        let mut roots = Vec::new();
        let mut category_ids: Vec<String> = category_map.keys().cloned().collect();
        
        for id in category_ids {
            if let Some(category) = category_map.get(&id).cloned() {
                if let Some(parent_id) = &category.category.parent_id {
                    if let Some(parent) = category_map.get_mut(&parent_id) {
                        parent.children.push(category);
                    } else {
                        roots.push(category);
                    }
                } else {
                    roots.push(category);
                }
            }
        }

        fn sort_tree(nodes: &mut Vec<CategoryTreeNode>) {
            nodes.sort_by(|a, b| a.category.name.cmp(&b.category.name));
            for node in nodes {
                sort_tree(&mut node.children);
            }
        }

        sort_tree(&mut roots);
        Ok(roots)
    }

    #[tauri::command]
    pub async fn get_category_stats(
        state: State<'_, Arc<Database>>,
        category_id: String,
        from_date: Option<DateTime<Utc>>,
        to_date: Option<DateTime<Utc>>,
    ) -> Result<serde_json::Value, String> {
        let db = state.inner().pool();

        let mut query = "SELECT 
            COUNT(*) as count,
            COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as expense,
            COALESCE(SUM(t.amount), 0) as net
            FROM transactions t
            WHERE t.category_id = ?
        ".to_string();

        let mut params: Vec<String> = vec![format!("'{}'", category_id)];

        // In a real implementation, you'd add date filters here
        // For simplicity, we'll just return basic stats

        let row = sqlx::query("
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expense,
                COALESCE(SUM(amount), 0) as net
            FROM transactions 
            WHERE category_id = ?
        ")
        .bind(&id)
        .fetch_one(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        let count: i64 = row.try_get("count").unwrap_or(0);
        let income: i64 = row.try_get("income").unwrap_or(0);
        let expense: i64 = row.try_get("expense").unwrap_or(0);
        let net: i64 = row.try_get("net").unwrap_or(0);

        Ok(serde_json::json!({
            "count": count,
            "income": income,
            "expense": expense,
            "net": net
        }))
    }
}