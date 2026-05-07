import axios from 'axios'

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/geo-tracking`,
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentToken')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const getTrackingByDate = async (date) => {
  const { data } = await API.get(`/${date}`)
  return data
}

export const toggleGeoTracking = async (date, trackingEnabled) => {
  const { data } = await API.patch(`/${date}/toggle`, {
    trackingEnabled,
  })

  return data
}

export const checkInGeo = async (date) => {
  const { data } = await API.post(`/${date}/checkin`)
  return data
}

export const checkOutGeo = async (date) => {
  const { data } = await API.post(`/${date}/checkout`)
  return data
}

export const addGeoVisit = async (date, body) => {
  const { data } = await API.post(`/${date}/visit`, body)
  return data
}

export const verifyGeoVisit = async (date, visitId) => {
  const { data } = await API.patch(`/${date}/visit/${visitId}/verify`)
  return data
}

export const deleteGeoVisit = async (date, visitId) => {
  const { data } = await API.delete(`/${date}/visit/${visitId}`)
  return data
}

export const pushGeoLocation = async (date, body) => {
  const { data } = await API.post(`/${date}/location`, body)
  return data
}

export const getGeoHistory = async () => {
  const { data } = await API.get('/history')
  return data
}