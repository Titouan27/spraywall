import { useState } from 'react'
import Wall, { toPoints } from '../Wall'
import { newId, saveHolds, useStore } from '../store'
import { WALL_H, WALL_W } from '../config'

type Mode = 'select' | 'circle' | 'poly'

const circle = (x: number, y: number, r: number) => {
  const pts: number[] = []
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pts.push(x + (Math.cos(a) * r) / WALL_W, y + (Math.sin(a) * r) / WALL_H) }
  return pts
}

export default function HoldsEditor() {
  const { holds, problems } = useStore()
  const [mode, setMode] = useState<Mode>('select')
  const [sel, setSel] = useState<string | null>(null)
  const [size, setSize] = useState(20)
  const [draft, setDraft] = useState<number[]>([])

  const usedBy = (id: string) => problems.filter(p => p.holds[id]).map(p => p.name)
  const add = (pts: number[]) => saveHolds([...holds, { id: newId(), pts }])

  function remove() {
    if (!sel) return
    const u = usedBy(sel)
    if (u.length && !confirm(`Cette prise est utilisée par : ${u.join(', ')}. La supprimer quand même ?`)) return
    saveHolds(holds.filter(h => h.id !== sel)); setSel(null)
  }
  function tapEmpty(x: number, y: number) {
    if (mode === 'circle') add(circle(x, y, size))
    else if (mode === 'poly') setDraft(d => [...d, x, y])
    else setSel(null)
  }
  function tapHold(id: string) {
    if (mode === 'select') setSel(s => (s === id ? null : id))
    else if (mode === 'poly') return
    else setSel(id)
  }

  return (
    <div className="stack">
      <div className="card toolbar">
        <strong>Éditeur de prises ({holds.length})</strong>
        <div className="row">
          {([['select', 'Sélection'], ['circle', 'Ajouter ◯'], ['poly', 'Dessiner ⬠']] as [Mode, string][]).map(([m, l]) => (
            <button key={m} className={mode === m ? 'on' : ''} onClick={() => { setMode(m); setDraft([]) }}>{l}</button>
          ))}
        </div>
        {mode === 'select' && <div className="row"><span className="muted">{sel ? `Prise sélectionnée${usedBy(sel).length ? ` (utilisée dans ${usedBy(sel).length} bloc·s)` : ''}` : 'Touche une prise pour la sélectionner.'}</span>{sel && <button className="danger" onClick={remove}>Supprimer</button>}</div>}
        {mode === 'circle' && <label className="row">Taille<input type="range" min={6} max={80} value={size} onChange={e => setSize(+e.target.value)} /><span className="muted">Touche le mur pour ajouter.</span></label>}
        {mode === 'poly' && <div className="row"><span className="muted">Touche le contour point par point ({draft.length / 2} pts).</span>
          <button className="primary" disabled={draft.length < 6} onClick={() => { add(draft); setDraft([]) }}>Valider</button>
          <button disabled={!draft.length} onClick={() => setDraft(d => d.slice(0, -2))}>Annuler point</button></div>}
      </div>
      <Wall holds={holds} mode="edit" selected={sel} onTapHold={tapHold} onTapEmpty={tapEmpty}>
        {draft.length >= 2 && <polyline points={toPoints(draft)} className="draft" />}
        {Array.from({ length: draft.length / 2 }, (_, i) => <circle key={i} cx={draft[i * 2] * WALL_W} cy={draft[i * 2 + 1] * WALL_H} r={5} className="draft-pt" />)}
      </Wall>
      <p className="muted small">Astuce : pince/molette pour zoomer. En mode « Dessiner », touche les prises existantes n'a pas d'effet — zoome pour viser à côté.</p>
    </div>
  )
}
