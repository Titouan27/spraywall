import { useState } from 'react'
import Wall, { ROLE_COLOR, ROLE_LABEL } from '../Wall'
import { deleteAscent, deleteProblem, newId, saveAscent, useStore } from '../store'
import { GRADES, consensusGrade } from '../grades'
import type { Role } from '../types'

const today = () => new Date().toISOString().slice(0, 10)

export default function ProblemView({ id, user }: { id: string; user: string }) {
  const { problems, ascents, holds } = useStore()
  const p = problems.find(x => x.id === id)
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(today())
  const [attempts, setAttempts] = useState(1)
  const [grade, setGrade] = useState(p?.grade ?? '6A')
  const [stars, setStars] = useState(2)
  const [comment, setComment] = useState('')
  if (!p) return <p className="muted center">Bloc introuvable. <a href="#/">Retour</a></p>

  const asc = ascents.filter(a => a.problemId === id).sort((a, b) => b.date.localeCompare(a.date))
  const cons = consensusGrade(p.grade, asc.map(a => a.grade))
  const avgStars = asc.length ? asc.reduce((s, a) => s + a.stars, 0) / asc.length : 0
  const missing = Object.keys(p.holds).filter(h => !holds.some(x => x.id === h)).length

  async function log(e: React.FormEvent) {
    e.preventDefault()
    await saveAscent({ id: newId(), problemId: id, user, date, attempts, flash: attempts === 1, grade, stars, comment: comment.trim(), createdAt: Date.now() })
    setOpen(false); setComment('')
  }

  return (
    <div className="stack">
      <Wall holds={holds} roles={p.holds} mode="view" />
      <div className="card">
        <div className="row between">
          <h2>{p.name} <span className="grade">{cons}</span></h2>
          {p.author === user && <span className="row">
            <a className="btn" href={'#/edit/' + p.id}>Modifier</a>
            <button className="danger" onClick={async () => { if (confirm('Supprimer ce bloc et ses croix ?')) { await deleteProblem(p.id); location.hash = '/' } }}>Suppr.</button>
          </span>}
        </div>
        <p className="muted">Ouvert par {p.author} en {p.grade} · {new Date(p.createdAt).toLocaleDateString('fr-FR')}
          {avgStars > 0 && <> · {'★'.repeat(Math.round(avgStars))}</>}</p>
        {p.description && <p className="desc">{p.description}</p>}
        <div className="legend">{(Object.keys(ROLE_COLOR) as Role[]).map(r => <span key={r}><i style={{ borderColor: ROLE_COLOR[r] }} />{ROLE_LABEL[r]}</span>)}</div>
        {missing > 0 && <p className="warn">⚠️ {missing} prise(s) de ce bloc ont été retirées du mur.</p>}
      </div>

      {!open ? <button className="primary big" onClick={() => setOpen(true)}>✓ J'ai enchaîné ce bloc</button> : (
        <form className="card stack" onSubmit={log}>
          <h3>Enregistrer ma croix</h3>
          <div className="row">
            <label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
            <label>Essais<input type="number" min={1} value={attempts} onChange={e => setAttempts(Math.max(1, +e.target.value))} /></label>
          </div>
          <div className="row">
            <label>Ma cotation<select value={grade} onChange={e => setGrade(e.target.value)}>{GRADES.map(g => <option key={g}>{g}</option>)}</select></label>
            <label>Note<span className="stars">{[1, 2, 3].map(n => <button type="button" key={n} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)}>★</button>)}</span></label>
          </div>
          <label>Commentaire / beta<textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} /></label>
          <div className="row"><button className="primary">Enregistrer {attempts === 1 && '(flash ⚡)'}</button><button type="button" onClick={() => setOpen(false)}>Annuler</button></div>
        </form>
      )}

      <div className="card">
        <h3>Croix ({asc.length})</h3>
        {!asc.length && <p className="muted">Personne ne l'a encore enchaîné.</p>}
        {asc.map(a => (
          <div key={a.id} className="ascent">
            <div className="row between">
              <span><strong>{a.user}</strong> {a.flash ? '⚡ flash' : `en ${a.attempts} essais`} · <span className="grade sm">{a.grade}</span> {'★'.repeat(a.stars)}</span>
              <span className="muted">{new Date(a.date).toLocaleDateString('fr-FR')}{a.user === user && <button className="link" onClick={() => confirm('Supprimer cette croix ?') && deleteAscent(a.id)}>✕</button>}</span>
            </div>
            {a.comment && <p className="muted">{a.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
