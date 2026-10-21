export interface AppUser {
  id: string
  name: string
  email: string | null
  mode: 'demo'
}

/**
 * Cloud sign-in is not wired in this build. The app runs in an explicit demo
 * mode so every feature can be demonstrated without credentials. If a future
 * build supplies VITE_AUTH_ISSUER and VITE_AUTH_CLIENT_ID the login screen
 * explains that cloud sign-in still has to be implemented.
 */
export const CLOUD_AUTH_CONFIGURED = Boolean(
  import.meta.env.VITE_AUTH_ISSUER && import.meta.env.VITE_AUTH_CLIENT_ID
)

export const DEMO_USER: AppUser = {
  id: 'demo-driver',
  name: 'Demo driver',
  email: null,
  mode: 'demo',
}

export interface AuthState {
  user: AppUser
  isDemo: true
  cloudConfigured: boolean
}

export function getAuth(): AuthState {
  return {
    user: DEMO_USER,
    isDemo: true,
    cloudConfigured: CLOUD_AUTH_CONFIGURED,
  }
}
