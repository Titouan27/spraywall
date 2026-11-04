import { useRef } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { WALL_H, WALL_W } from './config'
import type { Circle, Role } from './types'

export const ROLES: Role[] = ['start', 'hand', 'foot', 'finish']
export const ROLE_COLOR: Record<Role, string> = { start: '#22c55e', hand: '#3b82f6', foot: '#facc15', finish: '#ef4444' }
export const ROLE_LABEL: Record<Role, string> = { start: 'Départ', hand: 'Main', foot: 'Pied', finish: 'Top' }

/** Rayon minimal (en pixels de la photo) de la zone qu'on peut attraper au doigt pour déplacer un cercle. */
const GRAB_R = 60

interface Props {
  circles: Circle[]
  /** true : le reste du mur est assombri pour faire ressortir les prises du bloc */
  dim?: boolean
  /** cercle en cours d'édition : mis en évidence et déplaçable au doigt */
  editing?: string | null
  /** tap sur le mur : position normalisée et cercle touché éventuel */
  onTap?: (x: number, y: number, circleId: string | null) => void
  /** glisser du cercle en cours d'édition */
  onDrag?: (x: number, y: number) => void
}

export default function Wall({ circles, dim, editing, onTap, onDrag }: Props) {
  const down = useRef<{ x: number; y: number } | null>(null)
  const dragging = useRef(false)
  const svg = useRef<SVGSVGElement>(null)

  const toWall = (clientX: number, clientY: number) => {
    const p = new DOMPoint(clientX, clientY).matrixTransform(svg.current!.getScreenCTM()!.inverse())
    return { x: Math.min(1, Math.max(0, p.x / WALL_W)), y: Math.min(1, Math.max(0, p.y / WALL_H)) }
  }
  function onClick(e: React.MouseEvent<SVGSVGElement>) {
    const d = down.current
    if (!onTap || !svg.current) return
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) return // déplacement/zoom, pas un tap
    const { x, y } = toWall(e.clientX, e.clientY)
    onTap(x, y, (e.target as Element).getAttribute('data-id'))
  }
  const geo = (c: Circle) => ({ cx: c.x * WALL_W, cy: c.y * WALL_H, r: c.r * WALL_W })
  const ed = circles.find(c => c.id === editing)

  return (
    <div className="wall">
      {/* la poignée « drag-handle » est exclue du déplacement du mur, pour pouvoir glisser le cercle */}
      <TransformWrapper minScale={1} maxScale={8} doubleClick={{ disabled: true }} wheel={{ step: 0.15 }} panning={{ excluded: ['drag-handle'] }}>
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%' }}>
          <div className="wall-inner">
            <img src={import.meta.env.BASE_URL + 'wall.jpg'} alt="Spray wall" draggable={false} />
            <svg ref={svg} viewBox={`0 0 ${WALL_W} ${WALL_H}`} onPointerDown={e => (down.current = { x: e.clientX, y: e.clientY })} onClick={onClick}>
              {dim && (
                <>
                  <mask id="m">
                    <rect width={WALL_W} height={WALL_H} fill="white" />
                    {circles.map(c => <circle key={c.id} {...geo(c)} fill="black" />)}
                  </mask>
                  <rect width={WALL_W} height={WALL_H} fill="black" opacity={0.6} mask="url(#m)" />
                </>
              )}
              {circles.map(c => (
                <circle key={c.id} data-id={c.id} {...geo(c)} className={'hold' + (c.id === editing ? ' sel' : '')}
                  style={{ stroke: ROLE_COLOR[c.role] }} strokeDasharray={c.role === 'foot' ? '12 8' : undefined} />
              ))}
              {ed && (
                <>
                  <circle cx={ed.x * WALL_W} cy={ed.y * WALL_H} r={ed.r * WALL_W + 14} className="sel-ring" />
                  <circle data-id={ed.id} cx={ed.x * WALL_W} cy={ed.y * WALL_H} r={Math.max(ed.r * WALL_W, GRAB_R)} className="drag-handle"
                    onPointerDown={e => { dragging.current = true; (e.target as Element).setPointerCapture(e.pointerId) }}
                    onPointerMove={e => { if (dragging.current && onDrag) { const p = toWall(e.clientX, e.clientY); onDrag(p.x, p.y) } }}
                    onPointerUp={() => (dragging.current = false)} onPointerCancel={() => (dragging.current = false)} />
                </>
              )}
            </svg>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
