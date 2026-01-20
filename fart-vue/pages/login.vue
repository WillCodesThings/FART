<script setup lang="ts">
import { Printer, User, Loader2, AlertCircle, Shield } from 'lucide-vue-next'

const router = useRouter()
const { login, authenticated, checkAuth } = useAuth()

// Check if already logged in
onMounted(async () => {
  await checkAuth()
  if (authenticated.value) {
    router.push('/')
  }
})

const name = ref('')
const adminCode = ref('')
const showAdminCode = ref(false)
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (!name.value.trim()) {
    error.value = 'Please enter your name'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await login(name.value.trim(), adminCode.value || undefined)

    if (response.success) {
      router.push('/')
    } else {
      error.value = response.message || 'Login failed'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Printer class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-white">FART</h1>
        <p class="text-zinc-500 text-sm mt-1">Filament Automation & Remote Tracking</p>
      </div>

      <!-- Login Card -->
      <div class="card p-6">
        <div class="text-center mb-6">
          <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <User class="w-6 h-6 text-zinc-400" />
          </div>
          <h2 class="text-lg font-semibold text-white">Welcome</h2>
          <p class="text-sm text-zinc-500 mt-1">Enter your name to continue</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Name Input -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-zinc-400">Your Name</label>
            <input
              v-model="name"
              type="text"
              placeholder="Enter your name"
              class="input"
              :disabled="loading"
              autofocus
            />
          </div>

          <!-- Admin Code Toggle -->
          <div class="flex items-center justify-center">
            <button
              type="button"
              class="text-xs text-zinc-500 hover:text-zinc-400 flex items-center gap-1"
              @click="showAdminCode = !showAdminCode"
            >
              <Shield class="w-3 h-3" />
              {{ showAdminCode ? 'Hide admin login' : 'Admin login' }}
            </button>
          </div>

          <!-- Admin Code Input -->
          <div v-if="showAdminCode" class="space-y-2">
            <label class="block text-sm font-medium text-zinc-400">Admin Code</label>
            <div class="relative">
              <Shield class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                v-model="adminCode"
                type="password"
                placeholder="Enter admin code"
                class="input pl-10"
                :disabled="loading"
              />
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            {{ error }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
            :disabled="loading"
          >
            <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
            {{ loading ? 'Please wait...' : 'Continue' }}
          </button>
        </form>

        <!-- Help Text -->
        <p class="text-center text-xs text-zinc-600 mt-6">
          Your session will be remembered on this device
        </p>
      </div>
    </div>
  </div>
</template>
