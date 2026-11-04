import Wall, { ROLES, ROLE_COLOR, ROLE_LABEL } from '../Wall'
import { canEdit, deleteProblem, useStore } from '../store'
import type { Me } from '../types'
import Grade from '../Grade'

export default function ProblemView({ id, me }: { id: string; me: Me | null }) {
  const { problems } = useStore()
  const p = problems.find(x => x.id === id)
  if (!p) return <p className="muted center">Bloc introuvable. <a href="#/">Retour</a></p>
  const used = ROLES.filter(r => p.circles.some(c => c.role === r))

  return (
    <div className="stack">
      <Wall circles={p.circles} dim />
      <div className="card">
        <h2>{p.name} <Grade g={p.grade} /></h2>
        <p className="muted">par {p.author} · {new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
        {p.description && <p className="desc">{p.description}</p>}
        <div className="legend">{used.map(r => <span key={r}><i style={{ borderColor: ROLE_COLOR[r] }} />{ROLE_LABEL[r]}</span>)}</div>
      </div>
      {canEdit(p, me) && <div className="row">
        <a className="btn" href={'#/edit/' + p.id}>Modifier</a>
        <button className="danger" onClick={async () => { if (confirm(`Supprimer « ${p.name} » ?`)) { await deleteProblem(p.id); location.hash = '/' } }}>Supprimer</button>
      </div>}
    </div>
  )
}
