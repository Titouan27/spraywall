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

/** Ascension : une par grimpeur et par bloc (id = `${uid}_${problemId}`). Publique (sert à la cotation ressentie). */
export interface Ascent {
  id: string
  uid: string
  /** pseudo du grimpeur (vérifié par les règles Firestore) */
  user: string
  problemId: string
  /** cotation donnée par le grimpeur */
  grade: string
  /** date de l'ascension, AAAA-MM-JJ */
  date: string
  createdAt: number
}

/** Bloc mis en projet : privé, un par grimpeur et par bloc (id = `${uid}_${problemId}`). */
export interface Project { id: string; uid: string; problemId: string; createdAt: number }
