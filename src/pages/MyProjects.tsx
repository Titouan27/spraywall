import { useStore } from '../store'
import Grade from '../Grade'

export default function MyProjects() {
  const { projects, problems } = useStore()
  const byId = new Map(problems.map(p => [p.id, p]))
  // on ignore les projets dont le bloc a été supprimé
  const list = projects.filter(x => byId.has(x.problemId)).sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="stack">
      <h2>Mes projets</h2>
      <p className="muted small">Visibles par toi seul. Un projet validé passe automatiquement dans tes ascensions.</p>
      {!list.length && <p className="card muted center">Aucun projet. Ouvre un bloc et touche « 🎯 Projet ».</p>}
      {list.map(x => {
        const p = byId.get(x.problemId)!
        return (
          <a key={x.id} href={'#/p/' + p.id} className="card problem-row">
            <Grade g={p.grade} />
            <span className="grow"><strong>{p.name}</strong><small className="muted">par {p.author} · en projet depuis le {new Date(x.createdAt).toLocaleDateString('fr-FR')}</small></span>
            <span className="muted">›</span>
          </a>
        )
      })}
    </div>
  )
}
