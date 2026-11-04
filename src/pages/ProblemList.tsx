import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { GRADES, consensusGrade, gradeIndex } from '../grades'

export default function ProblemList({ user }: { user: string }) {
  const { problems, ascents, holds } = useStore()
  const [q, setQ] = useState('')
  const [min, setMin] = useState(GRADES[0])
  const [max, setMax] = useState(GRADES[GRADES.length - 1])
  const [sort, setSort] = useState<'recent' | 'popular' | 'grade'>('recent')
  const [hideDone, setHideDone] = useState(false)

  const rows = useMemo(() => problems.map(p => {
    const asc = ascents.filter(a => a.problemId === p.id)
    const stars = asc.length ? asc.reduce((s, a) => s + a.stars, 0) / asc.length : 0
    return { p, asc, stars, grade: consensusGrade(p.grade, asc.map(a => a.grade)), done: asc.some(a => a.user === user) }
  }), [problems, ascents, user])

  const list = rows
    .filter(r => gradeIndex(r.grade) >= gradeIndex(min) && gradeIndex(r.grade) <= gradeIndex(max))
    .filter(r => !hideDone || !r.done)
    .filter(r => !q || (r.p.name + ' ' + r.p.author).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === 'recent' ? b.p.createdAt - a.p.createdAt
      : sort === 'popular' ? b.asc.length - a.asc.length || b.stars - a.stars
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
            <option value="recent">Récents</option><option value="popular">Populaires</option><option value="grade">Cotation</option>
          </select>
        </div>
        <label className="check"><input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} /> Masquer mes blocs réussis</label>
      </div>
      {!holds.length && <p className="card center">👋 Première étape : <a href="#/holds">placer les prises sur le mur</a>.</p>}
      {!problems.length && <p className="muted center">Aucun bloc pour l'instant. <a href="#/new">Crée le premier !</a></p>}
      {problems.length > 0 && !list.length && <p className="muted center">Aucun bloc ne correspond aux filtres.</p>}
      {list.map(r => (
        <a key={r.p.id} href={'#/p/' + r.p.id} className="card problem-row">
          <span className="grade">{r.grade}</span>
          <span className="grow">
            <span><strong>{r.p.name}</strong>{r.done && <span className="done"> ✓</span>}</span>
            <small className="muted">par {r.p.author} · {r.asc.length} croix{r.stars > 0 && ' · ' + '★'.repeat(Math.round(r.stars))}</small>
          </span>
          <span className="muted">›</span>
        </a>
      ))}
    </div>
  )
}
