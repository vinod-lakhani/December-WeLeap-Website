/**
 * Rent arm D's sign-up card, in the browser: the Apple or Google popup on the WeLeap app's Firebase project, then
 * /api/ribbit-signup, which signs in to the app backend and saves the plan. The config is the app's public web
 * config (client/webui/src/app/firebase.ts); www.weleap.ai is an authorized domain on it. The API key is public too
 * (it ships in the page), but it comes from Vercel (NEXT_PUBLIC_FIREBASE_API_KEY) so it is not in this public repo.
 * The providers are set up as the app's web sign-in sets them up.
 *
 * Firebase loads when the card appears (preloadSignIn), not on the tap: Safari opens the popup only when it is
 * opened from the tap itself, with no download in between. The website keeps no Firebase session afterwards.
 */
import type { FirebaseApp } from 'firebase/app'
import type * as FirebaseAuth from 'firebase/auth'

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'weleap-dev.firebaseapp.com',
  projectId: 'weleap-dev',
  storageBucket: 'weleap-dev.firebasestorage.app',
  messagingSenderId: '457611981455',
  appId: '1:457611981455:web:437e0595d6a5285f9976fa',
}

export type SignInMethod = 'apple' | 'google'
export type SignInResult =
  | { ok: true; isNew: boolean; emailed: boolean; uid: string; email?: string }
  | { ok: false; reason: 'cancelled' | 'popup_blocked' | 'failed' | 'save_failed'; code?: string }

let loaded: Promise<{ auth: typeof FirebaseAuth; app: FirebaseApp }> | null = null
let ready: { auth: typeof FirebaseAuth; app: FirebaseApp } | null = null

export function preloadSignIn(): Promise<{ auth: typeof FirebaseAuth; app: FirebaseApp }> {
  loaded ??= Promise.all([import('firebase/app'), import('firebase/auth')]).then(([appMod, auth]) => {
    ready = { auth, app: appMod.getApps()[0] ?? appMod.initializeApp(FIREBASE_CONFIG) }
    return ready
  })
  return loaded
}

const CANCELLED = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'])

export async function signInAndSavePlan(method: SignInMethod, plan: { thread: string; answers: Record<string, unknown>; rows: { label: string; value: string }[] }): Promise<SignInResult> {
  const { auth, app } = ready ?? (await preloadSignIn())
  const a = auth.getAuth(app)
  let provider: FirebaseAuth.AuthProvider
  if (method === 'google') {
    const g = new auth.GoogleAuthProvider()
    g.addScope('profile')
    g.addScope('email')
    provider = g
  } else {
    const o = new auth.OAuthProvider('apple.com')
    o.addScope('email')
    o.addScope('name')
    provider = o
  }
  let user: FirebaseAuth.User
  // New to WeLeap: the popup just created the Firebase user. The gateway's Login creates the app's user row on
  // its own, so the server never reports a new account for a chat sign-in.
  let firebaseNew = false
  try {
    const cred = await auth.signInWithPopup(a, provider)
    user = cred.user
    firebaseNew = auth.getAdditionalUserInfo(cred)?.isNewUser === true
  } catch (err) {
    const code = (err as { code?: string })?.code ?? ''
    return { ok: false, reason: CANCELLED.has(code) ? 'cancelled' : code === 'auth/popup-blocked' ? 'popup_blocked' : 'failed', code }
  }
  try {
    const idToken = await user.getIdToken()
    const res = await fetch('/api/ribbit-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, ...plan }) })
    const out = (await res.json().catch(() => null)) as { ok?: boolean; isNew?: boolean; emailed?: boolean; error?: string } | null
    if (!out?.ok) return { ok: false, reason: 'save_failed', code: out?.error }
    return { ok: true, isNew: firebaseNew || Boolean(out.isNew), emailed: Boolean(out.emailed), uid: user.uid, email: user.email ?? undefined }
  } catch {
    return { ok: false, reason: 'save_failed' }
  } finally {
    await auth.signOut(a).catch(() => undefined)
  }
}
