/** Prise = cercle. x, y : position normalisée (0–1) sur la photo ; r : rayon en fraction de la largeur de la photo. */
export interface Hold { id: string; x: number; y: number; r: number }
export type Role = 'start' | 'hand' | 'foot' | 'finish'
export interface Problem {
  id: string
  name: string
  author: string
  grade: string
  description: string
  holds: Record<string, Role>
  createdAt: number
}
export interface Ascent {
  id: string
  problemId: string
  user: string
  date: string
  attempts: number
  flash: boolean
  grade: string
  stars: number
  comment: string
  createdAt: number
}
