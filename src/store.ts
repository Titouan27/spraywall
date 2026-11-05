import { useSyncExternalStore } from 'react'
import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider, connectAuthEmulator, getAuth, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut, type Auth,
} from 'firebase/auth'
import {
  connectFirestoreEmulator, initializeFirestore, persistentLocalCache, collection, doc, onSnapshot, setDoc, deleteDoc, getDoc, writeBatch,
  query, where, type Firestore, type Unsubscribe,
} from 'firebase/firestore'
import { firebaseConfig } from './config'
import type { Ascent, Comment, Me, Problem, Project } from './types'

interface State {
  problems: Problem[]
  /** toutes les ascensions (publiques) */
  ascents: Ascent[]
  /** tous les commentaires (publics) */
  comments: Comment[]
  /** mes projets (privés) */
  projects: Project[]
  ready: boolean
  /** utilisateur connecté : undefined = vérification en cours, null = visiteur (lecture seule) */
  me: Me | null | undefined
  /** connecté à Google mais pseudo pas encore choisi */
  needsName: boolean
  error?: string
}

let state: State = { problems: [], ascents: [], comments: [], projects: [], ready: false, me: undefined, needsName: false }
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
  // Blocs, ascensions et commentaires sont lisibles par tout le monde ; « ready » quand tout est chargé
  const got = new Set<string>()
  const loaded = (k: string) => { got.add(k); if (got.size === 3) set({ ready: true }) }
  const fail = (e: Error) => set({ error: e.message, ready: true })
  onSnapshot(collection(db, 'problems'), s => { set({ problems: s.docs.map(d => d.data() as Problem), error: undefined }); loaded('p') }, fail)
  onSnapshot(collection(db, 'ascents'), s => { set({ ascents: s.docs.map(d => d.data() as Ascent) }); loaded('a') }, fail)
  onSnapshot(collection(db, 'comments'), s => { set({ comments: s.docs.map(d => d.data() as Comment) }); loaded('c') }, fail)

  // Mes projets : privés, on n'écoute que les miens
  let unsubProjects: Unsubscribe | null = null
  onAuthStateChanged(auth, async u => {
    unsubProjects?.(); unsubProjects = null; set({ projects: [] })
    if (!u) return set({ me: null, needsName: false })
    unsubProjects = onSnapshot(query(collection(db!, 'projects'), where('uid', '==', u.uid)),
      s => set({ projects: s.docs.map(d => d.data() as Project) }), fail)
    try {
      const profile = await getDoc(doc(db!, 'users', u.uid))
      if (profile.exists()) set({ me: { uid: u.uid, name: profile.data().name }, needsName: false })
      else set({ me: { uid: u.uid, name: '' }, needsName: true })
    } catch (e) { set({ error: (e as Error).message }) }
  })
} else {
  // ---------- Mode démo : stockage dans le navigateur, connexion simulée ----------
  const load = <T,>(k: string, def: T): T => { try { const v = localStorage.getItem('sw_' + k); return v ? JSON.parse(v) : def } catch { return def } }
  set({ problems: load('problems', []), ascents: load('ascents', []), comments: load('comments', []), projects: load('projects', []), me: load('demo_me', null), ready: true })
}
function persistLocal() {
  try {
    localStorage.setItem('sw_problems', JSON.stringify(state.problems)); localStorage.setItem('sw_demo_me', JSON.stringify(state.me ?? null))
    localStorage.setItem('sw_ascents', JSON.stringify(state.ascents)); localStorage.setItem('sw_comments', JSON.stringify(state.comments)); localStorage.setItem('sw_projects', JSON.stringify(state.projects))
  } catch { /* ignore */ }
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
/** Supprime un bloc et, dans la même opération, ses ascensions, ses commentaires et mon éventuel projet. */
export async function deleteProblem(id: string) {
  if (db) {
    const b = writeBatch(db)
    state.ascents.filter(a => a.problemId === id).forEach(a => b.delete(doc(db!, 'ascents', a.id)))
    state.projects.filter(p => p.problemId === id).forEach(p => b.delete(doc(db!, 'projects', p.id)))
    state.comments.filter(c => c.problemId === id).forEach(c => b.delete(doc(db!, 'comments', c.id)))
    b.delete(doc(db, 'problems', id))
    await b.commit()
  } else {
    set({ problems: state.problems.filter(p => p.id !== id), ascents: state.ascents.filter(a => a.problemId !== id), comments: state.comments.filter(c => c.problemId !== id), projects: state.projects.filter(p => p.problemId !== id) })
    persistLocal()
  }
}

// ---------- Ascensions & projets ----------
const key = (uid: string, problemId: string) => `${uid}_${problemId}`
export const myAscent = (problemId: string, me: Me | null | undefined) => me ? state.ascents.find(a => a.id === key(me.uid, problemId)) : undefined

/** Enregistre (ou met à jour) mon ascension ; retire le bloc de mes projets s'il y était. */
export async function saveAscent(me: Me, problemId: string, grade: string, date: string) {
  const id = key(me.uid, problemId)
  const prev = state.ascents.find(a => a.id === id)
  const a: Ascent = { id, uid: me.uid, user: me.name, problemId, grade, date, createdAt: prev?.createdAt ?? Date.now() }
  const inProjects = state.projects.some(p => p.id === id)
  if (db) {
    const b = writeBatch(db)
    b.set(doc(db, 'ascents', id), a)
    if (inProjects) b.delete(doc(db, 'projects', id))
    await b.commit()
  } else {
    set({ ascents: [...state.ascents.filter(x => x.id !== id), a], projects: state.projects.filter(p => p.id !== id) }); persistLocal()
  }
}
export async function deleteAscent(me: Me, problemId: string) {
  const id = key(me.uid, problemId)
  if (db) await deleteDoc(doc(db, 'ascents', id))
  else { set({ ascents: state.ascents.filter(a => a.id !== id) }); persistLocal() }
}
export async function setProject(me: Me, problemId: string, on: boolean) {
  const id = key(me.uid, problemId)
  const p: Project = { id, uid: me.uid, problemId, createdAt: Date.now() }
  if (db) await (on ? setDoc(doc(db, 'projects', id), p) : deleteDoc(doc(db, 'projects', id)))
  else { set({ projects: on ? [...state.projects.filter(x => x.id !== id), p] : state.projects.filter(x => x.id !== id) }); persistLocal() }
}

// ---------- Commentaires ----------
export const COMMENT_MAX = 500
export async function addComment(me: Me, problemId: string, text: string) {
  const c: Comment = { id: newId(), problemId, uid: me.uid, user: me.name, text: text.trim().slice(0, COMMENT_MAX), createdAt: Date.now() }
  if (db) await setDoc(doc(db, 'comments', c.id), c)
  else { set({ comments: [...state.comments, c] }); persistLocal() }
}
export async function deleteComment(id: string) {
  if (db) await deleteDoc(doc(db, 'comments', id))
  else { set({ comments: state.comments.filter(c => c.id !== id) }); persistLocal() }
}
