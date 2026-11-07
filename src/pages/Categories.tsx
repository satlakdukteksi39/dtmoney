import { useState } from 'react'
import {
  Plus,
  Search,
  Tag,
  Edit3,
  Trash2,
} from 'lucide-react'
import { useCategories, useDeleteCategory } from '../hooks/useApi'
import { Category } from '../types'

export function Categories() {
  const { data: categories = [] } = useCategories()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')

  const deleteCategory = useDeleteCategory()

  const filteredCategories = categories.filter((cat: Category) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || cat.category_type === filterType
    return matchesSearch && matchesType
  })

  const handleEdit = (category: any) => {
    console.log('Edit category:', category)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus kategori ini?')) return
    try {
      await deleteCategory.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const typeLabels = {
    income: 'Pendapatan',
    expense: 'Pengeluaran',
    transfer: 'Transfer',
  }

  const typeColors = {
    income: 'bg-emerald-100 text-emerald-700',
    expense: 'bg-red-100 text-red-700',
    transfer: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kategori</h1>
          <p className="text-slate-500 mt-1">Kelola kategori pemasukan, pengeluaran, dan transfer</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            placeholder="Cari kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense' | 'transfer')}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Semua Jenis</option>
          <option value="income">Pendapatan</option>
          <option value="expense">Pengeluaran</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Jenis</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Parent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ikon</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Warna</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget Limit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon || <Tag className="w-5 h-5" />}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">{category.name}</p>
                        {category.parent_id && (
                          <p className="text-xs text-slate-500">Sub-kategori</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[category.category_type]}`}>
                      {typeLabels[category.category_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {category.parent_id ? 'Sub-kategori' : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-8 h-6 rounded border border-slate-200" style={{ backgroundColor: category.color }} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg hover:text-emerald-600 transition-colors"
                        aria-label="Edit kategori"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        aria-label="Hapus kategori"
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

export default Categories