import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api'
import type {
  Account,
  Transaction,
  Category,
  Budget,
  BudgetProgress,
  BudgetAlert,
  Attachment,
  SpendingByCategory,
  SpendingByMonth,
  IncomeVsExpense,
  NetWorthPoint,
  CashFlowPoint,
  TransactionSummary,
  Settings,
  TransactionType,
} from '../types'

// Generic invoke wrapper with error handling
async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args)
  } catch (error) {
    console.error(`Error invoking ${command}:`, error)
    throw error
  }
}

// ============ ACCOUNTS ============
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => invokeCommand<Account[]>('get_accounts'),
  })
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ['accounts', id],
    queryFn: () => invokeCommand<Account>('get_account', { id }),
    enabled: !!id,
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>) =>
      invokeCommand<Account>('create_account', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Account> & { id: string }) =>
      invokeCommand<Account>('update_account', { id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeCommand<void>('delete_account', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useAccountTree() {
  return useQuery({
    queryKey: ['accounts', 'tree'],
    queryFn: () => invokeCommand<Account[]>('get_account_tree'),
  })
}

export function useAccountBalance(accountId: string) {
  return useQuery({
    queryKey: ['accounts', accountId, 'balance'],
    queryFn: () => invokeCommand<number>('get_account_balance', { id: accountId }),
    enabled: !!accountId,
  })
}

// ============ TRANSACTIONS ============
export function useTransactions(params?: {
  page?: number
  limit?: number
  type?: TransactionType
  category_id?: string
  from_account_id?: string
  to_account_id?: string
  from_date?: string
  to_date?: string
}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => invokeCommand<Transaction[]>('get_transactions', params || {}),
  })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: () => invokeCommand<Transaction>('get_transaction', { id }),
    enabled: !!id,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) =>
      invokeCommand<Transaction>('create_transaction', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Transaction> & { id: string }) =>
      invokeCommand<Transaction>('update_transaction', { id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeCommand<void>('delete_transaction', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useTransactionSummary(params?: {
  from_date?: string
  to_date?: string
}) {
  return useQuery({
    queryKey: ['transactions', 'summary', params],
    queryFn: () => invokeCommand<TransactionSummary>('get_transaction_summary', params || {}),
  })
}

export function useExportTransactionsCsv(params?: {
  from_date?: string
  to_date?: string
}) {
  return useMutation({
    mutationFn: () => invokeCommand<string>('export_transactions_csv', params || {}),
  })
}

// ============ CATEGORIES ============
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => invokeCommand<Category[]>('get_categories'),
  })
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: () => invokeCommand<Category>('get_category', { id }),
    enabled: !!id,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Category, 'id' | 'created_at' | 'updated_at'>) =>
      invokeCommand<Category>('create_category', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Category> & { id: string }) =>
      invokeCommand<Category>('update_category', { id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeCommand<void>('delete_category', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useCategoryTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => invokeCommand<Category[]>('get_category_tree'),
  })
}

export function useCategoryStats(categoryId: string, params?: {
  from_date?: string
  to_date?: string
}) {
  return useQuery({
    queryKey: ['categories', categoryId, 'stats', params],
    queryFn: () => invokeCommand<any>('get_category_stats', { category_id: categoryId, ...params }),
    enabled: !!categoryId,
  })
}

// ============ BUDGETS ============
export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: () => invokeCommand<Budget[]>('get_budgets'),
  })
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ['budgets', id],
    queryFn: () => invokeCommand<Budget>('get_budget', { id }),
    enabled: !!id,
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) =>
      invokeCommand<Budget>('create_budget', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Budget> & { id: string }) =>
      invokeCommand<Budget>('update_budget', { id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeCommand<void>('delete_budget', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useBudgetProgress(budgetId: string) {
  return useQuery({
    queryKey: ['budgets', budgetId, 'progress'],
    queryFn: () => invokeCommand<BudgetProgress>('get_budget_progress', { budget_id: budgetId }),
    enabled: !!budgetId,
  })
}

export function useBudgetAlerts() {
  return useQuery({
    queryKey: ['budgets', 'alerts'],
    queryFn: () => invokeCommand<BudgetAlert[]>('get_budget_alerts'),
  })
}

// ============ ATTACHMENTS ============
export function useAttachments(transactionId: string) {
  return useQuery({
    queryKey: ['attachments', transactionId],
    queryFn: () => invokeCommand<Attachment[]>('get_attachments', { transaction_id: transactionId }),
    enabled: !!transactionId,
  })
}

export function useUploadAttachment() {
  return useMutation({
    mutationFn: (data: {
      transaction_id: string
      file_name: string
      mime_type: string
      data_base64: string
    }) => invokeCommand<Attachment>('upload_attachment', data),
  })
}

export function useDownloadAttachment() {
  return useMutation({
    mutationFn: (id: string) => invokeCommand<string>('download_attachment', { id }),
  })
}

export function useDeleteAttachment() {
  return useMutation({
    mutationFn: (id: string) => invokeCommand<void>('delete_attachment', { id }),
  })
}

// ============ REPORTS ============
export function useReports(params?: {
  from_date?: string
  to_date?: string
}) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => invokeCommand<{
      spending_by_category: SpendingByCategory[]
      spending_by_month: SpendingByMonth[]
      income_vs_expense: IncomeVsExpense[]
      net_worth: NetWorthPoint[]
      cash_flow: CashFlowPoint[]
    }>('get_reports', params || {}),
  })
}

export function useSpendingByCategory(params?: {
  from_date?: string
  to_date?: string
}) {
  return useQuery({
    queryKey: ['reports', 'spending_by_category', params],
    queryFn: () => invokeCommand<SpendingByCategory[]>('get_spending_by_category', params || {}),
  })
}

export function useSpendingByMonth(year?: number) {
  return useQuery({
    queryKey: ['reports', 'spending_by_month', year],
    queryFn: () => invokeCommand<SpendingByMonth[]>('get_spending_by_month', { year }),
  })
}

export function useIncomeVsExpense(months?: number) {
  return useQuery({
    queryKey: ['reports', 'income_vs_expense', months],
    queryFn: () => invokeCommand<IncomeVsExpense[]>('get_income_vs_expense', { months }),
  })
}

export function useNetWorth() {
  return useQuery({
    queryKey: ['reports', 'net_worth'],
    queryFn: () => invokeCommand<NetWorthPoint[]>('get_net_worth'),
  })
}

export function useCashFlow(months?: number) {
  return useQuery({
    queryKey: ['reports', 'cash_flow', months],
    queryFn: () => invokeCommand<CashFlowPoint[]>('get_cash_flow', { months }),
  })
}

// ============ EXPORT/IMPORT ============
export function useExportData() {
  return useMutation({
    mutationFn: (format: 'json' | 'csv' | 'xlsx') =>
      invokeCommand<string>('export_data', { format }),
  })
}

export function useImportData() {
  return useMutation({
    mutationFn: (jsonData: string) => invokeCommand<any>('import_data', { json_data: jsonData }),
  })
}

export function useImportCsv() {
  return useMutation({
    mutationFn: (data: { csv_data: string; import_type: string }) =>
      invokeCommand<number>('import_csv', data),
  })
}

// ============ SETTINGS ============
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => invokeCommand<Settings>('get_settings'),
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: Settings) => invokeCommand<void>('update_settings', { settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}