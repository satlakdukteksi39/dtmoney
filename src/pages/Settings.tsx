import { useState } from 'react'
import {
  Settings as SettingsIcon,
  Shield,
  Palette,
  Globe,
  Database,
  Download,
  Upload,
  Trash2,
  Moon,
  Sun,
  Monitor,
  Save,
  FileText,
} from 'lucide-react'

export function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'currency' | 'backup' | 'security'>('general')
  const [settings, setSettings] = useState({
    currency: 'IDR',
    language: 'id',
    theme: 'system',
    date_format: 'DD/MM/YYYY',
    currency_position: 'before',
    decimal_places: 0,
    first_day_of_week: 1,
    budget_alert_threshold: 80,
    auto_backup: true,
    backup_interval_days: 7,
    email_notifications: true,
    push_notifications: true,
    budget_alerts: true,
    transaction_alerts: true,
    two_factor_auth: false,
    session_timeout: 30,
    primary_color: '#10B981',
  })

  const tabs = [
    { id: 'general', label: 'Umum', icon: SettingsIcon },
    { id: 'appearance', label: 'Tampilan', icon: Palette },
    { id: 'currency', label: 'Mata Uang', icon: Globe },
    { id: 'backup', label: 'Backup', icon: Database },
    { id: 'security', label: 'Keamanan', icon: Shield },
  ]

  const handleSave = async () => {
    console.log('Settings saved:', settings)
    alert('Pengaturan berhasil disimpan!')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan</h1>
          <p className="text-slate-500 mt-1">Kelola preferensi dan pengaturan aplikasi</p>
        </div>
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4 mr-2" />
          Simpan Perubahan
        </button>
      </div>

      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-slate-200 p-2" aria-label="Pengaturan">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors ${
                  activeTab === tab.id ? 'bg-emerald-50 text-emerald-700 font-medium' : ''
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Informasi Umum</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Bahasa</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="input"
                    >
                      <option value="id">Indonesia</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Format Tanggal</label>
                    <select
                      value={settings.date_format}
                      onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                      className="input"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Hari Pertama Minggu</label>
                    <select
                      value={settings.first_day_of_week}
                      onChange={(e) => setSettings({ ...settings, first_day_of_week: parseInt(e.target.value) })}
                      className="input"
                    >
                      <option value={1}>Senin</option>
                      <option value={0}>Minggu</option>
                      <option value={6}>Sabtu</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Desimal Mata Uang</label>
                    <select
                      value={settings.decimal_places}
                      onChange={(e) => setSettings({ ...settings, decimal_places: parseInt(e.target.value) })}
                      className="input"
                    >
                      <option value={0}>0 (Rp 1.000)</option>
                      <option value={2}>2 (Rp 1.000,00)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card p-6 mt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Notifikasi</h3>
                <div className="space-y-4">
                  {[
                    { key: 'email_notifications', label: 'Notifikasi Email', desc: 'Terima notifikasi via email' },
                    { key: 'push_notifications', label: 'Push Notification', desc: 'Terima notifikasi push di perangkat' },
                    { key: 'budget_alerts', label: 'Peringatan Anggaran', desc: 'Notifikasi saat anggaran hampir habis' },
                    { key: 'transaction_alerts', label: 'Notifikasi Transaksi', desc: 'Notifikasi untuk transaksi baru' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded border-2 border-slate-300" />
                        <div>
                          <p className="font-medium text-slate-900">{item.label}</p>
                          <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings[item.key as keyof typeof settings] as boolean}
                        onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                        className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Tema</h3>
                <div className="grid grid-cols-3 gap-4">
                  {['light', 'dark', 'system'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setSettings({ ...settings, theme })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        settings.theme === theme
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl mx-auto mb-3 bg-slate-100 flex items-center justify-center">
                        {theme === 'light' && <Sun className="w-8 h-8 text-amber-500" />}
                        {theme === 'dark' && <Moon className="w-8 h-8 text-indigo-500" />}
                        {theme === 'system' && <Monitor className="w-8 h-8 text-slate-500" />}
                      </div>
                      <p className="text-center font-medium text-slate-900 capitalize">{theme}</p>
                      <p className="text-xs text-slate-500 text-center mt-1">
                        {theme === 'light' && 'Terang'}
                        {theme === 'dark' && 'Gelap'}
                        {theme === 'system' && 'Ikuti Sistem'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-6 mt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Kustomisasi Warna</h3>
                <div className="grid grid-cols-5 gap-3">
                  {['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setSettings({ ...settings, primary_color: color })}
                      className={`w-12 h-12 rounded-xl border-2 transition-all ${
                        settings.primary_color === color
                          ? 'ring-2 ring-emerald-500 ring-offset-2 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Warna ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'currency' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Mata Uang Utama</h3>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="input w-full md:w-64"
                >
                  <option value="IDR">IDR - Rupiah Indonesia</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                  <option value="JPY">JPY - Yen Jepang</option>
                </select>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Format Mata Uang</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Posisi Simbol</label>
                    <select
                      value={settings.currency_position}
                      onChange={(e) => setSettings({ ...settings, currency_position: e.target.value })}
                      className="input"
                    >
                      <option value="before">Sebelum (Rp 1.000)</option>
                      <option value="after">Sesudah (1.000 Rp)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Desimal</label>
                    <select
                      value={settings.decimal_places}
                      onChange={(e) => setSettings({ ...settings, decimal_places: parseInt(e.target.value) })}
                      className="input"
                    >
                      <option value={0}>0 Desimal (Rp 1.000)</option>
                      <option value={2}>2 Desimal (Rp 1.000,00)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Pemisah Ribuan</label>
                    <select className="input">
                      <option value="dot">Titik (1.000)</option>
                      <option value="comma">Koma (1,000)</option>
                      <option value="space">Spasi (1 000)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Pemisah Desimal</label>
                    <select className="input">
                      <option value="comma">Koma (1.000,00)</option>
                      <option value="dot">Titik (1.000.00)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Backup Otomatis</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="font-medium text-slate-900">Backup Otomatis</p>
                      <p className="text-sm text-slate-500">Backup database secara otomatis ke penyimpanan lokal</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.auto_backup}
                      onChange={(e) => setSettings({ ...settings, auto_backup: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="label">Interval Backup</label>
                    <select
                      value={settings.backup_interval_days}
                      onChange={(e) => setSettings({ ...settings, backup_interval_days: parseInt(e.target.value) })}
                      className="input w-40"
                    >
                      <option value={1}>Harian</option>
                      <option value={7}>Mingguan</option>
                      <option value={30}>Bulanan</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Backup Manual</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-primary">
                    <Download className="w-4 h-4 mr-2" />
                    Backup Sekarang (JSON)
                  </button>
                  <button className="btn-secondary">
                    <FileText className="w-4 h-4 mr-2" />
                    Ekspor Excel
                  </button>
                  <button className="btn-secondary">
                    <Upload className="w-4 h-4 mr-2" />
                    Impor Data
                  </button>
                </div>
              </div>

              <div className="card p-6 border-red-200 bg-red-50">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Zona Bahaya</h3>
                <p className="text-red-700 mb-4">Tindakan berikut tidak dapat dibatalkan. Gunakan dengan hati-hati.</p>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-danger">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus Semua Data Transaksi
                  </button>
                  <button className="btn-danger">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset Semua Data (Factory Reset)
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Autentikasi Dua Faktor</h3>
                <div className="flex items-center justify-between py-4 border-b border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">2FA (Two-Factor Authentication)</p>
                    <p className="text-sm text-slate-500">Tambahkan lapisan keamanan ekstra dengan aplikasi autentikator</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.two_factor_auth}
                    onChange={(e) => setSettings({ ...settings, two_factor_auth: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Ubah Password</h3>
                <form className="space-y-4">
                  <div>
                    <label className="label">Password Saat Ini</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Masukkan password saat ini"
                    />
                  </div>
                  <div>
                    <label className="label">Password Baru</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Minimal 8 karakter"
                    />
                  </div>
                  <div>
                    <label className="label">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Ulangi password baru"
                    />
                  </div>
                  <button type="button" className="btn-primary w-full">
                    Ubah Password
                  </button>
                </form>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Timeout Sesi</h3>
                <div className="flex items-center gap-4">
                  <label className="label">Waktu Timeout (menit)</label>
                  <select
                    value={settings.session_timeout}
                    onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) })}
                    className="input w-40"
                  >
                    <option value={15}>15 Menit</option>
                    <option value={30}>30 Menit</option>
                    <option value={60}>1 Jam</option>
                    <option value={120}>2 Jam</option>
                    <option value={480}>8 Jam</option>
                    <option value={0}>Tidak Ada Timeout</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
            <button onClick={handleSave} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              Simpan Semua Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings