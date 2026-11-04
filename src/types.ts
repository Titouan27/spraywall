export type Role = 'start' | 'hand' | 'foot' | 'finish'
/** Cercle posé sur la photo. x, y : position normalisée (0–1) ; r : rayon en fraction de la largeur de la photo. */
export interface Circle { id: string; x: number; y: number; r: number; role: Role }
export interface Problem {
  id: string
  name: string
  grade: string
  description: string
  /** pseudo de la personne qui a créé le bloc (vérifié par les règles Firestore) */
  author: string
  /** identifiant du compte de l'auteur : seul lui peut modifier ou supprimer le bloc */
  authorUid: string
  circles: Circle[]
  createdAt: number
  updatedAt: number
}

/** Utilisateur connecté */
export interface Me { uid: string; name: string }
