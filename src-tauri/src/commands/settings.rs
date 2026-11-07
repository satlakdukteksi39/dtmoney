// Settings commands
use super::*;
use crate::db::Database;
use tauri::State;

pub mod settings {
    use super::*;

    #[derive(Debug, Serialize, Deserialize)]
    pub struct Settings {
        pub currency: String,
        pub language: String,
        pub theme: String,
        pub date_format: String,
        pub currency_position: String,
        pub decimal_places: u8,
        pub first_day_of_week: u8,
        pub budget_alert_threshold: f64,
        pub auto_backup: bool,
        pub backup_interval_days: u32,
    }

    #[tauri::command]
    pub async fn get_settings(state: State<'_, Arc<Database>>) -> Result<Settings, String> {
        let db = state.inner().pool();
        
        let mut settings = Settings {
            currency: "IDR".to_string(),
            language: "id".to_string(),
            theme: "system".to_string(),
            date_format: "DD/MM/YYYY".to_string(),
            currency_position: "before".to_string(),
            decimal_places: 0,
            first_day_of_week: 1,
            budget_alert_threshold: 0.8,
            auto_backup: true,
            backup_interval_days: 7,
        };

        let rows = sqlx::query("SELECT key, value FROM settings")
            .fetch_all(state.inner().pool())
            .await
            .map_err(|e| e.to_string())?;

        for row in rows {
            let key: String = row.try_get("key").unwrap_or_default();
            let value: String = row.try_get("value").unwrap_or_default();
            
            match key.as_str() {
                "currency" => settings.currency = value,
                "language" => settings.language = value,
                "theme" => settings.theme = value,
                "date_format" => settings.date_format = value,
                "currency_position" => settings.currency_position = value,
                "decimal_places" => settings.decimal_places = value.parse().unwrap_or(0),
                "first_day_of_week" => settings.first_day_of_week = value.parse().unwrap_or(1),
                "budget_alert_threshold" => settings.budget_alert_threshold = value.parse().unwrap_or(0.8),
                "auto_backup" => settings.auto_backup = value.parse().unwrap_or(true),
                "backup_interval_days" => settings.backup_interval_days = value.parse().unwrap_or(7),
                _ => {}
            }
        }

        Ok(settings)
    }

    #[tauri::command]
    pub async fn update_settings(
        state: State<'_, Arc<Database>>,
        settings: Settings,
    ) -> Result<(), String> {
        let mut tx = state.inner().pool().begin().await.map_err(|e| e.to_string())?;

        let settings_json = serde_json::to_value(&settings).map_err(|e| e.to_string())?;
        
        if let serde_json::Value::Object(map) = settings_json {
            for (key, value) in map {
                let value_str = if value.is_string() {
                    value.as_str().unwrap_or("").to_string()
                } else {
                    value.to_string()
                };
                
                sqlx::query(
                    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)"
                )
                .bind(&key)
                .bind(&value_str)
                .bind(chrono::Utc::now())
                .execute(state.inner().pool())
                .await
                .map_err(|e| e.to_string())?;
        }

        Ok(())
    }
}