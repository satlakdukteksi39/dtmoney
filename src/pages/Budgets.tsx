import React, { useState } from 'react'
import {
  Plus,
  Target,
  Edit3,
  Trash2,
  X,
} from 'lucide-react'
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '../hooks/useApi'
import { useCategories } from '../hooks/useApi'
import { Budget } from '../types'
import { formatCurrency, formatDate } from '../utils/format'

export function Budgets() {
  const { data: budgets = [] } = useBudgets()
  const { data: categories = [] } = useCategories()
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<any>(null)
  const [formData, setFormData] = useState({
    category_id: '',
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    limit_amount: 0,
    alert_threshold: 0.8,
  })

  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()
  const deleteBudget = useDeleteBudget()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingBudget) {
        await updateBudget.mutateAsync({ id: editingBudget.id, ...formData })
      } else {
        await createBudget.mutateAsync(formData)
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving budget:', error)
    }
  }

  const handleEdit = (budget: any) => {
    setEditingBudget(budget)
    setFormData({
      category_id: budget.category_id,
      period_start: budget.period_start.split('T')[0],
      period_end: budget.period_end.split('T')[0],
      limit_amount: budget.limit_amount,
      alert_threshold: budget.alert_threshold,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus anggaran ini?')) return
    try {
      await deleteBudget.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  const resetForm = () => {
    setEditingBudget(null)
    setFormData({
      category_id: '',
      period_start: new Date().toISOString().split('T')[0],
      period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      limit_amount: 0,
      alert_threshold: 0.8,
    })
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingBudget(null)
    setFormData({
      category_id: '',
      period_start: new Date().toISOString().split('T')[0],
      period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      limit_amount: 0,
      alert_threshold: 0.8,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Anggaran</h1>
          <p className="text-slate-500 mt-1">Kelola anggaran bulanan per kategori</p>
        </div>
        <button onClick={() => { setEditingBudget(null); setShowModal(true) }} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Anggaran
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((budget: Budget) => {
          const spent = budget.spent ?? 0
          const progress = budget.limit_amount > 0 ? (spent / budget.limit_amount) * 100 : 0

          return (
            <div key={budget.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:border-emerald-300 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{budget.category?.name || 'Kategori'}</p>
                    <p className="text-sm text-slate-500">{budget.category?.category_type || 'expense'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${spent > budget.limit_amount ? 'bg-red-100 text-red-700' : spent / budget.limit_amount >= 0.8 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {spent > budget.limit_amount ? 'Over' : progress >= 80 ? 'Warning' : 'OK'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Terpakai</span>
                  <span className="font-medium text-slate-900">{formatCurrency(spent)} / {formatCurrency(budget.limit_amount)}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded ${spent > budget.limit_amount ? 'bg-red-500' : progress >= 80 ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-300`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-500">Periode: {formatDate(budget.period_start)} - {formatDate(budget.period_end)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg hover:text-emerald-600 transition-colors"
                    aria-label="Edit anggaran"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    aria-label="Hapus anggaran"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        )}

        {budgets.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada anggaran</h3>
            <p className="text-slate-500 mb-4">Mulai kelola keuangan dengan membuat anggaran pertamamu</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Buat Anggaran Pertama
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingBudget ? 'Edit Anggaran' : 'Buat Anggaran Baru'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Kategori</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Limit Anggaran</label>
                <input
                  type="number"
                  value={formData.limit_amount}
                  onChange={(e) => setFormData({ ...formData, limit_amount: parseInt(e.target.value) || 0 })}
                  className="input"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="label">Threshold Peringatan (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.alert_threshold * 100}
                  onChange={(e) => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) / 100 })}
                  className="input"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  {editingBudget ? 'Update' : 'Buat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Budgets