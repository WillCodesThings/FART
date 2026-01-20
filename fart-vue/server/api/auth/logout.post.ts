import { deleteSession } from '~/server/utils/dataStore'

export default defineEventHandler((event) => {
  const sessionId = getCookie(event, 'fart-session')

  if (sessionId) {
    deleteSession(sessionId)
  }

  deleteCookie(event, 'fart-session', {
    path: '/',
  })

  return { success: true }
})
