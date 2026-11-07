export function formatCurrency(amount: number, currency: string = 'IDR', locale: string = 'id-ID'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyWithDecimals(amount: number, currency: string = 'IDR', decimals: number = 0): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount)
}

export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

export function formatDateTime(dateString: string, locale: string = 'id-ID'): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffDays > 0) {
    return `${diffDays} hari lalu`
  } else if (diffHours > 0) {
    return `${diffHours} jam lalu`
  } else if (diffMinutes > 0) {
    return `${diffMinutes} menit lalu`
  } else {
    return 'Baru saja'
  }
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatAccountType(type: string): string {
  const types: Record<string, string> = {
    asset: 'Aset',
    liability: 'Liabilitas',
    equity: 'Ekuitas',
    income: 'Pendapatan',
    expense: 'Pengeluaran',
  }
  return types[type] || type
}

export function formatCategoryType(type: string): string {
  const types: Record<string, string> = {
    income: 'Pendapatan',
    expense: 'Pengeluaran',
    transfer: 'Transfer',
  }
  return types[type] || type
}

export function formatTransactionType(type: string): string {
  const types: Record<string, string> = {
    income: 'Pemasukan',
    expense: 'Pengeluaran',
    transfer: 'Transfer',
  }
  return types[type] || type
}

export function getAccountTypeColor(type: string): string {
  const colors: Record<string, string> = {
    asset: 'bg-emerald-100 text-emerald-700',
    liability: 'bg-red-100 text-red-700',
    equity: 'bg-purple-100 text-purple-700',
    income: 'bg-emerald-100 text-emerald-700',
    expense: 'bg-red-100 text-red-700',
  }
  return colors[type] || 'bg-slate-100 text-slate-700'
}

export function getCategoryTypeColor(type: string): string {
  const colors: Record<string, string> = {
    income: 'bg-emerald-100 text-emerald-700',
    expense: 'bg-red-100 text-red-700',
    transfer: 'bg-blue-100 text-blue-700',
  }
  return colors[type] || 'bg-slate-100 text-slate-700'
}

export function getTransactionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    income: 'text-emerald-600',
    expense: 'text-red-600',
    transfer: 'text-blue-600',
  }
  return colors[type] || 'text-slate-600'
}