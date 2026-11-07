use std::sync::Arc;
use tauri::{Manager, State};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod db;
mod models;
mod commands;

use db::Database;
use commands::*;

#[derive(Debug)]
pub struct AppState {
    db: Arc<Database>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,tauri=debug,sqlx=warn".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let db = Database::new("sqlite:dtmoney.db?mode=rwc").await
        .expect("Failed to connect to database");

    db.migrate().await.expect("Failed to run migrations");

    let app_state = Arc::new(AppState { db: Arc::new(db) });

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_path::init())
        .plugin(tauri_plugin_window::init())
        .plugin(tauri_plugin_shell::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // Account commands
            accounts::get_accounts,
            accounts::get_account,
            accounts::create_account,
            accounts::update_account,
            accounts::delete_account,
            accounts::get_account_balance,
            accounts::get_account_tree,
            // Transaction commands
            transactions::get_transactions,
            transactions::get_transaction,
            transactions::create_transaction,
            transactions::update_transaction,
            transactions::delete_transaction,
            transactions::get_transactions_by_account,
            transactions::get_transactions_by_category,
            transactions::get_transactions_by_date_range,
            transactions::import_transactions,
            transactions::export_transactions,
            // Category commands
            categories::get_categories,
            categories::get_category,
            categories::create_category,
            categories::update_category,
            categories::delete_category,
            categories::get_category_tree,
            // Budget commands
            budgets::get_budgets,
            budgets::get_budget,
            budgets::create_budget,
            budgets::update_budget,
            budgets::delete_budget,
            budgets::get_budget_progress,
            budgets::get_budget_alerts,
            // Category commands
            categories::get_category_stats,
            // Attachment commands
            attachments::upload_attachment,
            attachments::get_attachments,
            attachments::delete_attachment,
            // Reports
            reports::get_spending_by_category,
            reports::get_spending_by_month,
            reports::get_income_vs_expense,
            reports::get_net_worth,
            reports::get_cash_flow,
            // Export/Import
            export::export_data,
            import::import_data,
            // Settings
            settings::get_settings,
            settings::update_settings,
        ])
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window.set_title("dtmoney - Personal Finance Manager").unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}