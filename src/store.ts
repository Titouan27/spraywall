import { useSyncExternalStore } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  initializeFirestore, persistentLocalCache, collection, doc, onSnapshot, setDoc, deleteDoc, type Firestore,
} from 'firebase/firestore'
import { firebaseConfig } from './config'
import type { Ascent, Hold, Problem } from './types'

interface State { holds: Hold[]; problems: Problem[]; ascents: Ascent[]; ready: boolean; error?: string }

let state: State = { holds: [], problems: [], ascents: [], ready: false }
const listeners = new Set<() => void>()
function set(patch: Partial<State>) { state = { ...state, ...patch }; listeners.forEach(l => l()) }
export function useStore() {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb) }, () => state)
}
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
export const isDemo = !firebaseConfig

// ---------- Backend Firebase ----------
let db: Firestore | null = null
if (firebaseConfig) {
  const app = initializeApp(firebaseConfig)
  db = initializeFirestore(app, { localCache: persistentLocalCache() })
  const fail = (e: Error) => set({ error: e.message, ready: true })
  signInAnonymously(getAuth(app)).then(() => {
    const got = new Set<string>()
    const mark = (k: string) => { got.add(k); if (got.size === 3) set({ ready: true }) }
    onSnapshot(doc(db!, 'walls', 'main'), s => {
      set({ holds: (s.data()?.holds ?? []) as Hold[] }); mark('h')
    }, fail)
    onSnapshot(collection(db!, 'problems'), s => { set({ problems: s.docs.map(d => d.data() as Problem) }); mark('p') }, fail)
    onSnapshot(collection(db!, 'ascents'), s => { set({ ascents: s.docs.map(d => d.data() as Ascent) }); mark('a') }, fail)
  }, fail)
} else {
  // ---------- Mode démo : localStorage ----------
  const load = <T,>(k: string, def: T): T => { try { const v = localStorage.getItem('sw_' + k); return v ? JSON.parse(v) : def } catch { return def } }
  set({ holds: load('holds', []), problems: load('problems', []), ascents: load('ascents', []), ready: true })
}
function persistLocal() {
  try { (['holds', 'problems', 'ascents'] as const).forEach(k => localStorage.setItem('sw_' + k, JSON.stringify(state[k]))) } catch { /* ignore */ }
}
const upsert = <T extends { id: string }>(list: T[], item: T) => [...list.filter(x => x.id !== item.id), item]

export async function saveHolds(holds: Hold[]) {
  if (db) await setDoc(doc(db, 'walls', 'main'), { holds })
  else { set({ holds }); persistLocal() }
}
export async function saveProblem(p: Problem) {
  if (db) await setDoc(doc(db, 'problems', p.id), p)
  else { set({ problems: upsert(state.problems, p) }); persistLocal() }
}
export async function deleteProblem(id: string) {
  if (db) {
    await deleteDoc(doc(db, 'problems', id))
    await Promise.all(state.ascents.filter(a => a.problemId === id).map(a => deleteDoc(doc(db!, 'ascents', a.id))))
  } else { set({ problems: state.problems.filter(p => p.id !== id), ascents: state.ascents.filter(a => a.problemId !== id) }); persistLocal() }
}
export async function saveAscent(a: Ascent) {
  if (db) await setDoc(doc(db, 'ascents', a.id), a)
  else { set({ ascents: upsert(state.ascents, a) }); persistLocal() }
}
export async function deleteAscent(id: string) {
  if (db) await deleteDoc(doc(db, 'ascents', id))
  else { set({ ascents: state.ascents.filter(a => a.id !== id) }); persistLocal() }
}

// ---------- Utilisateur (simple pseudo) ----------
export const getUser = () => { try { return localStorage.getItem('sw_user') || '' } catch { return '' } }
export const setUser = (u: string) => { try { localStorage.setItem('sw_user', u) } catch { /* ignore */ } }
