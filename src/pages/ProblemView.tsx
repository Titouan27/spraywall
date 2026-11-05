import { useState } from 'react'
import Wall, { ROLES, ROLE_COLOR, ROLE_LABEL } from '../Wall'
import { canEdit, deleteAscent, deleteProblem, myAscent, saveAscent, setProject, signIn, useStore } from '../store'
import type { Me, Problem } from '../types'
import { GRADES, feltGrade } from '../grades'
import Grade from '../Grade'

const today = () => new Date().toISOString().slice(0, 10)
export const frDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR')

/** Bloc « Mon ascension » : valider le bloc avec sa cotation et sa date, ou le mettre en projet. */
function MyClimb({ p, me }: { p: Problem; me: Me }) {
  const { projects } = useStore()
  const mine = myAscent(p.id, me)
  const inProject = projects.some(x => x.problemId === p.id)
  const [open, setOpen] = useState(false)
  const [grade, setGrade] = useState(mine?.grade ?? p.grade)
  const [date, setDate] = useState(mine?.date ?? today())
  const [busy, setBusy] = useState(false)
  const run = async (f: () => Promise<void>) => { setBusy(true); try { await f() } catch (e) { alert('Erreur : ' + (e as Error).message) } setBusy(false) }

  if (open) return (
    <form className="card stack" onSubmit={e => { e.preventDefault(); run(async () => { await saveAscent(me, p.id, grade, date); setOpen(false) }) }}>
      <h3>{mine ? 'Modifier mon ascension' : 'Valider ce bloc'}</h3>
      <div className="row">
        <label>Ma cotation<span className="grade-preview"><select value={grade} onChange={e => setGrade(e.target.value)}>{GRADES.map(g => <option key={g}>{g}</option>)}</select><Grade g={grade} small /></span></label>
        <label>Date<input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} required /></label>
      </div>
      <div className="row">
        <button className="primary" disabled={busy}>Enregistrer</button>
        <button type="button" onClick={() => setOpen(false)}>Annuler</button>
      </div>
    </form>
  )
  if (mine) return (
    <div className="card row between done-card">
      <span>✓ <strong>Fait</strong> le {frDate(mine.date)} · <Grade g={mine.grade} small /></span>
      <span className="row">
        <button onClick={() => { setGrade(mine.grade); setDate(mine.date); setOpen(true) }}>Modifier</button>
        <button className="link" disabled={busy} onClick={() => confirm('Retirer ton ascension de ce bloc ?') && run(() => deleteAscent(me, p.id))}>Retirer</button>
      </span>
    </div>
  )
  return (
    <div className="row climb-actions">
      <button className="primary big grow-btn" onClick={() => { setGrade(p.grade); setDate(today()); setOpen(true) }}>✓ Je l'ai fait</button>
      <button className={'big' + (inProject ? ' on' : '')} disabled={busy} onClick={() => run(() => setProject(me, p.id, !inProject))}>
        {inProject ? '🎯 En projet' : '🎯 Projet'}
      </button>
    </div>
  )
}

export default function ProblemView({ id, me }: { id: string; me: Me | null }) {
  const { problems, ascents } = useStore()
  const p = problems.find(x => x.id === id)
  if (!p) return <p className="muted center">Bloc introuvable. <a href="#/">Retour</a></p>
  const used = ROLES.filter(r => p.circles.some(c => c.role === r))
  const asc = ascents.filter(a => a.problemId === p.id).sort((a, b) => b.date.localeCompare(a.date))
  const felt = feltGrade(asc.map(a => a.grade))

  return (
    <div className="stack">
      <Wall circles={p.circles} dim />
      <div className="card">
        <h2>{p.name}</h2>
        <div className="grades-line">
          <span><small className="muted">Proposée</small> <Grade g={p.grade} /></span>
          <span><small className="muted">Ressentie</small> {felt ? <><Grade g={felt} /> <small className="muted">{asc.length} grimpeur{asc.length > 1 ? 's' : ''}</small></> : <small className="muted">— pas encore validé</small>}</span>
        </div>
        <p className="muted">par {p.author} · {new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
        {p.description && <p className="desc">{p.description}</p>}
        <div className="legend">{used.map(r => <span key={r}><i style={{ borderColor: ROLE_COLOR[r] }} />{ROLE_LABEL[r]}</span>)}</div>
      </div>
      {me ? <MyClimb key={p.id} p={p} me={me} />
        : <p className="card small muted readonly"><button className="link accent" onClick={signIn}>Connecte-toi</button> pour valider ce bloc ou le mettre en projet.</p>}
      <div className="card">
        <h3>Ascensions ({asc.length})</h3>
        {!asc.length && <p className="muted small">Personne ne l'a encore validé.</p>}
        {asc.map(a => (
          <div key={a.id} className="ascent-row">
            <span><strong>{a.user}</strong>{me && a.uid === me.uid && <span className="muted"> (toi)</span>}</span>
            <span className="row"><Grade g={a.grade} small /><span className="muted small">{frDate(a.date)}</span></span>
          </div>
        ))}
      </div>
      {canEdit(p, me) && <div className="row">
        <a className="btn" href={'#/edit/' + p.id}>Modifier le bloc</a>
        <button className="danger" onClick={async () => {
          if (confirm(`Supprimer « ${p.name} »${asc.length ? ` et ses ${asc.length} ascension(s)` : ''} ?`)) {
            try { await deleteProblem(p.id); location.hash = '/' } catch (e) { alert('Erreur : ' + (e as Error).message) }
          }
        }}>Supprimer</button>
      </div>}
    </div>
  )
}
