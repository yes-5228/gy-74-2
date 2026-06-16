import { useState } from 'react'
import { MinusCircle } from 'lucide-react'
import { api } from '../api/client'
import { SelectInput, SubmitButton, TextInput } from '../components/Forms'
import { SectionHeader } from '../components/SectionHeader'

const initialForm = {
  customer_name: '',
  customer_phone: '',
  package_id: '',
  sessions_total: 6,
  expires_at: '',
}

export function TreatmentPlansPage({ data, refresh, setError }) {
  const [form, setForm] = useState(initialForm)

  const submit = async (event) => {
    event.preventDefault()
    try {
      await api.createTreatmentPlan({
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        package_id: Number(form.package_id),
        sessions_total: Number(form.sessions_total),
        sessions_used: 0,
        expires_at: new Date(form.expires_at).toISOString(),
        status: 'active',
      })
      setForm(initialForm)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-stack">
      <SectionHeader title="疗程次数管理" description="给客户开通疗程卡，跟踪总次数、已用次数和到期时间。" />
      <form className="form-grid panel" onSubmit={submit}>
        <TextInput label="客户姓名" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
        <TextInput label="手机号" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
        <SelectInput label="套餐" value={form.package_id} onChange={(e) => setForm({ ...form, package_id: e.target.value })} required>
          <option value="">选择套餐</option>
          {data.packages.map((pkg) => (
            <option value={pkg.id} key={pkg.id}>{pkg.name}</option>
          ))}
        </SelectInput>
        <TextInput label="总次数" type="number" min="1" value={form.sessions_total} onChange={(e) => setForm({ ...form, sessions_total: e.target.value })} />
        <TextInput label="到期日" type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} required />
        <SubmitButton>开通疗程</SubmitButton>
      </form>

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>客户</th>
              <th>套餐</th>
              <th>次数</th>
              <th>到期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {data.treatmentPlans.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.customer_name}<small>{plan.customer_phone}</small></td>
                <td>{plan.package?.name}</td>
                <td>{plan.sessions_used}/{plan.sessions_total}</td>
                <td>{new Date(plan.expires_at).toLocaleDateString('zh-CN')}</td>
                <td><span className="badge">{plan.status}</span></td>
                <td>
                  <button
                    className="secondary-button"
                    onClick={async () => {
                      await api.consumeTreatmentSession(plan.id)
                      await refresh()
                    }}
                    disabled={plan.sessions_remaining <= 0}
                  >
                    <MinusCircle size={15} />
                    <span>扣次</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
