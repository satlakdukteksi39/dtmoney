use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite, Row, FromRow};
use uuid::Uuid;
use chrono::{DateTime, Utc, NaiveDateTime, Datelike};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::sync::Arc;

pub type DbPool = Pool<Sqlite>;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Account {
    pub id: String,
    pub name: String,
    pub account_type: String,
    pub currency: String,
    pub balance: i64,
    pub parent_id: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Transaction {
    pub id: String,
    pub date: DateTime<Utc>,
    pub description: Option<String>,
    pub amount: i64,
    pub from_account_id: Option<String>,
    pub to_account_id: Option<String>,
    pub category_id: Option<String>,
    pub tags: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub category_type: String,
    pub parent_id: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub budget_limit: Option<i64>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Budget {
    pub id: String,
    pub category_id: String,
    pub period_start: DateTime<Utc>,
    pub period_end: DateTime<Utc>,
    pub limit_amount: i64,
    pub alert_threshold: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Attachment {
    pub id: String,
    pub transaction_id: String,
    pub file_path: String,
    pub mime_type: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountTreeNode {
    pub account: Account,
    pub children: Vec<AccountTreeNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionWithDetails {
    #[serde(flatten)]
    pub transaction: Transaction,
    pub from_account_name: Option<String>,
    pub to_account_name: Option<String>,
    pub category_name: Option<String>,
    pub category_color: Option<String>,
    pub category_icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BudgetProgress {
    pub budget: Budget,
    pub category: Category,
    pub spent: i64,
    pub percentage: f64,
    pub is_over: bool,
    pub is_warning: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpendingByCategory {
    pub category_id: String,
    pub category_name: String,
    pub category_color: String,
    pub category_icon: Option<String>,
    pub amount: i64,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpendingByMonth {
    pub month: String,
    pub income: i64,
    pub expense: i64,
    pub net: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IncomeVsExpense {
    pub period: String,
    pub income: i64,
    pub expense: i64,
    pub net: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetWorthPoint {
    pub date: DateTime<Utc>,
    pub assets: i64,
    pub liabilities: i64,
    pub net_worth: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CashFlowPoint {
    pub date: DateTime<Utc>,
    pub inflow: i64,
    pub outflow: i64,
    pub net: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BudgetAlert {
    pub budget: Budget,
    pub category: Category,
    pub spent: i64,
    pub percentage: f64,
    pub alert_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionWithDetails {
    pub transaction: Transaction,
    pub from_account_name: Option<String>,
    pub to_account_name: Option<String>,
    pub category_name: Option<String>,
    pub category_color: Option<String>,
    pub category_icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BudgetProgress {
    pub budget: Budget,
    pub category: Category,
    pub spent: i64,
    pub percentage: f64,
    pub is_over: bool,
    pub is_warning: bool,
    pub remaining: i64,
    pub days_remaining: i64,
}

pub struct Database {
    pool: Pool<Sqlite>,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = SqlitePoolOptions::new()
            .max_connections(10)
            .connect(database_url)
            .await?;

        Ok(Self { pool })
    }

    pub async fn migrate(&self) -> Result<()> {
        sqlx::migrate!("./migrations").run(&self.pool).await?;
        Ok(())
    }

    pub fn pool(&self) -> &Pool<Sqlite> {
        &self.pool
    }
}

impl Clone for Database {
    fn clone(&self) -> Self {
        Self { pool: self.pool.clone() }
    }
}

impl FromRow<'_, SqliteRow> for Account {
    fn from_row(row: &SqliteRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            account_type: row.try_get("account_type")?,
            currency: row.try_get("currency")?,
            balance: row.try_get("balance")?,
            parent_id: row.try_get("parent_id")?,
            is_active: row.try_get("is_active")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
        })
    }
}

impl FromRow<'_, SqliteRow> for Transaction {
    fn from_row(row: &SqliteRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            date: row.try_get("date")?,
            description: row.try_get("description")?,
            amount: row.try_get("amount")?,
            from_account_id: row.try_get("from_account_id")?,
            to_account_id: row.try_get("to_account_id")?,
            category_id: row.try_get("category_id")?,
            tags: row.try_get("tags")?,
            notes: row.try_get("notes")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
        })
    }
}

impl FromRow<'_, SqliteRow> for Category {
    fn from_row(row: &SqliteRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            category_type: row.try_get("category_type")?,
            parent_id: row.try_get("parent_id")?,
            icon: row.try_get("icon")?,
            color: row.try_get("color")?,
            budget_limit: row.try_get("budget_limit")?,
            is_active: row.try_get("is_active")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
        })
    }
}

impl FromRow<'_, SqliteRow> for Budget {
    fn from_row(row: &SqliteRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            category_id: row.try_get("category_id")?,
            period_start: row.try_get("period_start")?,
            period_end: row.try_get("period_end")?,
            limit_amount: row.try_get("limit_amount")?,
            alert_threshold: row.try_get("alert_threshold")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
        })
    }
}

impl FromRow<'_, SqliteRow> for Attachment {
    fn from_row(row: &SqliteRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            transaction_id: row.try_get("transaction_id")?,
            file_path: row.try_get("file_path")?,
            mime_type: row.try_get("mime_type")?,
            created_at: row.try_get("created_at")?,
        })
    }
}