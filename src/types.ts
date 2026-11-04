/** Coordonnées des prises : liste plate [x0,y0,x1,y1,...] normalisée entre 0 et 1 (Firestore n'accepte pas les tableaux imbriqués). */
export interface Hold { id: string; pts: number[] }
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
