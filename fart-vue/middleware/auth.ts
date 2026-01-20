export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for login page
  if (to.path === '/login') {
    return
  }

  const { checkAuth, authenticated } = useAuth()

  // Check authentication
  await checkAuth()

  if (!authenticated.value) {
    return navigateTo('/login')
  }
})
