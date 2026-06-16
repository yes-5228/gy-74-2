import { BellRing } from 'lucide-react'
import { SectionHeader } from '../components/SectionHeader'

export function RemindersPage({ data }) {
  return (
    <div className="page-stack">
      <SectionHeader title="到期提醒" description="集中查看即将到期或已过期的客户疗程，避免遗漏跟进。" />
      <div className="data-grid">
        {data.reminders.map((reminder) => (
          <article className="data-card reminder-card" key={reminder.id}>
            <div className="card-row">
              <div>
                <strong>{reminder.customer_name}</strong>
                <span>{reminder.customer_phone}</span>
              </div>
              <BellRing size={20} />
            </div>
            <p>{reminder.package_name}</p>
            <div className="meta-row">
              <span>剩余 {reminder.sessions_remaining} 次</span>
              <span>{new Date(reminder.expires_at).toLocaleDateString('zh-CN')}</span>
            </div>
            <span className={reminder.days_left < 0 ? 'badge danger' : 'badge'}>
              {reminder.reason} · {reminder.days_left} 天
            </span>
          </article>
        ))}
        {data.reminders.length === 0 && <div className="empty-state">暂无到期提醒</div>}
      </div>
    </div>
  )
}
