import { FileText, List, BarChart3, Building2 } from 'lucide-react'

const tabs = [
  { id: 'form',      label: 'ใบส่งสินเชื่อ',    icon: FileText },
  { id: 'cases',     label: 'รายการเคส',         icon: List },
  { id: 'dashboard', label: 'Dashboard',          icon: BarChart3 },
]

export default function Layout({ activeTab, onTabChange, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <header className="bg-gradient-to-r from-brand-800 to-brand-700 shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 rounded-lg p-2">
                <Building2 size={22} className="text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-white text-lg leading-none">IKS Finance</h1>
                <p className="text-blue-200 text-xs mt-0.5">ระบบสินเชื่อรถยนต์อีซูซุ</p>
              </div>
            </div>

            {/* Tab navigation */}
            <nav className="flex items-center bg-brand-900/40 rounded-xl p-1 gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-blue-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
