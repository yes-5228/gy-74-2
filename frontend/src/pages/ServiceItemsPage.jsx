import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { api } from '../api/client'
import { SectionHeader } from '../components/SectionHeader'
import { SubmitButton, TextArea, TextInput } from '../components/Forms'

const initialForm = {
  name: '',
  category: '面部护理',
  duration_minutes: 60,
  price: 398,
  description: '',
}

export function ServiceItemsPage({ data, refresh, setError }) {
  const [form, setForm] = useState(initialForm)

  const submit = async (event) => {
    event.preventDefault()
    try {
      await api.createServiceItem({
        ...form,
        duration_minutes: Number(form.duration_minutes),
        price: Number(form.price),
      })
      setForm(initialForm)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-stack">
      <SectionHeader title="套餐项目管理" description="维护基础护理项目，供套餐组合和预约服务复用。" />
      <form className="form-grid panel" onSubmit={submit}>
        <TextInput label="项目名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <TextInput label="类别" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <TextInput label="时长(分钟)" type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
        <TextInput label="单次价格" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <TextArea label="项目说明" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <SubmitButton>新增项目</SubmitButton>
      </form>

      <div className="data-grid service-grid">
        {data.serviceItems.map((item) => (
          <article className="data-card" key={item.id}>
            <div className="card-row">
              <div>
                <strong>{item.name}</strong>
                <span>{item.category}</span>
              </div>
              <button
                className="icon-button"
                title="删除项目"
                onClick={async () => {
                  await api.deleteServiceItem(item.id)
                  await refresh()
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p>{item.description || '暂无说明'}</p>
            <div className="meta-row">
              <span>{item.duration_minutes} 分钟</span>
              <span>¥{item.price}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
