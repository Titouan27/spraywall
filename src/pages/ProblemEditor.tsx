import { useState } from 'react'
import Wall, { ROLE_COLOR, ROLE_LABEL } from '../Wall'
import { newId, saveProblem, useStore } from '../store'
import { GRADES } from '../grades'
import type { Role } from '../types'

const ROLES: Role[] = ['start', 'hand', 'foot', 'finish']

export default function ProblemEditor({ user, id }: { user: string; id?: string }) {
  const { holds, problems } = useStore()
  const existing = id ? problems.find(p => p.id === id) : undefined
  const [roles, setRoles] = useState<Record<string, Role>>(existing?.holds ?? {})
  const [tool, setTool] = useState<Role>('start')
  const [name, setName] = useState(existing?.name ?? '')
  const [grade, setGrade] = useState(existing?.grade ?? '6A')
  const [description, setDescription] = useState(existing?.description ?? '')
  if (id && !existing) return <p className="muted center">Bloc introuvable.</p>
  if (!holds.length) return <p className="muted center card">Aucune prise n'est encore placée sur le mur. <a href="#/holds">Placer les prises</a></p>

  const count = (r: Role) => Object.values(roles).filter(x => x === r).length
  function tap(h: string) {
    setRoles(prev => {
      const next = { ...prev }
      if (next[h] === tool) delete next[h]; else next[h] = tool
      return next
    })
  }
  const problems_ = [
    !name.trim() && 'donne un nom au bloc',
    !count('start') && 'au moins une prise de départ',
    !count('finish') && 'au moins une prise de top',
  ].filter(Boolean)

  async function save() {
    const p = { id: existing?.id ?? newId(), name: name.trim(), author: existing?.author ?? user, grade, description: description.trim(), holds: roles, createdAt: existing?.createdAt ?? Date.now() }
    await saveProblem(p)
    location.hash = '/p/' + p.id
  }

  return (
    <div className="stack">
      <div className="card toolbar">
        <span className="muted">Choisis un type puis touche les prises :</span>
        <div className="row">
          {ROLES.map(r => (
            <button key={r} className={'role-btn' + (tool === r ? ' on' : '')} style={{ '--c': ROLE_COLOR[r] } as React.CSSProperties} onClick={() => setTool(r)}>
              {ROLE_LABEL[r]} <small>{count(r)}</small>
            </button>
          ))}
        </div>
      </div>
      <Wall holds={holds} roles={roles} mode="edit" onTapHold={tap} />
      <div className="card stack">
        <label>Nom<input value={name} onChange={e => setName(e.target.value)} placeholder="ex : La réglette maudite" /></label>
        <label>Cotation proposée<select value={grade} onChange={e => setGrade(e.target.value)}>{GRADES.map(g => <option key={g}>{g}</option>)}</select></label>
        <label>Description / règles<textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="ex : départ assis, pieds sur les prises marquées uniquement" /></label>
        {problems_.length > 0 && <p className="muted">Il manque : {problems_.join(', ')}.</p>}
        <div className="row">
          <button className="primary" disabled={problems_.length > 0} onClick={save}>{existing ? 'Enregistrer' : 'Créer le bloc'}</button>
          <button onClick={() => history.back()}>Annuler</button>
          {Object.keys(roles).length > 0 && <button className="link" onClick={() => setRoles({})}>Tout effacer</button>}
        </div>
      </div>
    </div>
  )
}
