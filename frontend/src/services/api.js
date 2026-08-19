import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Tokens expire after 7 days. Without this, every returning user hit an
 * app that looked signed in but returned nothing on every screen, with
 * no prompt to sign in again.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      const here = window.location.hash.replace(/^#/, '')
      if (here && !here.startsWith('/login')) {
        sessionStorage.setItem('auth:returnTo', here)
      }
      if (!here.startsWith('/login')) {
        window.location.hash = '#/login?expired=1'
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Server messages are for the console; users get a cause they can act on.
 * Nothing in the UI should render error.response.data.message directly.
 */
export function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return "Can't reach the server. Check your connection and try again."
  }
  const status = error.response?.status
  const raw = error.response?.data?.message || ''
  if (status === 400 && /duplicate key|E11000/i.test(raw)) return 'That email is already registered. Try signing in instead.'
  if (status === 400 && /credentials/i.test(raw)) return 'That email or password is incorrect.'
  if (status === 400) return raw && raw.length < 120 && !/^[A-Z]\d|Cast to|ObjectId/.test(raw) ? raw : 'Please check the details you entered.'
  if (status === 401) return 'Your session expired. Please sign in again.'
  if (status === 403) return "You don't have permission to do that."
  if (status === 404) return "We couldn't find what you were looking for."
  if (status === 413) return 'Those files are too large. Each file must be under 50MB.'
  if (status >= 500) return 'The server had a problem. Please try again in a moment.'
  return fallback
}

export default api
