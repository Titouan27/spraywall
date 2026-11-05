import { useStore } from '../store'
import { GRADES, gradeColors, gradeIndex } from '../grades'
import Grade from '../Grade'
import { frDate } from './ProblemView'
import type { Me } from '../types'

export default function MyAscents({ me }: { me: Me }) {
  const { ascents, problems } = useStore()
  const byId = new Map(problems.map(p => [p.id, p]))
  // on ignore les ascensions de blocs supprimés
  const mine = ascents.filter(a => a.uid === me.uid && byId.has(a.problemId)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
  const best = mine.reduce<string | null>((m, a) => (!m || gradeIndex(a.grade) > gradeIndex(m) ? a.grade : m), null)
  const counts = GRADES.map(g => mine.filter(a => a.grade === g).length)
  const maxCount = Math.max(1, ...counts)

  return (
    <div className="stack">
      <h2>Mes ascensions</h2>
      {!mine.length ? (
        <p className="card muted center">Aucune ascension pour l'instant. Ouvre un bloc et touche « ✓ Je l'ai fait ».</p>
      ) : (
        <>
          <div className="card stats">
            <div><strong>{mine.length}</strong><small className="muted">bloc{mine.length > 1 ? 's' : ''}</small></div>
            <div>{best && <Grade g={best} />}<small className="muted">meilleur niveau</small></div>
          </div>
          <div className="card">
            <h3>Pyramide</h3>
            <div className="pyramid">
              {GRADES.map((g, i) => counts[i] > 0 && (
                <div key={g} className="bar-row">
                  <Grade g={g} small />
                  <span className="bar" style={{ width: `${(counts[i] / maxCount) * 100}%`, background: gradeColors(g).bg, color: gradeColors(g).fg }}>{counts[i]}</span>
                </div>
              )).reverse()}
            </div>
          </div>
          {mine.map(a => {
            const p = byId.get(a.problemId)!
            return (
              <a key={a.id} href={'#/p/' + p.id} className="card problem-row">
                <Grade g={a.grade} />
                <span className="grow"><strong>{p.name}</strong><small className="muted">{frDate(a.date)} · proposé {p.grade} · par {p.author}</small></span>
                <span className="muted">›</span>
              </a>
            )
          })}
        </>
      )}
    </div>
  )
}
