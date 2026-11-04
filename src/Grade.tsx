import { gradeColors } from './grades'

/** Étiquette de cotation colorée selon le niveau. */
export default function Grade({ g, small }: { g: string; small?: boolean }) {
  const { bg, fg } = gradeColors(g)
  return <span className={'grade' + (small ? ' sm' : '')} style={{ background: bg, color: fg }}>{g}</span>
}
