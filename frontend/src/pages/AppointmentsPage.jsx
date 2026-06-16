import { useState } from 'react'
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

export function AppointmentsPage({ data, refresh, setError }) {
  const [form, setForm] = useState(initialForm)

  const submit = async (event) => {
    event.preventDefault()
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
        <SelectInput label="护理项目" value={form.service_item_id} onChange={(e) => setForm({ ...form, service_item_id: e.target.value })} required>
          <option value="">选择项目</option>
          {data.serviceItems.map((item) => (
            <option value={item.id} key={item.id}>{item.name}</option>
          ))}
        </SelectInput>
        <SelectInput label="关联疗程" value={form.treatment_plan_id} onChange={(e) => setForm({ ...form, treatment_plan_id: e.target.value })}>
          <option value="">不关联</option>
          {data.treatmentPlans.map((plan) => (
            <option value={plan.id} key={plan.id}>{plan.customer_name} - {plan.package?.name}</option>
          ))}
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
