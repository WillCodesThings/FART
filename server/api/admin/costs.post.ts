import { getSession, getCostConfig, updateCostConfig } from '~/server/utils/dataStore'

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
  const { filamentPerKg, electricityPerHour } = body

  if (filamentPerKg !== undefined && (typeof filamentPerKg !== 'number' || filamentPerKg < 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filament cost' })
  }

  if (electricityPerHour !== undefined && (typeof electricityPerHour !== 'number' || electricityPerHour < 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid electricity cost' })
  }

  const updated = updateCostConfig({
    filamentPerKg: filamentPerKg !== undefined ? filamentPerKg : undefined,
    electricityPerHour: electricityPerHour !== undefined ? electricityPerHour : undefined,
  })

  return { success: true, costConfig: updated }
})
