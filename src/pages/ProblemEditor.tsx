import { useState } from 'react'
import Wall, { ROLES, ROLE_COLOR, ROLE_LABEL } from '../Wall'
import { newId, saveProblem, useStore } from '../store'
import { GRADES } from '../grades'
import Grade from '../Grade'
import { WALL_W } from '../config'
import type { Circle, Me, Role } from '../types'

const MIN_SIZE = 6, MAX_SIZE = 90 // rayon en pixels de la photo

export default function ProblemEditor({ me, id }: { me: Me; id?: string }) {
  const { problems } = useStore()
  const existing = id ? problems.find(p => p.id === id) : undefined
  const [circles, setCircles] = useState<Circle[]>(existing?.circles ?? [])
  const [role, setRole] = useState<Role>('start')
  const [size, setSize] = useState(22)
  /** cercle en cours d'édition : il reste déplaçable et redimensionnable jusqu'à « Valider » */
  const [editing, setEditing] = useState<string | null>(null)
  /** état du cercle avant édition (null = cercle tout juste posé) : sert à « Annuler » */
  const [backup, setBackup] = useState<Circle | null>(null)
  const [name, setName] = useState(existing?.name ?? '')
  const [grade, setGrade] = useState(existing?.grade ?? '6A')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [saving, setSaving] = useState(false)
  if (id && !existing) return <p className="muted center">Bloc introuvable.</p>
  if (existing && existing.authorUid !== me.uid) return <p className="muted center card">Seul l'auteur de ce bloc peut le modifier.</p>

  const ed = circles.find(c => c.id === editing)
  const patch = (p: Partial<Circle>) => setCircles(cs => cs.map(c => (c.id === editing ? { ...c, ...p } : c)))

  function onTap(x: number, y: number, hit: string | null) {
    if (editing) return patch({ x, y }) // en édition : un tap déplace le cercle à cet endroit
    if (hit) { // modifier un cercle existant
      const c = circles.find(x => x.id === hit)!
      setEditing(hit); setBackup(c); setSize(Math.round(c.r * WALL_W)); setRole(c.role)
      return
    }
    const c: Circle = { id: newId(), x, y, r: size / WALL_W, role }
    setCircles(cs => [...cs, c]); setEditing(c.id); setBackup(null)
  }
  function validate() { setEditing(null); setBackup(null) }
  function cancel() {
    if (backup) setCircles(cs => cs.map(c => (c.id === editing ? backup : c))) // remettre comme avant
    else setCircles(cs => cs.filter(c => c.id !== editing)) // cercle tout juste posé : on l'enlève
    validate()
  }
  function remove() { setCircles(cs => cs.filter(c => c.id !== editing)); validate() }
  function chooseRole(r: Role) { setRole(r); if (editing) patch({ role: r }) }
  function resize(v: number) {
    v = Math.min(MAX_SIZE, Math.max(MIN_SIZE, v)); setSize(v)
    if (editing) patch({ r: v / WALL_W })
  }

  const missing = [!name.trim() && 'un nom', !circles.length && 'au moins une prise'].filter(Boolean)
  async function save() {
    setSaving(true)
    const now = Date.now()
    const p = { id: existing?.id ?? newId(), name: name.trim(), grade, description: description.trim(), author: me.name, authorUid: me.uid, circles, createdAt: existing?.createdAt ?? now, updatedAt: now }
    try { await saveProblem(p); location.hash = '/p/' + p.id } catch (e) { alert('Erreur : ' + (e as Error).message); setSaving(false) }
  }

  return (
    <div className="stack">
      <div className="card toolbar">
        <div className="row roles">
          {ROLES.map(r => (
            <button key={r} className={'role-btn' + ((ed ? ed.role : role) === r ? ' on' : '')} style={{ '--c': ROLE_COLOR[r] } as React.CSSProperties} onClick={() => chooseRole(r)}>
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        <div className="size-row">
          <span className="muted small">Taille</span>
          <button onClick={() => resize(size - 2)} aria-label="Plus petit">−</button>
          <input type="range" min={MIN_SIZE} max={MAX_SIZE} value={size} onChange={e => resize(+e.target.value)} aria-label="Taille du cercle" />
          <button onClick={() => resize(size + 2)} aria-label="Plus grand">+</button>
        </div>
        {/* hauteur fixe : la barre ne doit pas changer de taille, sinon le mur se décale sous le doigt */}
        <div className="row hint">
          {ed ? (
            <>
              <span className="muted small grow">Glisse le cercle ou touche le mur pour le déplacer, ajuste sa taille et son type.</span>
              <button className="primary" onClick={validate}>✓ Valider</button>
              {backup ? <button className="danger" onClick={remove}>Retirer</button> : <button onClick={cancel}>✕</button>}
            </>
          ) : (
            <>
              <span className="muted small grow">Touche une prise pour poser un cercle « {ROLE_LABEL[role]} ». Touche un cercle pour le modifier.</span>
              <button disabled={!circles.length} onClick={() => setCircles(cs => cs.slice(0, -1))}>↶ Annuler</button>
            </>
          )}
        </div>
      </div>
      <Wall circles={circles} editing={editing} onTap={onTap} onDrag={(x, y) => patch({ x, y })} />
      <div className="card stack">
        <label>Nom<input value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="ex : La réglette maudite" /></label>
        <label>Cotation
          <span className="grade-preview"><select value={grade} onChange={e => setGrade(e.target.value)}>{GRADES.map(g => <option key={g}>{g}</option>)}</select><Grade g={grade} /></span>
        </label>
        <label>Description / règles<textarea rows={2} maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} placeholder="ex : départ assis, pieds sur les prises marquées uniquement" /></label>
        {missing.length > 0 && <p className="muted small">Il manque : {missing.join(', ')}.</p>}
        <div className="row">
          <button className="primary" disabled={missing.length > 0 || saving} onClick={() => { validate(); save() }}>{existing ? 'Enregistrer' : 'Créer le bloc'}</button>
          <button onClick={() => history.back()}>Annuler</button>
        </div>
      </div>
    </div>
  )
}
