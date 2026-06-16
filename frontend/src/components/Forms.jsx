import { Save } from 'lucide-react'

export function TextInput({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  )
}

export function SelectInput({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  )
}

export function TextArea({ label, ...props }) {
  return (
    <label className="field wide">
      <span>{label}</span>
      <textarea {...props} />
    </label>
  )
}

export function SubmitButton({ children = '保存' }) {
  return (
    <button className="primary-button" type="submit">
      <Save size={16} />
      <span>{children}</span>
    </button>
  )
}
