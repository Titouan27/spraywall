import { useStore } from '../store'
import { GRADES, gradeIndex } from '../grades'

export default function Profile({ user, onLogout }: { user: string; onLogout: () => void }) {
  const { ascents, problems } = useStore()
  const mine = ascents.filter(a => a.user === user).sort((a, b) => b.date.localeCompare(a.date))
  const pname = (id: string) => problems.find(p => p.id === id)?.name ?? '(bloc supprimé)'
  const best = new Map<string, string>() // une croix par bloc pour la pyramide
  mine.forEach(a => { if (!best.has(a.problemId)) best.set(a.problemId, a.grade) })
  const counts = GRADES.map(g => [...best.values()].filter(x => x === g).length)
  const maxCount = Math.max(1, ...counts)
  const top = [...best.values()].sort((a, b) => gradeIndex(b) - gradeIndex(a))[0]
  const created = problems.filter(p => p.author === user)

  return (
    <div className="stack">
      <div className="card row between">
        <h2>{user}</h2>
        <button onClick={onLogout}>Changer de pseudo</button>
      </div>
      <div className="card">
        <h3>Stats</h3>
        <p>{best.size} bloc·s enchaîné·s · {mine.filter(a => a.flash).length} flash · max <span className="grade sm">{top ?? '–'}</span> · {created.length} bloc·s ouvert·s</p>
        <div className="pyramid">
          {GRADES.map((g, i) => counts[i] > 0 && (
            <div key={g} className="bar-row"><span className="grade sm">{g}</span><span className="bar" style={{ width: (counts[i] / maxCount) * 100 + '%' }}>{counts[i]}</span></div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Mon carnet</h3>
        {!mine.length && <p className="muted">Aucune croix pour l'instant.</p>}
        {mine.map(a => <a key={a.id} href={'#/p/' + a.problemId} className="ascent row between"><span><span className="grade sm">{a.grade}</span> {pname(a.problemId)} {a.flash && '⚡'}</span><span className="muted">{new Date(a.date).toLocaleDateString('fr-FR')}</span></a>)}
      </div>
      {created.length > 0 && <div className="card"><h3>Mes ouvertures</h3>{created.map(p => <a key={p.id} href={'#/p/' + p.id} className="ascent row"><span className="grade sm">{p.grade}</span> {p.name}</a>)}</div>}
      <a className="muted small center" href="#/holds">⚙️ Placer / modifier les prises du mur</a>
    </div>
  )
}
