import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Package,
  Sparkles,
} from 'lucide-react'
import { api } from './api/client'
import { AppShell } from './components/AppShell'
import { Dashboard } from './pages/Dashboard'
import { ServiceItemsPage } from './pages/ServiceItemsPage'
import { PackagesPage } from './pages/PackagesPage'
import { TreatmentPlansPage } from './pages/TreatmentPlansPage'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { RemindersPage } from './pages/RemindersPage'

const navItems = [
  { key: 'dashboard', label: '经营总览', icon: LayoutDashboard },
  { key: 'services', label: '套餐项目', icon: Sparkles },
  { key: 'packages', label: '护理套餐', icon: Package },
  { key: 'plans', label: '疗程次数', icon: ClipboardList },
  { key: 'appointments', label: '预约服务', icon: CalendarDays },
  { key: 'reminders', label: '到期提醒', icon: Bell },
]

export default function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [data, setData] = useState({
    serviceItems: [],
    packages: [],
    treatmentPlans: [],
    appointments: [],
    reminders: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = async () => {
    setError('')
    const [serviceItems, packages, treatmentPlans, appointments, reminders] = await Promise.all([
      api.listServiceItems(),
      api.listPackages(),
      api.listTreatmentPlans(),
      api.listAppointments(),
      api.listReminders(30),
    ])
    setData({ serviceItems, packages, treatmentPlans, appointments, reminders })
  }

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const pageProps = useMemo(() => ({ data, refresh, setError }), [data])

  const content = {
    dashboard: <Dashboard data={data} />,
    services: <ServiceItemsPage {...pageProps} />,
    packages: <PackagesPage {...pageProps} />,
    plans: <TreatmentPlansPage {...pageProps} />,
    appointments: <AppointmentsPage {...pageProps} />,
    reminders: <RemindersPage data={data} refresh={refresh} />,
  }[activeView]

  return (
    <AppShell
      navItems={navItems}
      activeView={activeView}
      onNavigate={setActiveView}
      loading={loading}
      error={error}
    >
      {content}
    </AppShell>
  )
}
