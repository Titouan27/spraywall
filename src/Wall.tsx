import { useRef, type ReactNode } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { WALL_H, WALL_W } from './config'
import type { Hold, Role } from './types'

export const ROLE_COLOR: Record<Role, string> = { start: '#22c55e', hand: '#3b82f6', foot: '#facc15', finish: '#ef4444' }
export const ROLE_LABEL: Record<Role, string> = { start: 'Départ', hand: 'Main', foot: 'Pied', finish: 'Top' }

export const toPoints = (pts: number[]) => {
  const out: string[] = []
  for (let i = 0; i < pts.length; i += 2) out.push(`${(pts[i] * WALL_W).toFixed(1)},${(pts[i + 1] * WALL_H).toFixed(1)}`)
  return out.join(' ')
}

interface Props {
  holds: Hold[]
  roles?: Record<string, Role>
  /** 'view' : seules les prises du bloc sont visibles, le reste est assombri. 'edit' : toutes les prises sont visibles. */
  mode: 'view' | 'edit'
  selected?: string | null
  onTapHold?: (id: string) => void
  onTapEmpty?: (x: number, y: number) => void
  children?: ReactNode
}

export default function Wall({ holds, roles = {}, mode, selected, onTapHold, onTapEmpty, children }: Props) {
  const down = useRef<{ x: number; y: number } | null>(null)
  const svg = useRef<SVGSVGElement>(null)

  function onClick(e: React.MouseEvent<SVGSVGElement>) {
    const d = down.current
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) return // c'était un déplacement, pas un tap
    const id = (e.target as Element).getAttribute('data-id')
    if (id && onTapHold) return onTapHold(id)
    if (onTapEmpty && svg.current) {
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.current.getScreenCTM()!.inverse())
      onTapEmpty(p.x / WALL_W, p.y / WALL_H)
    }
  }
  const used = holds.filter(h => roles[h.id])

  return (
    <div className="wall">
      <TransformWrapper minScale={1} maxScale={8} doubleClick={{ disabled: true }} wheel={{ step: 0.15 }}>
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%' }}>
          <div className="wall-inner">
            <img src={import.meta.env.BASE_URL + 'wall.jpg'} alt="Spray wall" draggable={false} />
            <svg ref={svg} viewBox={`0 0 ${WALL_W} ${WALL_H}`} onPointerDown={e => (down.current = { x: e.clientX, y: e.clientY })} onClick={onClick}>
              {mode === 'view' && (
                <>
                  <mask id="m">
                    <rect width={WALL_W} height={WALL_H} fill="white" />
                    {used.map(h => <polygon key={h.id} points={toPoints(h.pts)} fill="black" stroke="black" strokeWidth={10} />)}
                  </mask>
                  <rect width={WALL_W} height={WALL_H} fill="black" opacity={0.6} mask="url(#m)" />
                </>
              )}
              {holds.map(h => {
                const r = roles[h.id]
                if (mode === 'view' && !r) return null
                return (
                  <polygon key={h.id} data-id={h.id} points={toPoints(h.pts)}
                    className={'hold' + (r ? ' role' : '') + (selected === h.id ? ' sel' : '')}
                    style={r ? { stroke: ROLE_COLOR[r] } : undefined} strokeDasharray={r === 'foot' ? '10 6' : undefined} />
                )
              })}
              {children}
            </svg>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
