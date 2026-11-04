import { useState } from 'react'
import { useStore } from '../store'
import { GRADES, gradeIndex } from '../grades'
import Grade from '../Grade'

export default function ProblemList() {
  const { problems } = useStore()
  const [q, setQ] = useState('')
  const [min, setMin] = useState(GRADES[0])
  const [max, setMax] = useState(GRADES[GRADES.length - 1])
  const [sort, setSort] = useState<'recent' | 'grade'>('recent')

  const list = problems
    .filter(p => gradeIndex(p.grade) >= gradeIndex(min) && gradeIndex(p.grade) <= gradeIndex(max))
    .filter(p => !q || (p.name + ' ' + p.author).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === 'recent' ? b.createdAt - a.createdAt : gradeIndex(a.grade) - gradeIndex(b.grade))

  return (
    <div className="stack">
      <div className="filters card">
        <input placeholder="Rechercher un bloc ou un auteur…" value={q} onChange={e => setQ(e.target.value)} />
        <div className="row">
          <select value={min} onChange={e => setMin(e.target.value)}>{GRADES.map(g => <option key={g}>{g}</option>)}</select>
          <span className="muted">à</span>
          <select value={max} onChange={e => setMax(e.target.value)}>{GRADES.map(g => <option key={g}>{g}</option>)}</select>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
            <option value="recent">Récents</option><option value="grade">Cotation</option>
          </select>
        </div>
      </div>
      {!problems.length && <p className="muted center">Aucun bloc pour l'instant. <a href="#/new">Crée le premier !</a></p>}
      {problems.length > 0 && !list.length && <p className="muted center">Aucun bloc ne correspond aux filtres.</p>}
      <p className="muted small">{list.length} bloc{list.length > 1 ? 's' : ''}</p>
      {list.map(p => (
        <a key={p.id} href={'#/p/' + p.id} className="card problem-row">
          <Grade g={p.grade} />
          <span className="grow"><strong>{p.name}</strong><small className="muted">par {p.author}</small></span>
          <span className="muted">›</span>
        </a>
      ))}
    </div>
  )
}
