import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { getAuthMe, normalizeAuthResponse } from '../services/api'

const STORAGE_KEY = 'dzresearch_auth'

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const o = JSON.parse(raw)
    return o?.token ? o : null
  } catch {
    return null
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStored)

  const setFromAuthPayload = useCallback(payload => {
    const n = normalizeAuthResponse(payload)
    const next = {
      token: n.accessToken,
      userId: n.userId,
      email: n.email,
      fullName: n.fullName,
      profileListingPending: n.profileListingPending,
      linkedResearcherId: n.linkedResearcherId,
      profileClaimed: n.profileClaimed,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [])

  const refreshSession = useCallback(async () => {
    const s = readStored()
    if (!s?.token) return
    try {
      const me = await getAuthMe(s.token)
      const next = {
        token: s.token,
        userId: me.user_id,
        email: me.email,
        fullName: me.full_name,
        profileListingPending: me.profile_listing_pending,
        linkedResearcherId: me.linked_researcher_id,
        profileClaimed: me.profile_claimed,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSession(next)
    } catch {
      logout()
    }
  }, [logout])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token),
      token: session?.token,
      email: session?.email,
      fullName: session?.fullName,
      profileListingPending: session?.profileListingPending,
      profileClaimed: session?.profileClaimed,
      linkedResearcherId: session?.linkedResearcherId,
      setFromAuthPayload,
      logout,
      refreshSession,
    }),
    [session, setFromAuthPayload, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
