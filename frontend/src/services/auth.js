import { ref } from 'vue'

const API_URL = 'http://localhost:3001'
const authStorageKeys = ['isloggedIn', 'role', 'userId', 'userRole', 'userName']
const currentUser = ref(null)

authStorageKeys.forEach((key) => {
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
})

function clearAuthCache() {
  currentUser.value = null
  window.dispatchEvent(new Event('woodenart:cart-owner-change'))
}

function setAuthenticatedUser(user) {
  currentUser.value = user
  window.dispatchEvent(new Event('woodenart:cart-owner-change'))
}

async function refreshAuthenticatedUser() {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
    if (!response.ok) {
      clearAuthCache()
      return null
    }
    const user = await response.json()
    setAuthenticatedUser(user)
    return user
  } catch {
    clearAuthCache()
    return null
  }
}

export { clearAuthCache, currentUser, refreshAuthenticatedUser }
