import { computed, reactive } from 'vue';

const authState = reactive({
  user: null,
  authenticated: false,
  loading: true
});
function useAuth() {
  const checkAuth = async () => {
    authState.loading = true;
    try {
      const response = await $fetch("/api/auth/me");
      authState.authenticated = response.authenticated;
      authState.user = response.user || null;
    } catch {
      authState.authenticated = false;
      authState.user = null;
    } finally {
      authState.loading = false;
    }
  };
  const login = async (name, adminCode) => {
    const response = await $fetch("/api/auth/login", {
      method: "POST",
      body: { name, adminCode }
    });
    if (response.success && response.user) {
      authState.authenticated = true;
      authState.user = response.user;
    }
    return response;
  };
  const logout = async () => {
    await $fetch("/api/auth/logout", { method: "POST" });
    authState.authenticated = false;
    authState.user = null;
  };
  return {
    user: computed(() => authState.user),
    authenticated: computed(() => authState.authenticated),
    loading: computed(() => authState.loading),
    isAdmin: computed(() => authState.user?.isAdmin || false),
    checkAuth,
    login,
    logout
  };
}

export { useAuth as u };
//# sourceMappingURL=useAuth-DPqcDWhG.mjs.map
