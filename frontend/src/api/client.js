function normalizeApiBaseUrl(value) {
  const baseUrl = (value || 'http://127.0.0.1:8000/api').replace(/\/+$/, '')
  if (baseUrl.endsWith('/api')) {
    return baseUrl
  }
  return `${baseUrl}/api`
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const api = {
  listServiceItems: () => request('/service-items'),
  createServiceItem: (payload) => request('/service-items', { method: 'POST', body: JSON.stringify(payload) }),
  updateServiceItem: (id, payload) => request(`/service-items/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteServiceItem: (id) => request(`/service-items/${id}`, { method: 'DELETE' }),

  listPackages: () => request('/packages'),
  createPackage: (payload) => request('/packages', { method: 'POST', body: JSON.stringify(payload) }),
  updatePackage: (id, payload) => request(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePackage: (id) => request(`/packages/${id}`, { method: 'DELETE' }),

  listTreatmentPlans: () => request('/treatment-plans'),
  createTreatmentPlan: (payload) => request('/treatment-plans', { method: 'POST', body: JSON.stringify(payload) }),
  updateTreatmentPlan: (id, payload) => request(`/treatment-plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  consumeTreatmentSession: (id) => request(`/treatment-plans/${id}/consume`, { method: 'PATCH' }),

  listAppointments: () => request('/appointments'),
  createAppointment: (payload) => request('/appointments', { method: 'POST', body: JSON.stringify(payload) }),
  updateAppointment: (id, payload) => request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  listReminders: (days = 14) => request(`/reminders?days=${days}`),
}
