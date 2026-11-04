import { useState } from 'react'
import Wall, { ROLES, ROLE_COLOR, ROLE_LABEL } from '../Wall'
import { newId, saveProblem, useStore } from '../store'
import { GRADES } from '../grades'
import { WALL_W } from '../config'
import type { Circle, Role } from '../types'

export default function ProblemEditor({ user, id }: { user: string; id?: string }) {
  const { problems } = useStore()
  const existing = id ? problems.find(p => p.id === id) : undefined
  const [circles, setCircles] = useState<Circle[]>(existing?.circles ?? [])
  const [role, setRole] = useState<Role>('start')
  const [size, setSize] = useState(22) // rayon en pixels de la photo
  const [sel, setSel] = useState<string | null>(null)
  const [name, setName] = useState(existing?.name ?? '')
  const [grade, setGrade] = useState(existing?.grade ?? '6A')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [saving, setSaving] = useState(false)
  if (id && !existing) return <p className="muted center">Bloc introuvable.</p>

  const selC = circles.find(c => c.id === sel)
  const patchSel = (patch: Partial<Circle>) => setCircles(cs => cs.map(c => (c.id === sel ? { ...c, ...patch } : c)))

  function tapEmpty(x: number, y: number) {
    if (sel) return setSel(null) // un tap à côté désélectionne
    setCircles(cs => [...cs, { id: newId(), x, y, r: size / WALL_W, role }])
  }
  function tapCircle(cid: string) {
    if (sel === cid) return setSel(null)
    setSel(cid)
    const c = circles.find(x => x.id === cid); if (c) setSize(Math.round(c.r * WALL_W))
  }
  function chooseRole(r: Role) { setRole(r); if (sel) patchSel({ role: r }) }
  function resize(v: number) { setSize(v); if (sel) patchSel({ r: v / WALL_W }) }

  const missing = [!name.trim() && 'un nom', !circles.length && 'au moins une prise'].filter(Boolean)
  async function save() {
    setSaving(true)
    const now = Date.now()
    const p = { id: existing?.id ?? newId(), name: name.trim(), grade, description: description.trim(), author: existing?.author ?? user, circles, createdAt: existing?.createdAt ?? now, updatedAt: now }
    try { await saveProblem(p); location.hash = '/p/' + p.id } catch (e) { alert('Erreur : ' + (e as Error).message); setSaving(false) }
  }

  return (
    <div className="stack">
      <div className="card toolbar">
        <div className="row roles">
          {ROLES.map(r => (
            <button key={r} className={'role-btn' + ((selC ? selC.role : role) === r ? ' on' : '')} style={{ '--c': ROLE_COLOR[r] } as React.CSSProperties} onClick={() => chooseRole(r)}>
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        <label className="check">Taille<input type="range" min={6} max={90} value={size} onChange={e => resize(+e.target.value)} style={{ flex: 1 }} /></label>
        {/* hauteur fixe : la barre ne doit pas changer de taille, sinon le mur se décale sous le doigt */}
        <div className="row hint">
          <span className="muted small grow">{selC ? 'Prise sélectionnée : change son type ou sa taille. Touche à côté pour désélectionner.'
            : `Touche une prise du mur pour poser un cercle « ${ROLE_LABEL[role]} ». Touche un cercle pour le modifier.`}</span>
          {selC
            ? <button className="danger" onClick={() => { setCircles(cs => cs.filter(c => c.id !== sel)); setSel(null) }}>Retirer</button>
            : <button disabled={!circles.length} onClick={() => setCircles(cs => cs.slice(0, -1))}>↶ Annuler</button>}
        </div>
      </div>
      <Wall circles={circles} selected={sel} onTapCircle={tapCircle} onTapEmpty={tapEmpty} />
      <div className="card stack">
        <label>Nom<input value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="ex : La réglette maudite" /></label>
        <label>Cotation<select value={grade} onChange={e => setGrade(e.target.value)}>{GRADES.map(g => <option key={g}>{g}</option>)}</select></label>
        <label>Description / règles<textarea rows={2} maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} placeholder="ex : départ assis, pieds sur les prises marquées uniquement" /></label>
        {missing.length > 0 && <p className="muted small">Il manque : {missing.join(', ')}.</p>}
        <div className="row">
          <button className="primary" disabled={missing.length > 0 || saving} onClick={save}>{existing ? 'Enregistrer' : 'Créer le bloc'}</button>
          <button onClick={() => history.back()}>Annuler</button>
        </div>
      </div>
    </div>
  )
}
