import { useEffect, useState } from 'react'
import { GROUP_CODE } from './config'
import { getUser, isDemo, setUser, useStore } from './store'
import ProblemList from './pages/ProblemList'
import ProblemView from './pages/ProblemView'
import ProblemEditor from './pages/ProblemEditor'
import HoldsEditor from './pages/HoldsEditor'
import Profile from './pages/Profile'

function useHash() {
  const [h, setH] = useState(location.hash.slice(1) || '/')
  useEffect(() => { const f = () => { setH(location.hash.slice(1) || '/'); window.scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return h
}

function Login({ onDone }: { onDone: (u: string) => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const ok = name.trim().length >= 2 && (!GROUP_CODE || code.trim() === GROUP_CODE)
  return (
    <form className="login card" onSubmit={e => { e.preventDefault(); if (ok) { setUser(name.trim()); onDone(name.trim()) } }}>
      <h1>🧗 Spray Wall</h1>
      <label>Ton pseudo<input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="ex : Titouan" /></label>
      {GROUP_CODE && <label>Code du groupe<input value={code} onChange={e => setCode(e.target.value)} /></label>}
      <button className="primary" disabled={!ok}>Entrer</button>
    </form>
  )
}

export default function App() {
  const [user, setU] = useState(getUser())
  const route = useHash()
  const { ready, error } = useStore()
  if (!user) return <Login onDone={setU} />

  const [, page, id] = route.split('/')
  let body
  if (!ready) body = <p className="muted center">Chargement…</p>
  else if (page === 'p' && id) body = <ProblemView id={id} user={user} />
  else if (page === 'new') body = <ProblemEditor user={user} />
  else if (page === 'edit' && id) body = <ProblemEditor user={user} id={id} />
  else if (page === 'holds') body = <HoldsEditor />
  else if (page === 'me') body = <Profile user={user} onLogout={() => { setUser(''); setU('') }} />
  else body = <ProblemList user={user} />

  return (
    <>
      <header>
        <a href="#/" className="brand">🧗 Spray Wall</a>
        <nav>
          <a href="#/new" className={page === 'new' ? 'on' : ''}>＋ Bloc</a>
          <a href="#/me" className={page === 'me' ? 'on' : ''}>{user}</a>
        </nav>
      </header>
      {isDemo && <div className="banner">Mode démo : les données restent dans ce navigateur (Firebase non configuré).</div>}
      {error && <div className="banner err">Erreur de connexion : {error}</div>}
      <main>{body}</main>
    </>
  )
}
