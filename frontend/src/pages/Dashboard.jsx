import { CalendarDays, Clock, Wallet } from 'lucide-react'
import { StatCard } from '../components/StatCard'

function money(value) {
  return `¥${Number(value || 0).toLocaleString('zh-CN')}`
}

export function Dashboard({ data }) {
  const activePlans = data.treatmentPlans.filter((plan) => plan.status === 'active')
  const bookedAppointments = data.appointments.filter((appointment) => appointment.status === 'booked')
  const packageRevenue = data.packages.reduce((sum, item) => sum + Number(item.price || 0), 0)

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard label="护理项目" value={data.serviceItems.length} hint="可被套餐和预约引用" />
        <StatCard label="在用疗程" value={activePlans.length} hint="含剩余次数和有效期" />
        <StatCard label="待处理预约" value={bookedAppointments.length} hint="预约状态为 booked" />
        <StatCard label="套餐标价合计" value={money(packageRevenue)} hint="当前套餐目录总额" />
      </section>

      <section className="split-layout">
        <div className="panel">
          <div className="panel-title">
            <CalendarDays size={18} />
            <h2>近期预约</h2>
          </div>
          <div className="table-list">
            {data.appointments.slice(0, 5).map((appointment) => (
              <div className="list-row" key={appointment.id}>
                <div>
                  <strong>{appointment.customer_name}</strong>
                  <span>{appointment.service_item?.name}</span>
                </div>
                <time>{new Date(appointment.scheduled_at).toLocaleString('zh-CN')}</time>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <Clock size={18} />
            <h2>到期提醒</h2>
          </div>
          <div className="table-list">
            {data.reminders.slice(0, 5).map((reminder) => (
              <div className="list-row" key={reminder.id}>
                <div>
                  <strong>{reminder.customer_name}</strong>
                  <span>{reminder.package_name}</span>
                </div>
                <span className={reminder.days_left < 0 ? 'badge danger' : 'badge'}>
                  {reminder.days_left} 天
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <Wallet size={18} />
          <h2>套餐目录</h2>
        </div>
        <div className="package-strip">
          {data.packages.map((pkg) => (
            <article className="package-card" key={pkg.id}>
              <strong>{pkg.name}</strong>
              <span>{money(pkg.price)}</span>
              <small>{pkg.validity_days} 天有效</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
