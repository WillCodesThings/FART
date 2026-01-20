import { getSession, updateSessionActivity } from '~/server/utils/dataStore'

export default defineEventHandler((event) => {
  const sessionId = getCookie(event, 'fart-session')

  if (!sessionId) {
    return { authenticated: false }
  }

  const session = getSession(sessionId)

  if (!session) {
    deleteCookie(event, 'fart-session', { path: '/' })
    return { authenticated: false }
  }

  // Update last active time
  updateSessionActivity(sessionId)

  return {
    authenticated: true,
    user: {
      name: session.userName,
      isAdmin: session.isAdmin,
      id: session.userId,
    },
    sessionId: session.id,
  }
})
