import { useState } from 'react'
import { signIn, useStore } from '../store'
import { GRADES, gradeIndex } from '../grades'
import Grade from '../Grade'
import type { Me } from '../types'

export default function ProblemList({ me }: { me: Me | null }) {
  const { problems, ascents, projects } = useStore()
  const [q, setQ] = useState('')
  const [min, setMin] = useState(GRADES[0])
  const [max, setMax] = useState(GRADES[GRADES.length - 1])
  const [sort, setSort] = useState<'recent' | 'grade' | 'popular'>('recent')
  const [hideDone, setHideDone] = useState(false)

  const count = (id: string) => ascents.filter(a => a.problemId === id).length
  const done = new Set(me ? ascents.filter(a => a.uid === me.uid).map(a => a.problemId) : [])
  const proj = new Set(projects.map(p => p.problemId))

  // le filtre de cotation porte sur la cotation proposée
  const list = problems
    .filter(p => gradeIndex(p.grade) >= gradeIndex(min) && gradeIndex(p.grade) <= gradeIndex(max))
    .filter(p => !q || (p.name + ' ' + p.author).toLowerCase().includes(q.toLowerCase()))
    .filter(p => !hideDone || !done.has(p.id))
    .sort((a, b) => sort === 'recent' ? b.createdAt - a.createdAt
      : sort === 'popular' ? count(b.id) - count(a.id) || b.createdAt - a.createdAt
        : gradeIndex(a.grade) - gradeIndex(b.grade))

  return (
    <div className="stack">
      <div className="filters card">
        <input placeholder="Rechercher un bloc ou un auteur…" value={q} onChange={e => setQ(e.target.value)} />
        <div className="row">
          <select value={min} onChange={e => setMin(e.target.value)}>{GRADES.map(g => <option key={g}>{g}</option>)}</select>
          <span className="muted">à</span>
          <select value={max} onChange={e => setMax(e.target.value)}>{GRADES.map(g => <option key={g}>{g}</option>)}</select>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
            <option value="recent">Récents</option><option value="grade">Cotation</option><option value="popular">Populaires</option>
          </select>
        </div>
        {me && <label className="check"><input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} /> Masquer mes blocs faits</label>}
      </div>
      {!me && <p className="card small muted readonly">👀 Lecture seule. <button className="link accent" onClick={signIn}>Connecte-toi</button> pour créer des blocs et enregistrer tes ascensions.</p>}
      {!problems.length && <p className="muted center">Aucun bloc pour l'instant.{me && <> <a href="#/new">Crée le premier !</a></>}</p>}
      {problems.length > 0 && !list.length && <p className="muted center">Aucun bloc ne correspond aux filtres.</p>}
      <p className="muted small">{list.length} bloc{list.length > 1 ? 's' : ''}</p>
      {list.map(p => (
        <a key={p.id} href={'#/p/' + p.id} className="card problem-row">
          <Grade g={p.grade} />
          <span className="grow">
            <span><strong>{p.name}</strong>{done.has(p.id) && <span className="badge done"> ✓</span>}{proj.has(p.id) && <span className="badge"> 🎯</span>}</span>
            <small className="muted">par {p.author}{me && p.authorUid === me.uid && ' (toi)'} · {count(p.id)} ascension{count(p.id) > 1 ? 's' : ''}</small>
          </span>
          <span className="muted">›</span>
        </a>
      ))}
    </div>
  )
}
