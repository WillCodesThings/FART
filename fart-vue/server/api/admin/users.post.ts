import { getSession, findOrCreateUser, deleteUser, getUserByName } from '~/server/utils/dataStore'

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
  const { action, id, name } = body

  if (action === 'create') {
    if (!name || !name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name is required',
      })
    }

    // Check if user already exists
    const existing = getUserByName(name.trim())
    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User with this name already exists',
      })
    }

    const user = findOrCreateUser(name.trim())
    return { success: true, user }
  }

  if (action === 'delete') {
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required',
      })
    }

    const success = deleteUser(id)
    if (!success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot delete user',
      })
    }

    return { success: true }
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Invalid action',
  })
})
