-- Initial migration for dtmoney database

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    currency TEXT NOT NULL DEFAULT 'IDR',
    balance INTEGER NOT NULL DEFAULT 0,
    parent_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_accounts_parent_id ON accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);

-- Transactions table (double-entry)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date DATETIME NOT NULL,
    description TEXT,
    amount INTEGER NOT NULL,
    from_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    to_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    tags TEXT,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date_desc ON transactions(date DESC);

-- Categories table (hierarchical)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_type TEXT NOT NULL CHECK (category_type IN ('income', 'expense', 'transfer')),
    parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    icon TEXT,
    color TEXT,
    budget_limit INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    period_start DATETIME NOT NULL,
    period_end DATETIME NOT NULL,
    limit_amount INTEGER NOT NULL,
    alert_threshold REAL NOT NULL DEFAULT 0.8,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period_start, period_end);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    mime_type TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attachments_transaction ON attachments(transaction_id);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
('currency', 'IDR'),
('language', 'id'),
('theme', 'system'),
('date_format', 'DD/MM/YYYY'),
('currency_position', 'before'),
('decimal_places', '0'),
('first_day_of_week', '1'),
('budget_alert_threshold', '0.8'),
('auto_backup', 'true'),
('backup_interval_days', '7');

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_accounts_timestamp
AFTER UPDATE ON accounts
BEGIN
    UPDATE accounts SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp
AFTER UPDATE ON transactions
BEGIN
    UPDATE transactions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_categories_timestamp
AFTER UPDATE ON categories
BEGIN
    UPDATE categories SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_budgets_timestamp
AFTER UPDATE ON budgets
BEGIN
    UPDATE budgets SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Default categories
INSERT OR IGNORE INTO categories (id, name, category_type, icon, color, is_active) VALUES
('cat_income_salary', 'Gaji', 'income', 'briefcase', '#10B981', 1),
('cat_income_freelance', 'Freelance', 'income', 'laptop', '#10B981', 1),
('cat_income_investment', 'Investasi', 'income', 'trending-up', '#10B981', 1),
('cat_income_other', 'Lainnya', 'income', 'plus-circle', '#10B981', 1),

('cat_expense_food', 'Makanan & Minuman', 'expense', 'utensils', '#EF4444', 1),
('cat_expense_transport', 'Transportasi', 'expense', 'car', '#EF4444', 1),
('cat_expense_shopping', 'Belanja', 'expense', 'shopping-bag', '#EF4444', 1),
('cat_expense_entertainment', 'Hiburan', 'expense', 'film', '#EF4444', 1),
('cat_expense_health', 'Kesehatan', 'expense', 'heart', '#EF4444', 1),
('cat_expense_education', 'Pendidikan', 'expense', 'book-open', '#EF4444', 1),
('cat_expense_bills', 'Tagihan & Utilitas', 'expense', 'file-text', '#EF4444', 1),
('cat_expense_other', 'Lainnya', 'expense', 'more-horizontal', '#EF4444', 1),

('cat_transfer_internal', 'Transfer Internal', 'transfer', 'repeat', '#6366F1', 1),
('cat_transfer_external', 'Transfer Eksternal', 'transfer', 'send', '#6366F1', 1);

-- Default accounts
INSERT OR IGNORE INTO accounts (id, name, account_type, currency, balance, is_active) VALUES
('acc_cash', 'Tunai', 'asset', 'IDR', 0, 1),
('acc_bank_bca', 'BCA', 'asset', 'IDR', 0, 1),
('acc_bank_mandiri', 'Mandiri', 'asset', 'IDR', 0, 1),
('acc_ewallet_gopay', 'GoPay', 'asset', 'IDR', 0, 1),
('acc_ewallet_ovo', 'OVO', 'asset', 'IDR', 0, 1),
('acc_ewallet_dana', 'DANA', 'asset', 'IDR', 0, 1),
('acc_credit_card', 'Kartu Kredit', 'liability', 'IDR', 0, 1),
('acc_receivables', 'Piutang', 'asset', 'IDR', 0, 1),
('acc_payables', 'Hutang', 'liability', 'IDR', 0, 1);