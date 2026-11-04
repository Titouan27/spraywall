import { useEffect, useState } from 'react'
import { claimName, isDemo, logout, signIn, useStore } from './store'
import ProblemList from './pages/ProblemList'
import ProblemView from './pages/ProblemView'
import ProblemEditor from './pages/ProblemEditor'

function useHash() {
  const [h, setH] = useState(location.hash.slice(1) || '/')
  useEffect(() => { const f = () => { setH(location.hash.slice(1) || '/'); window.scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return h
}

/** Première connexion : choix du pseudo (unique, définitif). */
function ChooseName() {
  const [name, setName] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <form className="login card" onSubmit={async e => { e.preventDefault(); setBusy(true); setErr(await claimName(name)); setBusy(false) }}>
      <h2>Choisis ton pseudo</h2>
      <p className="muted small">Il sera affiché sur les blocs que tu crées et réservé à ton compte. <strong>Il ne pourra pas être changé.</strong></p>
      <input autoFocus value={name} onChange={e => { setName(e.target.value); setErr(null) }} placeholder="ex : Titouan" maxLength={20} />
      {err && <p className="warn">{err}</p>}
      <button className="primary" disabled={busy || name.trim().length < 2}>Valider</button>
      <button type="button" className="link" onClick={logout}>Annuler et se déconnecter</button>
    </form>
  )
}

/** Page réservée aux personnes connectées. */
function NeedLogin({ what }: { what: string }) {
  return (
    <div className="card center stack">
      <p>Connecte-toi pour {what}.</p>
      <button className="primary" onClick={signIn}>Se connecter avec Google</button>
    </div>
  )
}

export default function App() {
  const route = useHash()
  const { ready, error, me, needsName } = useStore()
  const [menu, setMenu] = useState(false)
  const user = me && !needsName ? me : null // connecté avec un pseudo

  const [, page, id] = route.split('/')
  let body
  if (needsName) body = <ChooseName />
  else if (!ready) body = <p className="muted center">Chargement…</p>
  else if (page === 'p' && id) body = <ProblemView id={id} me={user} />
  else if (page === 'new') body = user ? <ProblemEditor key="new" me={user} /> : <NeedLogin what="créer un bloc" />
  else if (page === 'edit' && id) body = user ? <ProblemEditor key={id} me={user} id={id} /> : <NeedLogin what="modifier un bloc" />
  else body = <ProblemList me={user} />

  return (
    <>
      <header>
        <a href="#/" className="brand">🧗 Spray Wall</a>
        <nav>
          {user && <a href="#/new" className={page === 'new' ? 'on' : ''}>＋ Bloc</a>}
          {user ? (
            <span className="menu">
              <button className="link user" onClick={() => setMenu(m => !m)}>{user.name} ▾</button>
              {menu && <span className="menu-pop card"><button onClick={() => { setMenu(false); logout() }}>Se déconnecter</button></span>}
            </span>
          ) : me === undefined ? null : !needsName && <button className="primary login-btn" onClick={signIn}>Se connecter</button>}
        </nav>
      </header>
      {isDemo && <div className="banner">Mode démo : les blocs restent dans ce navigateur (Firebase non configuré).</div>}
      {error && <div className="banner err">Erreur : {error}</div>}
      <main>{body}</main>
    </>
  )
}
