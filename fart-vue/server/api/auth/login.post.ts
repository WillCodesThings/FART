import { findOrCreateUser, createSession, isAdminLogin, getAdminName } from '~/server/utils/dataStore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, adminCode } = body

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required',
    })
  }

  const trimmedName = name.trim()

  // Check if this is an admin login
  const isAdmin = adminCode && isAdminLogin(trimmedName, adminCode)

  // For admin login, we don't create a user - just create a session
  if (isAdmin) {
    const session = createSession('admin', getAdminName(), true)

    setCookie(event, 'fart-session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return {
      success: true,
      user: {
        name: getAdminName(),
        isAdmin: true,
      },
      sessionId: session.id,
    }
  }

  // For regular users, find or create by name
  const user = findOrCreateUser(trimmedName)

  const session = createSession(user.id, user.name, false)

  setCookie(event, 'fart-session', session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return {
    success: true,
    user: {
      name: user.name,
      isAdmin: false,
    },
    sessionId: session.id,
  }
})
