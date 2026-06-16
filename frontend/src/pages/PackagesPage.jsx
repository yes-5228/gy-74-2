import { useState } from 'react'
import { api } from '../api/client'
import { SelectInput, SubmitButton, TextArea, TextInput } from '../components/Forms'
import { SectionHeader } from '../components/SectionHeader'

const initialForm = {
  name: '',
  price: 2680,
  validity_days: 120,
  description: '',
  service_item_id: '',
  included_sessions: 4,
}

export function PackagesPage({ data, refresh, setError }) {
  const [form, setForm] = useState(initialForm)

  const submit = async (event) => {
    event.preventDefault()
    if (!form.service_item_id) return
    try {
      await api.createPackage({
        name: form.name,
        price: Number(form.price),
        validity_days: Number(form.validity_days),
        description: form.description,
        items: [
          {
            service_item_id: Number(form.service_item_id),
            included_sessions: Number(form.included_sessions),
          },
        ],
      })
      setForm(initialForm)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-stack">
      <SectionHeader title="护理套餐" description="组合项目、设置价格和有效期，形成可售卖护理套餐。" />
      <form className="form-grid panel" onSubmit={submit}>
        <TextInput label="套餐名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <TextInput label="套餐价格" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <TextInput label="有效天数" type="number" value={form.validity_days} onChange={(e) => setForm({ ...form, validity_days: e.target.value })} />
        <SelectInput label="包含项目" value={form.service_item_id} onChange={(e) => setForm({ ...form, service_item_id: e.target.value })} required>
          <option value="">选择项目</option>
          {data.serviceItems.map((item) => (
            <option value={item.id} key={item.id}>{item.name}</option>
          ))}
        </SelectInput>
        <TextInput label="包含次数" type="number" min="1" value={form.included_sessions} onChange={(e) => setForm({ ...form, included_sessions: e.target.value })} />
        <TextArea label="套餐说明" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <SubmitButton>新增套餐</SubmitButton>
      </form>

      <div className="data-grid">
        {data.packages.map((pkg) => (
          <article className="data-card" key={pkg.id}>
            <div className="card-row">
              <div>
                <strong>{pkg.name}</strong>
                <span>{pkg.validity_days} 天有效</span>
              </div>
              <b>¥{pkg.price}</b>
            </div>
            <p>{pkg.description || '暂无说明'}</p>
            <div className="tag-list">
              {pkg.items.map((item) => (
                <span className="tag" key={item.id}>{item.service_item.name} x {item.included_sessions}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
