import { Link } from 'react-router-dom'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  CreditCard,
  Plus,
  ShoppingBag,
  Car,
  BarChart3,
} from 'lucide-react'

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Saldo Total</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                Rp 127.500.000
              </p>
              <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>+12,5% dari bulan lalu</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pemasukan Bulan Ini</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                Rp 25.000.000
              </p>
              <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>+15% dari bulan lalu</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pengeluaran Bulan Ini</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                Rp 18.500.000
              </p>
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                <span>+8% dari bulan lalu</span>
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <button className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
            <Plus className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-medium text-slate-900">Transaksi Baru</p>
          <p className="text-sm text-slate-500">Catat pengeluaran/pemasukan</p>
        </button>
        <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <p className="font-medium text-slate-900">Tambah Akun</p>
          <p className="text-sm text-slate-500">Bank, E-Wallet, dll</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-2">
            <Target className="w-5 h-5 text-amber-600" />
          </div>
          <p className="font-medium text-slate-900">Buat Anggaran</p>
          <p className="text-sm text-slate-500">Kelola budget bulanan</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <p className="font-medium text-slate-900">Laporan</p>
          <p className="text-sm text-slate-500">Lihat analisis keuangan</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Transaksi Terbaru</h3>
            <Link to="/transactions" className="text-sm text-emerald-600 hover:underline font-medium">
              Lihat semua
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-600">07/11/2026</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">Gaji Bulanan</p>
                  <p className="text-xs text-slate-500">PT. Maju Jaya</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <Wallet className="w-3 h-3 mr-1" />
                    Pemasukan
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-emerald-600">+ Rp 15.000.000</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-600">07/11/2026</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">Belanja Bulanan</p>
                  <p className="text-xs text-slate-500">Supermarket</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <ShoppingBag className="w-3 h-3 mr-1" />
                    Belanja
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-red-600">- Rp 2.500.000</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-600">06/11/2026</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">Transportasi</p>
                  <p className="text-xs text-slate-500">Gojek/Transport</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Car className="w-3 h-3 mr-1" />
                    Transport
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-red-600">- Rp 150.000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard