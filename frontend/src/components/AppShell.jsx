import { RefreshCw } from 'lucide-react'

export function AppShell({ navItems, activeView, onNavigate, loading, error, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">B</span>
          <div>
            <strong>BeautyCare</strong>
            <small>护理套餐系统</small>
          </div>
        </div>
        <nav className="nav-list" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                className={activeView === item.key ? 'nav-item active' : 'nav-item'}
                onClick={() => onNavigate(item.key)}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Salon operations</p>
            <h1>美容院护理套餐系统</h1>
          </div>
          <div className="status-pill">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>{loading ? '加载中' : '已同步'}</span>
          </div>
        </header>
        {error && <div className="alert">{error}</div>}
        {loading ? <div className="empty-state">正在加载门店数据...</div> : children}
      </main>
    </div>
  )
}
