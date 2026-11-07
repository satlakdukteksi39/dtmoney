import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings, Account, Transaction, Category, Budget } from '../types'

interface AppState {
  // Settings
  settings: Settings
  setSettings: (settings: Partial<Settings>) => void

  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Selected items
  selectedAccount: Account | null
  setSelectedAccount: (account: Account | null) => void
  selectedTransaction: Transaction | null
  setSelectedTransaction: (transaction: Transaction | null) => void
  selectedCategory: Category | null
  setSelectedCategory: (category: Category | null) => void
  selectedBudget: Budget | null
  setSelectedBudget: (budget: Budget | null) => void

  // Modals
  isModalOpen: boolean
  modalType: string | null
  modalData: unknown
  openModal: (type: string, data?: unknown) => void
  closeModal: () => void

  // Toasts (handled by ToastProvider)
}

const defaultSettings: Settings = {
  currency: 'IDR',
  language: 'id',
  theme: 'system',
  date_format: 'DD/MM/YYYY',
  currency_position: 'before',
  decimal_places: 0,
  first_day_of_week: 1,
  budget_alert_threshold: 0.8,
  auto_backup: true,
  backup_interval_days: 7,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      theme: 'system',
      setTheme: (theme) => set({ theme }),

      selectedAccount: null,
      setSelectedAccount: (account) => set({ selectedAccount: account }),
      selectedTransaction: null,
      setSelectedTransaction: (transaction) => set({ selectedTransaction: transaction }),
      selectedCategory: null,
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      selectedBudget: null,
      setSelectedBudget: (budget) => set({ selectedBudget: budget }),

      isModalOpen: false,
      modalType: null,
      modalData: null,
      openModal: (type, data) => set({ isModalOpen: true, modalType: type, modalData: data }),
      closeModal: () => set({ isModalOpen: false, modalType: null, modalData: null }),
    }),
    {
      name: 'dtmoney-storage',
      partialize: (state) => ({
        settings: state.settings,
        theme: state.theme,
      }),
    }
  )
)