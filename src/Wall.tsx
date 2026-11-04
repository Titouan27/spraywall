import { useRef } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { WALL_H, WALL_W } from './config'
import type { Circle, Role } from './types'

export const ROLES: Role[] = ['start', 'hand', 'foot', 'finish']
export const ROLE_COLOR: Record<Role, string> = { start: '#22c55e', hand: '#3b82f6', foot: '#facc15', finish: '#ef4444' }
export const ROLE_LABEL: Record<Role, string> = { start: 'Départ', hand: 'Main', foot: 'Pied', finish: 'Top' }

interface Props {
  circles: Circle[]
  /** true : le reste du mur est assombri pour faire ressortir les prises du bloc */
  dim?: boolean
  selected?: string | null
  onTapCircle?: (id: string) => void
  onTapEmpty?: (x: number, y: number) => void
}

export default function Wall({ circles, dim, selected, onTapCircle, onTapEmpty }: Props) {
  const down = useRef<{ x: number; y: number } | null>(null)
  const svg = useRef<SVGSVGElement>(null)

  function onClick(e: React.MouseEvent<SVGSVGElement>) {
    const d = down.current
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) return // déplacement/zoom, pas un tap
    const id = (e.target as Element).getAttribute('data-id')
    if (id) return onTapCircle?.(id)
    if (onTapEmpty && svg.current) {
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.current.getScreenCTM()!.inverse())
      onTapEmpty(p.x / WALL_W, p.y / WALL_H)
    }
  }
  const geo = (c: Circle) => ({ cx: c.x * WALL_W, cy: c.y * WALL_H, r: c.r * WALL_W })

  return (
    <div className="wall">
      <TransformWrapper minScale={1} maxScale={8} doubleClick={{ disabled: true }} wheel={{ step: 0.15 }}>
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
                <circle key={c.id} data-id={c.id} {...geo(c)} className={'hold' + (selected === c.id ? ' sel' : '')}
                  style={{ stroke: ROLE_COLOR[c.role] }} strokeDasharray={c.role === 'foot' ? '12 8' : undefined} />
              ))}
            </svg>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
