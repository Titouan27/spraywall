import { useEffect, useState } from 'react'
import { getUser, isDemo, setUser, useStore } from './store'
import ProblemList from './pages/ProblemList'
import ProblemView from './pages/ProblemView'
import ProblemEditor from './pages/ProblemEditor'

function useHash() {
  const [h, setH] = useState(location.hash.slice(1) || '/')
  useEffect(() => { const f = () => { setH(location.hash.slice(1) || '/'); window.scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return h
}

function Login({ onDone }: { onDone: (u: string) => void }) {
  const [name, setName] = useState(getUser())
  const ok = name.trim().length >= 2
  return (
    <form className="login card" onSubmit={e => { e.preventDefault(); if (ok) { setUser(name.trim()); onDone(name.trim()) } }}>
      <h1>🧗 Spray Wall</h1>
      <label>Ton pseudo<input autoFocus value={name} maxLength={30} onChange={e => setName(e.target.value)} placeholder="ex : Titouan" /></label>
      <button className="primary" disabled={!ok}>Entrer</button>
    </form>
  )
}

export default function App() {
  const [user, setU] = useState(getUser())
  const [renaming, setRenaming] = useState(false)
  const route = useHash()
  const { ready, error } = useStore()
  if (!user || renaming) return <Login onDone={u => { setU(u); setRenaming(false) }} />

  const [, page, id] = route.split('/')
  let body
  if (!ready) body = <p className="muted center">Chargement…</p>
  else if (page === 'p' && id) body = <ProblemView id={id} />
  else if (page === 'new') body = <ProblemEditor key="new" user={user} />
  else if (page === 'edit' && id) body = <ProblemEditor key={id} user={user} id={id} />
  else body = <ProblemList />

  return (
    <>
      <header>
        <a href="#/" className="brand">🧗 Spray Wall</a>
        <nav>
          <a href="#/new" className={page === 'new' ? 'on' : ''}>＋ Bloc</a>
          <button className="link user" title="Changer de pseudo" onClick={() => setRenaming(true)}>{user}</button>
        </nav>
      </header>
      {isDemo && <div className="banner">Mode démo : les blocs restent dans ce navigateur (Firebase non configuré).</div>}
      {error && <div className="banner err">Erreur de connexion : {error}</div>}
      <main>{body}</main>
    </>
  )
}
