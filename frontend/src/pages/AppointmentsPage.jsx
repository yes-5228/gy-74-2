import { useMemo, useState } from 'react'
import { api } from '../api/client'
import { SelectInput, SubmitButton, TextArea, TextInput } from '../components/Forms'
import { SectionHeader } from '../components/SectionHeader'

const initialForm = {
  customer_name: '',
  customer_phone: '',
  service_item_id: '',
  treatment_plan_id: '',
  scheduled_at: '',
  beautician: '',
  notes: '',
}

function isDateExpiredUTC(expiresAt) {
  const now = new Date()
  const expire = new Date(expiresAt)
  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const expireUTC = Date.UTC(expire.getUTCFullYear(), expire.getUTCMonth(), expire.getUTCDate())
  return expireUTC < nowUTC
}

function getBookedCount(planId, appointments) {
  return appointments.filter(
    (apt) => apt.treatment_plan_id === planId && apt.status !== 'completed'
  ).length
}

function getAvailableSessions(plan, appointments) {
  const booked = getBookedCount(plan.id, appointments)
  return plan.sessions_total - plan.sessions_used - booked
}

function isPlanEligible(plan, appointments) {
  if (plan.status !== 'active') return false
  if (isDateExpiredUTC(plan.expires_at)) return false
  if (getAvailableSessions(plan, appointments) <= 0) return false
  return true
}

function planContainsServiceItem(plan, serviceItemId) {
  return plan.package?.items?.some((item) => item.service_item_id === serviceItemId) ?? false
}

export function AppointmentsPage({ data, refresh, setError }) {
  const [form, setForm] = useState(initialForm)

  const eligiblePlans = useMemo(() => {
    return data.treatmentPlans.filter((plan) => isPlanEligible(plan, data.appointments))
  }, [data.treatmentPlans, data.appointments])

  const filteredPlans = useMemo(() => {
    if (!form.service_item_id) return eligiblePlans
    const sid = Number(form.service_item_id)
    return eligiblePlans.filter((plan) => planContainsServiceItem(plan, sid))
  }, [eligiblePlans, form.service_item_id])

  const filteredServiceItems = useMemo(() => {
    if (!form.treatment_plan_id) return data.serviceItems
    const plan = data.treatmentPlans.find((p) => p.id === Number(form.treatment_plan_id))
    if (!plan?.package?.items) return data.serviceItems
    const allowedIds = new Set(plan.package.items.map((item) => item.service_item_id))
    return data.serviceItems.filter((item) => allowedIds.has(item.id))
  }, [data.serviceItems, data.treatmentPlans, form.treatment_plan_id])

  const handleServiceItemChange = (e) => {
    const newServiceItemId = e.target.value
    const updates = { service_item_id: newServiceItemId }
    if (form.treatment_plan_id) {
      const plan = data.treatmentPlans.find((p) => p.id === Number(form.treatment_plan_id))
      if (plan && !planContainsServiceItem(plan, Number(newServiceItemId))) {
        updates.treatment_plan_id = ''
      }
    }
    setForm({ ...form, ...updates })
  }

  const handlePlanChange = (e) => {
    const newPlanId = e.target.value
    const updates = { treatment_plan_id: newPlanId }
    if (newPlanId) {
      const plan = data.treatmentPlans.find((p) => p.id === Number(newPlanId))
      if (plan && form.service_item_id) {
        if (!planContainsServiceItem(plan, Number(form.service_item_id))) {
          const firstItem = plan.package?.items?.[0]
          updates.service_item_id = firstItem ? String(firstItem.service_item_id) : ''
        }
      }
    }
    setForm({ ...form, ...updates })
  }

  const validateForm = () => {
    const sid = Number(form.service_item_id)
    const pid = form.treatment_plan_id ? Number(form.treatment_plan_id) : null
    if (!pid) return null
    const plan = data.treatmentPlans.find((p) => p.id === pid)
    if (!plan) return '所选疗程卡不存在'
    if (plan.status !== 'active') return `疗程卡状态为「${plan.status}」，无法预约`
    if (isDateExpiredUTC(plan.expires_at)) return '疗程卡已过期，无法预约'
    if (getAvailableSessions(plan, data.appointments) <= 0) return '疗程卡次数已约满，无法创建新预约'
    if (!planContainsServiceItem(plan, sid)) return '所选项目不在该疗程卡套餐范围内'
    return null
  }

  const submit = async (event) => {
    event.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    try {
      await api.createAppointment({
        ...form,
        service_item_id: Number(form.service_item_id),
        treatment_plan_id: form.treatment_plan_id ? Number(form.treatment_plan_id) : null,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        status: 'booked',
      })
      setForm(initialForm)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-stack">
      <SectionHeader title="预约服务" description="登记客户护理预约，关联项目、疗程卡和美容师。" />
      <form className="form-grid panel" onSubmit={submit}>
        <TextInput label="客户姓名" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
        <TextInput label="手机号" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
        <SelectInput label="护理项目" value={form.service_item_id} onChange={handleServiceItemChange} required>
          <option value="">选择项目</option>
          {filteredServiceItems.map((item) => (
            <option value={item.id} key={item.id}>{item.name}</option>
          ))}
        </SelectInput>
        <SelectInput label="关联疗程" value={form.treatment_plan_id} onChange={handlePlanChange}>
          <option value="">不关联</option>
          {filteredPlans.map((plan) => {
            const remaining = plan.sessions_total - plan.sessions_used
            const available = getAvailableSessions(plan, data.appointments)
            return (
              <option value={plan.id} key={plan.id}>
                {plan.customer_name} - {plan.package?.name}（剩余{remaining}次/{available}次可约）
              </option>
            )
          })}
        </SelectInput>
        <TextInput label="预约时间" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} required />
        <TextInput label="美容师" value={form.beautician} onChange={(e) => setForm({ ...form, beautician: e.target.value })} />
        <TextArea label="备注" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <SubmitButton>创建预约</SubmitButton>
      </form>

      <div className="timeline panel">
        {data.appointments.map((appointment) => (
          <article className="timeline-item" key={appointment.id}>
            <time>{new Date(appointment.scheduled_at).toLocaleString('zh-CN')}</time>
            <div>
              <strong>{appointment.customer_name}</strong>
              <span>{appointment.service_item?.name} · {appointment.beautician || '未分配'}</span>
              <p>{appointment.notes || '无备注'}</p>
            </div>
            <span className="badge">{appointment.status}</span>
          </article>
        ))}
      </div>
    </div>
  )
}
