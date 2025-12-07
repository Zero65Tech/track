import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { authService } from '@/service/authService'

export const useAuthStore = defineStore('auth', () => {
  const toast = useToast()

  // State
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const token = ref(null)
  const unsubscribe = ref(null)

  // Getters
  const isAuthenticated = computed(() => user.value !== null)
  const userName = computed(() => user.value?.displayName || user.value?.email || 'User')

  // Actions
  async function initializeAuth() {
    // Restore user from localStorage if available
    const savedUser = localStorage.getItem('authUser')
    const savedToken = localStorage.getItem('authToken')

    if (savedUser && savedToken) {
      user.value = JSON.parse(savedUser)
      token.value = savedToken
    }

    // Set up auth state listener
    unsubscribe.value = authService.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        user.value = currentUser
        // Fetch fresh token when auth state changes
        authService.getIdToken().then((newToken) => {
          token.value = newToken
          localStorage.setItem('authToken', newToken)
        })
        localStorage.setItem('authUser', JSON.stringify(currentUser))
      } else {
        user.value = null
        token.value = null
        localStorage.removeItem('authUser')
        localStorage.removeItem('authToken')
      }
    })
  }

  async function refreshToken() {
    try {
      const newToken = await authService.getIdToken()
      token.value = newToken
      localStorage.setItem('authToken', newToken)
      return newToken
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function loginWithGoogle() {
    isLoading.value = true
    error.value = null

    try {
      const currentUser = await authService.loginWithGoogle()
      user.value = currentUser

      // Get ID token
      const idToken = await authService.getIdToken()
      token.value = idToken

      // Persist to localStorage
      localStorage.setItem('authUser', JSON.stringify(currentUser))
      localStorage.setItem('authToken', idToken)

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Welcome, ${currentUser.displayName || 'User'}!`,
        life: 3000,
      })
    } catch (err) {
      error.value = err.message
      toast.add({
        severity: 'error',
        summary: 'Sign in failed',
        detail: error.value,
        life: 3000,
      })
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    error.value = null

    try {
      await authService.logout()
      user.value = null
      token.value = null
      localStorage.removeItem('authUser')
      localStorage.removeItem('authToken')

      toast.add({
        severity: 'success',
        summary: 'Signed out',
        detail: 'You have been successfully signed out.',
        life: 3000,
      })
    } catch (err) {
      error.value = err.message
      toast.add({
        severity: 'error',
        summary: 'Sign out failed',
        detail: error.value,
        life: 3000,
      })
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function cleanup() {
    if (unsubscribe.value) {
      unsubscribe.value()
    }
  }

  return {
    // State
    user,
    isLoading,
    error,
    token,

    // Getters
    isAuthenticated,
    userName,

    // Actions
    initializeAuth,
    refreshToken,
    loginWithGoogle,
    logout,
    clearError,
    cleanup,
  }
})
