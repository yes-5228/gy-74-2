import { useMemo, useState } from 'react'
import { Edit2, X } from 'lucide-react'
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
  status: 'booked',
}

function parseUTCDate(dateStr) {
  const s = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`
  return new Date(s)
}

function formatDateUTC(dateStr) {
  const d = parseUTCDate(dateStr)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function getBookedCount(planId, appointments, excludeAppointmentId = null) {
  return appointments.filter(
    (apt) =>
      apt.treatment_plan_id === planId &&
      apt.status !== 'completed' &&
      apt.id !== excludeAppointmentId
  ).length
}

function getAvailableSessions(plan, appointments, excludeAppointmentId = null) {
  const booked = getBookedCount(plan.id, appointments, excludeAppointmentId)
  return plan.sessions_total - plan.sessions_used - booked
}

function isPlanEligible(plan, appointments, excludeAppointmentId = null) {
  if (plan.status !== 'active') return false
  if (plan.is_expired) return false
  if (getAvailableSessions(plan, appointments, excludeAppointmentId) <= 0) return false
  return true
}

function planContainsServiceItem(plan, serviceItemId) {
  return plan.package?.items?.some((item) => item.service_item_id === serviceItemId) ?? false
}

function toLocalInputDateTime(isoString) {
  const d = new Date(isoString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function AppointmentsPage({ data, refresh, setError }) {
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)

  const eligiblePlans = useMemo(() => {
    return data.treatmentPlans.filter((plan) =>
      isPlanEligible(plan, data.appointments, editingId)
    )
  }, [data.treatmentPlans, data.appointments, editingId])

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

  const startEdit = (appointment) => {
    setEditingId(appointment.id)
    setForm({
      customer_name: appointment.customer_name,
      customer_phone: appointment.customer_phone,
      service_item_id: String(appointment.service_item_id),
      treatment_plan_id: appointment.treatment_plan_id ? String(appointment.treatment_plan_id) : '',
      scheduled_at: toLocalInputDateTime(appointment.scheduled_at),
      beautician: appointment.beautician,
      notes: appointment.notes,
      status: appointment.status,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(initialForm)
  }

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
    if (newPlanId && form.service_item_id) {
      const plan = data.treatmentPlans.find((p) => p.id === Number(newPlanId))
      if (plan && !planContainsServiceItem(plan, Number(form.service_item_id))) {
        updates.service_item_id = ''
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
    if (plan.is_expired) return '疗程卡已过期，无法预约'
    if (getAvailableSessions(plan, data.appointments, editingId) <= 0) {
      return '疗程卡次数已约满，无法创建新预约'
    }
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
      const payload = {
        ...form,
        service_item_id: Number(form.service_item_id),
        treatment_plan_id: form.treatment_plan_id ? Number(form.treatment_plan_id) : null,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      }
      if (editingId) {
        await api.updateAppointment(editingId, payload)
      } else {
        await api.createAppointment(payload)
      }
      cancelEdit()
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-stack">
      <SectionHeader
        title="预约服务"
        description={editingId ? '修改客户护理预约信息' : '登记客户护理预约，关联项目、疗程卡和美容师。'}
      />
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
            const available = getAvailableSessions(plan, data.appointments, editingId)
            const expiredLabel = plan.is_expired ? '（已过期）' : ''
            return (
              <option value={plan.id} key={plan.id}>
                {plan.customer_name} - {plan.package?.name}（剩余{remaining}次/{available}次可约，有效期至 {formatDateUTC(plan.expires_at)}{expiredLabel}）
              </option>
            )
          })}
        </SelectInput>
        <TextInput label="预约时间" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} required />
        <TextInput label="美容师" value={form.beautician} onChange={(e) => setForm({ ...form, beautician: e.target.value })} />
        <SelectInput label="状态" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="booked">已预约</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </SelectInput>
        <TextArea label="备注" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="form-actions">
          <SubmitButton>{editingId ? '保存修改' : '创建预约'}</SubmitButton>
          {editingId && (
            <button type="button" className="secondary-button" onClick={cancelEdit}>
              <X size={16} />
              <span>取消编辑</span>
            </button>
          )}
        </div>
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
            <div className="timeline-actions">
              <span className="badge">{appointment.status}</span>
              <button
                type="button"
                className="icon-button"
                onClick={() => startEdit(appointment)}
                title="编辑预约"
              >
                <Edit2 size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
