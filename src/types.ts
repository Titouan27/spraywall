export type Role = 'start' | 'hand' | 'foot' | 'finish'
/** Cercle posé sur la photo. x, y : position normalisée (0–1) ; r : rayon en fraction de la largeur de la photo. */
export interface Circle { id: string; x: number; y: number; r: number; role: Role }
export interface Problem {
  id: string
  name: string
  grade: string
  description: string
  /** pseudo de la personne qui a créé le bloc */
  author: string
  circles: Circle[]
  createdAt: number
  updatedAt: number
}
