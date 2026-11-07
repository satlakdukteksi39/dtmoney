// Attachment commands
use super::*;
use crate::db::Database;
use crate::models::*;
use tauri::State;
use uuid::Uuid;
use chrono::Utc;
use base64::{Engine as _, engine::general_purpose};

pub mod attachments {
    use super::*;

    #[tauri::command]
    pub async fn upload_attachment(
        state: State<'_, Arc<Database>>,
        transaction_id: String,
        file_name: String,
        mime_type: String,
        data_base64: String,
    ) -> Result<Attachment, String> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Decode base64 data
        let data = base64::engine::general_purpose::STANDARD.decode(&data_base64)
            .map_err(|e| e.to_string())?;

        // Save file to local storage
        let file_name = format!("{}_{}", Uuid::new_v4(), file_name);
        let file_path = format!("attachments/{}", file_name);
        
        // Ensure attachments directory exists
        std::fs::create_dir_all("attachments").map_err(|e| e.to_string())?;
        std::fs::write(&file_path, &data).map_err(|e| e.to_string())?;

        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO attachments (id, transaction_id, file_path, mime_type, created_at)
            VALUES (?, ?, ?, ?, ?)
            "#
        )
        .bind(&id)
        .bind(&transaction_id)
        .bind(&file_path)
        .bind(&now)
        .execute(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        let attachment = sqlx::query_as::<_, Attachment>(
            "SELECT * FROM attachments WHERE id = ?"
        )
        .bind(&id)
        .fetch_one(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;

        Ok(attachment)
    }

    #[tauri::command]
    pub async fn get_attachments(
        state: State<'_, Arc<Database>>,
        transaction_id: String,
    ) -> Result<Vec<Attachment>, String> {
        let attachments = sqlx::query_as::<_, Attachment>(
            "SELECT * FROM attachments WHERE transaction_id = ? ORDER BY created_at DESC"
        )
        .bind(&transaction_id)
        .fetch_all(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?;
        Ok(attachments)
    }

    #[tauri::command]
    pub async fn download_attachment(
        state: State<'_, Arc<Database>>,
        id: String,
    ) -> Result<String, String> {
        let attachment = sqlx::query_as::<_, Attachment>(
            "SELECT * FROM attachments WHERE id = ?"
        )
        .bind(&id)
        .fetch_optional(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Attachment not found")?;

        let data = std::fs::read(&attachment.file_path).map_err(|e| e.to_string())?;
        let base64 = base64::engine::general_purpose::STANDARD.encode(&data);
        
        Ok(base64)
    }

    #[tauri::command]
    pub async fn delete_attachment(
        state: State<'_, Arc<Database>>,
        id: String,
    ) -> Result<(), String> {
        let attachment = sqlx::query_as::<_, Attachment>(
            "SELECT * FROM attachments WHERE id = ?"
        )
        .bind(&id)
        .fetch_optional(state.inner().pool())
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Attachment not found")?;

        // Delete file
        std::fs::remove_file(&attachment.file_path).ok();

        sqlx::query("DELETE FROM attachments WHERE id = ?")
            .bind(&id)
            .execute(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        Ok(())
    }
}