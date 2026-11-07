import { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  Download,
  Filter,
  FileText,
} from 'lucide-react'
import { useReports } from '../hooks/useApi'

export function Reports() {
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [selectedReport, setSelectedReport] = useState<'overview' | 'spending' | 'income' | 'cashflow' | 'networth'>('overview')
  useReports()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Keuangan</h1>
          <p className="text-slate-500 mt-1">Analisis dan visualisasi keuangan Anda</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="date"
              value={dateRange.from?.toISOString().split('T')[0] || ''}
              onChange={(e) => setDateRange({ ...dateRange, from: new Date(e.target.value) })}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <span className="text-slate-400 px-2">s/d</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="date"
              value={dateRange.to?.toISOString().split('T')[0] || ''}
              onChange={(e) => setDateRange({ ...dateRange, to: new Date(e.target.value) })}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Ringkasan', icon: BarChart3 },
          { id: 'spending', label: 'Pengeluaran', icon: TrendingDown },
          { id: 'income', label: 'Pemasukan', icon: TrendingUp },
          { id: 'cashflow', label: 'Arus Kas', icon: DollarSign },
          { id: 'networth', label: 'Net Worth', icon: PieChart },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id as typeof selectedReport)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedReport === tab.id
                ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500">Total Pemasukan</p>
              <p className="text-2xl font-bold text-emerald-600">Rp 25.000.000</p>
            </div>
            <TrendingUp className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600" />
          </div>
          <div className="h-32 bg-emerald-50 rounded-xl" />
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-600">Rp 18.500.000</p>
            </div>
            <TrendingDown className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600" />
          </div>
          <div className="h-32 bg-red-50 rounded-xl" />
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500">Saldo Bersih</p>
              <p className="text-2xl font-bold text-slate-900">Rp 6.500.000</p>
            </div>
            <DollarSign className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600" />
          </div>
          <div className="h-32 bg-blue-50 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Pengeluaran per Kategori</h3>
          <div className="h-80">
            <div className="flex items-end justify-around h-full px-4">
              {[
                { label: 'Makanan', value: 45, color: '#EF4444' },
                { label: 'Transport', value: 25, color: '#3B82F6' },
                { label: 'Belanja', value: 15, color: '#F59E0B' },
                { label: 'Hiburan', value: 10, color: '#8B5CF6' },
                { label: 'Lainnya', value: 5, color: '#6B7280' },
              ].map((item) => (
                <div key={item.label} className="flex-1 flex flex-col items-end">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${item.value}%`,
                      backgroundColor: item.color,
                    }}
                  />
                  <span className="text-xs text-slate-500 mt-1">{item.label}</span>
                  <span className="text-sm font-medium text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Pemasukan vs Pengeluaran (6 Bulan)</h3>
          <div className="h-80">
            <div className="flex items-end justify-around h-full px-4">
              {[
                { month: 'Jun', income: 25, expense: 18 },
                { month: 'Jul', income: 28, expense: 20 },
                { month: 'Agu', income: 30, expense: 22 },
                { month: 'Sep', income: 27, expense: 19 },
                { month: 'Okt', income: 32, expense: 25 },
                { month: 'Nov', income: 35, expense: 18 },
              ].map((item) => (
                <div key={item.month} className="flex-1 flex flex-col items-center">
                  <div className="flex-1 flex items-end justify-around w-full">
                    <div
                      className="w-8 bg-emerald-500 rounded-t transition-all hover:bg-emerald-400"
                      style={{ height: `${item.income / 35 * 100}%` }}
                    />
                    <div
                      className="w-8 bg-red-500 rounded-t transition-all hover:bg-red-400"
                      style={{ height: `${item.expense / 35 * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 mt-2">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Pengeluaran per Kategori</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Jumlah</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Persentase</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">vs Bulan Lalu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'Makanan & Minuman', amount: 4500000, percentage: 35, change: 12 },
                { name: 'Transportasi', amount: 2500000, percentage: 19, change: -5 },
                { name: 'Belanja', amount: 1800000, percentage: 14, change: 8 },
                { name: 'Hiburan', amount: 1200000, percentage: 9, change: -3 },
                { name: 'Kesehatan', amount: 900000, percentage: 7, change: 2 },
                { name: 'Tagihan & Utilitas', amount: 800000, percentage: 6, change: 0 },
                { name: 'Lainnya', amount: 1300000, percentage: 10, change: -2 },
              ].map((item) => (
                <tr key={item.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <span className="text-slate-400">📦</span>
                      </div>
                      <span className="font-medium text-slate-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">
                    -{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-600">
                    {item.percentage}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${item.change > 0 ? 'text-red-600' : item.change < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {item.change > 0 ? '+' : ''}{item.change}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button className="btn-secondary">
          <Download className="w-4 h-4 mr-2" />
          Ekspor CSV
        </button>
        <button className="btn-secondary">
          <FileText className="w-4 h-4 mr-2" />
          Ekspor Excel
        </button>
        <button className="btn-secondary">
          <Filter className="w-4 h-4 mr-2" />
          Ekspor PDF
        </button>
      </div>
    </div>
  )
}

export default Reports