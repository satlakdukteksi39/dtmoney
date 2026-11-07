import { useState } from 'react'
import {
  Plus,
  Search,
  Wallet,
  Edit3,
  Trash2,
} from 'lucide-react'
import { useAccounts, useDeleteAccount } from '../hooks/useApi'
import { formatCurrency } from '../utils/format'
import { Account, AccountType } from '../types'

export function Accounts() {
  const { data: accounts = [] } = useAccounts()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<AccountType | 'all'>('all')

  const deleteAccount = useDeleteAccount()

  const filteredAccounts = accounts.filter((acc: Account) => {
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || acc.account_type === filterType
    return matchesSearch && matchesType
  })

  const handleEdit = (account: Account) => {
    console.log('Edit account:', account)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus akun ini?')) return
    try {
      await deleteAccount.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Akun</h1>
          <p className="text-slate-500 mt-1">Kelola akun bank, e-wallet, kartu kredit, dan aset lainnya</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Akun
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            placeholder="Cari akun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as AccountType | 'all')}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Semua Jenis</option>
          <option value="asset">Aset</option>
          <option value="liability">Liabilitas</option>
          <option value="equity">Ekuitas</option>
          <option value="income">Pendapatan</option>
          <option value="expense">Pengeluaran</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Akun</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Jenis</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{account.name}</p>
                        {account.parent_id && (
                          <p className="text-xs text-slate-500">Sub-akun</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      account.account_type === 'asset' ? 'bg-emerald-100 text-emerald-700' :
                      account.account_type === 'liability' ? 'bg-red-100 text-red-700' :
                      account.account_type === 'equity' ? 'bg-purple-100 text-purple-700' :
                      account.account_type === 'income' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {['Aset', 'Liabilitas', 'Ekuitas', 'Pendapatan', 'Pengeluaran'][
                        ['asset', 'liability', 'equity', 'income', 'expense'].indexOf(account.account_type)
                      ]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-mono font-semibold text-slate-900">
                      {formatCurrency(account.balance)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      account.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {account.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg hover:text-emerald-600 transition-colors"
                        aria-label="Edit akun"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        aria-label="Hapus akun"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Accounts