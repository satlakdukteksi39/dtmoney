export interface Account {
  id: string
  name: string
  account_type: AccountType
  currency: string
  balance: number
  parent_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense'

export interface AccountTreeNode {
  account: Account
  children: AccountTreeNode[]
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: TransactionType
  from_account_id: string | null
  to_account_id: string | null
  category_id: string | null
  tags: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  from_account_name?: string
  to_account_name?: string
  category_name?: string
  category_color?: string
  category_icon?: string
}

export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Category {
  id: string
  name: string
  category_type: CategoryType
  parent_id: string | null
  icon: string | null
  color: string
  budget_limit: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CategoryType = 'income' | 'expense' | 'transfer'

export interface CategoryTreeNode {
  category: Category
  children: CategoryTreeNode[]
}

export interface Budget {
  id: string
  category_id: string
  period_start: string
  period_end: string
  limit_amount: number
  alert_threshold: number
  created_at: string
  updated_at: string
  category?: Category
  spent?: number
}

export interface BudgetProgress {
  budget: Budget
  category: Category
  spent: number
  percentage: number
  is_over: boolean
  is_warning: boolean
  remaining: number
  days_remaining: number
}

export interface BudgetAlert {
  budget: Budget
  category: Category
  spent: number
  percentage: number
  alert_type: 'warning' | 'over'
}

export interface Attachment {
  id: string
  transaction_id: string
  file_path: string
  mime_type: string
  created_at: string
}

export interface SpendingByCategory {
  category_id: string
  category_name: string
  category_color: string
  category_icon: string | null
  amount: number
  percentage: number
}

export interface SpendingByMonth {
  month: string
  income: number
  expense: number
  net: number
}

export interface IncomeVsExpense {
  period: string
  income: number
  expense: number
  net: number
}

export interface NetWorthPoint {
  date: string
  assets: number
  liabilities: number
  net_worth: number
}

export interface CashFlowPoint {
  date: string
  inflow: number
  outflow: number
  net: number
}

export interface TransactionSummary {
  total_income: number
  total_expense: number
  net: number
  transaction_count: number
}

export interface Settings {
  currency: string
  language: string
  theme: string
  date_format: string
  currency_position: string
  decimal_places: number
  first_day_of_week: number
  budget_alert_threshold: number
  auto_backup: boolean
  backup_interval_days: number
}