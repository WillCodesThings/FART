import { getSession, setAdminCode } from '~/server/utils/dataStore'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'fart-session')

  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const session = getSession(sessionId)
  if (!session || !session.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const { code } = body

  if (!code || typeof code !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Code is required',
    })
  }

  if (!/^\d+$/.test(code)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Code must be numeric',
    })
  }

  if (code.length < 4) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Code must be at least 4 digits',
    })
  }

  const success = setAdminCode(code)

  if (!success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Failed to update admin code',
    })
  }

  return { success: true, message: 'Admin code updated' }
})
