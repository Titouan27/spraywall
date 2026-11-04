import { useSyncExternalStore } from 'react'
import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider, connectAuthEmulator, getAuth, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut, type Auth,
} from 'firebase/auth'
import {
  connectFirestoreEmulator, initializeFirestore, persistentLocalCache, collection, doc, onSnapshot, setDoc, deleteDoc, getDoc, writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { firebaseConfig } from './config'
import type { Me, Problem } from './types'

interface State {
  problems: Problem[]
  ready: boolean
  /** utilisateur connecté : undefined = vérification en cours, null = visiteur (lecture seule) */
  me: Me | null | undefined
  /** connecté à Google mais pseudo pas encore choisi */
  needsName: boolean
  error?: string
}

let state: State = { problems: [], ready: false, me: undefined, needsName: false }
const listeners = new Set<() => void>()
function set(patch: Partial<State>) { state = { ...state, ...patch }; listeners.forEach(l => l()) }
export function useStore() {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb) }, () => state)
}
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

/** Développement local : `npm run dev:emu` utilise les émulateurs Firebase au lieu du vrai projet. */
const EMULATOR = !!import.meta.env.VITE_EMULATOR
const config = EMULATOR ? { projectId: 'demo-spraywall', apiKey: 'fake', authDomain: 'localhost' } : firebaseConfig
export const isDemo = !config

/** Pseudo : 2 à 20 caractères. La clé d'unicité ignore la casse. */
export const NAME_RE = /^[\p{L}\p{N} _.-]{2,20}$/u
const cleanName = (n: string) => n.trim().replace(/\s+/g, ' ')

// =====================================================================
// Firebase : base partagée + connexion Google
// =====================================================================
let db: Firestore | null = null
let auth: Auth | null = null

if (config) {
  const app = initializeApp(config)
  db = initializeFirestore(app, EMULATOR ? {} : { localCache: persistentLocalCache() })
  auth = getAuth(app)
  if (EMULATOR) { connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); connectFirestoreEmulator(db, '127.0.0.1', 8080) }

  // Les blocs sont lisibles par tout le monde, connecté ou non
  onSnapshot(collection(db, 'problems'),
    s => set({ problems: s.docs.map(d => d.data() as Problem), ready: true, error: undefined }),
    e => set({ error: e.message, ready: true }))

  onAuthStateChanged(auth, async u => {
    if (!u) return set({ me: null, needsName: false })
    try {
      const profile = await getDoc(doc(db!, 'users', u.uid))
      if (profile.exists()) set({ me: { uid: u.uid, name: profile.data().name }, needsName: false })
      else set({ me: { uid: u.uid, name: '' }, needsName: true })
    } catch (e) { set({ error: (e as Error).message }) }
  })
} else {
  // ---------- Mode démo : stockage dans le navigateur, connexion simulée ----------
  let problems: Problem[] = []
  let me: Me | null = null
  try { problems = JSON.parse(localStorage.getItem('sw_problems') || '[]'); me = JSON.parse(localStorage.getItem('sw_demo_me') || 'null') } catch { /* ignore */ }
  set({ problems, me, ready: true })
}
function persistLocal() {
  try { localStorage.setItem('sw_problems', JSON.stringify(state.problems)); localStorage.setItem('sw_demo_me', JSON.stringify(state.me ?? null)) } catch { /* ignore */ }
}

// ---------- Connexion / déconnexion ----------
export async function signIn() {
  set({ error: undefined })
  if (!auth) { // mode démo : on demande juste un pseudo
    const name = cleanName(prompt('Mode démo — ton pseudo :') || '')
    if (NAME_RE.test(name)) { set({ me: { uid: 'demo-' + name.toLowerCase(), name } }); persistLocal() }
    return
  }
  try {
    if (EMULATOR) { // émulateur : faux compte Google (pas de fenêtre Google en local)
      const email = prompt('E-mail de test (émulateur)')
      if (email) await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true })))
    } else await signInWithPopup(auth, new GoogleAuthProvider())
  } catch (e) {
    const code = (e as { code?: string }).code
    if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') set({ error: (e as Error).message })
  }
}
export async function logout() {
  if (auth) await signOut(auth)
  else { set({ me: null }); persistLocal() }
}

/** Réserve le pseudo du compte connecté (unique et définitif). Renvoie un message d'erreur, ou null si c'est bon. */
export async function claimName(raw: string): Promise<string | null> {
  const name = cleanName(raw)
  if (!NAME_RE.test(name)) return '2 à 20 caractères : lettres, chiffres, espace, « _ », « . » ou « - ».'
  const uid = state.me?.uid
  if (!db || !uid) return 'Non connecté.'
  const key = name.toLowerCase()
  if ((await getDoc(doc(db, 'usernames', key))).exists()) return 'Ce pseudo est déjà pris.'
  const b = writeBatch(db)
  b.set(doc(db, 'usernames', key), { uid })
  b.set(doc(db, 'users', uid), { name, key })
  try { await b.commit() } catch { return 'Ce pseudo est déjà pris.' }
  set({ me: { uid, name }, needsName: false })
  return null
}

// ---------- Blocs ----------
export const canEdit = (p: Problem, me: Me | null | undefined) => !!me && !!me.name && p.authorUid === me.uid

export async function saveProblem(p: Problem) {
  if (db) await setDoc(doc(db, 'problems', p.id), p)
  else { set({ problems: [...state.problems.filter(x => x.id !== p.id), p] }); persistLocal() }
}
export async function deleteProblem(id: string) {
  if (db) await deleteDoc(doc(db, 'problems', id))
  else { set({ problems: state.problems.filter(p => p.id !== id) }); persistLocal() }
}
