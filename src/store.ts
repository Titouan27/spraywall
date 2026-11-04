import { useSyncExternalStore } from 'react'
import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, collection, doc, onSnapshot, setDoc, deleteDoc, type Firestore } from 'firebase/firestore'
import { firebaseConfig } from './config'
import type { Problem } from './types'

interface State { problems: Problem[]; ready: boolean; error?: string }

let state: State = { problems: [], ready: false }
const listeners = new Set<() => void>()
function set(patch: Partial<State>) { state = { ...state, ...patch }; listeners.forEach(l => l()) }
export function useStore() {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb) }, () => state)
}
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
export const isDemo = !firebaseConfig

// ---------- Firebase (base partagée) ----------
let db: Firestore | null = null
if (firebaseConfig) {
  db = initializeFirestore(initializeApp(firebaseConfig), { localCache: persistentLocalCache() })
  onSnapshot(collection(db, 'problems'),
    s => set({ problems: s.docs.map(d => d.data() as Problem), ready: true, error: undefined }),
    e => set({ error: e.message, ready: true }))
} else {
  // ---------- Mode démo : stockage dans le navigateur ----------
  let problems: Problem[] = []
  try { problems = JSON.parse(localStorage.getItem('sw_problems') || '[]') } catch { /* ignore */ }
  set({ problems, ready: true })
}
function persistLocal() { try { localStorage.setItem('sw_problems', JSON.stringify(state.problems)) } catch { /* ignore */ } }

export async function saveProblem(p: Problem) {
  if (db) await setDoc(doc(db, 'problems', p.id), p)
  else { set({ problems: [...state.problems.filter(x => x.id !== p.id), p] }); persistLocal() }
}
export async function deleteProblem(id: string) {
  if (db) await deleteDoc(doc(db, 'problems', id))
  else { set({ problems: state.problems.filter(p => p.id !== id) }); persistLocal() }
}

// ---------- Pseudo (simple, sans authentification) ----------
export const getUser = () => { try { return localStorage.getItem('sw_user') || '' } catch { return '' } }
export const setUser = (u: string) => { try { localStorage.setItem('sw_user', u) } catch { /* ignore */ } }
