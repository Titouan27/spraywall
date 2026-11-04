import { useState } from 'react'
import Wall from '../Wall'
import { newId, saveHolds, useStore } from '../store'
import { WALL_W } from '../config'

type Mode = 'add' | 'edit'

export default function HoldsEditor() {
  const { holds, problems } = useStore()
  const [mode, setMode] = useState<Mode>('add')
  const [sel, setSel] = useState<string | null>(null)
  const [size, setSize] = useState(22) // rayon en pixels de la photo
  const [last, setLast] = useState<string | null>(null)
  const selHold = holds.find(h => h.id === sel)
  const usedBy = (id: string) => problems.filter(p => p.holds[id]).map(p => p.name)
  const update = (id: string, patch: Partial<(typeof holds)[number]>) => saveHolds(holds.map(h => (h.id === id ? { ...h, ...patch } : h)))

  function tapEmpty(x: number, y: number) {
    if (mode === 'add') {
      const id = newId()
      saveHolds([...holds, { id, x, y, r: size / WALL_W }]); setLast(id)
    } else if (sel) update(sel, { x, y }) // déplacer la prise sélectionnée
  }
  function tapHold(id: string) {
    if (mode === 'add') setMode('edit')
    setSel(s => (s === id && mode === 'edit' ? null : id))
    const h = holds.find(x => x.id === id); if (h) setSize(Math.round(h.r * WALL_W))
  }
  function remove(id: string) {
    const u = usedBy(id)
    if (u.length && !confirm(`Cette prise est utilisée par : ${u.join(', ')}. La supprimer quand même ?`)) return
    saveHolds(holds.filter(h => h.id !== id)); setSel(null); if (last === id) setLast(null)
  }
  function resize(v: number) {
    setSize(v)
    if (mode === 'edit' && sel) update(sel, { r: v / WALL_W })
  }

  return (
    <div className="stack">
      <div className="card toolbar">
        <div className="row between">
          <strong>Prises du mur ({holds.length})</strong>
          <a href="#/">Terminé</a>
        </div>
        <div className="row">
          <button className={mode === 'add' ? 'on' : ''} onClick={() => { setMode('add'); setSel(null) }}>＋ Ajouter</button>
          <button className={mode === 'edit' ? 'on' : ''} onClick={() => setMode('edit')}>✎ Modifier</button>
        </div>
        <label className="check">Taille
          <input type="range" min={6} max={90} value={size} onChange={e => resize(+e.target.value)} style={{ flex: 1 }} />
        </label>
        {/* hauteur fixe : la barre ne doit pas changer de taille, sinon le mur se décale sous le doigt */}
        <div className="row hint">
          <span className="muted small grow">{mode === 'add' ? "Touche le centre d'une prise pour la placer. Touche un cercle existant pour le modifier."
            : selHold ? `Touche le mur pour déplacer la prise, règle sa taille avec le curseur.${usedBy(selHold.id).length ? ` Utilisée dans ${usedBy(selHold.id).length} bloc(s).` : ''}`
              : 'Touche une prise pour la sélectionner.'}</span>
          {mode === 'add'
            ? <button disabled={!last || !holds.some(h => h.id === last)} onClick={() => last && remove(last)}>↶ Annuler</button>
            : <button className="danger" disabled={!selHold} onClick={() => selHold && remove(selHold.id)}>Supprimer</button>}
        </div>
      </div>
      <Wall holds={holds} mode="edit" selected={sel} onTapHold={tapHold} onTapEmpty={tapEmpty} />
    </div>
  )
}
