/**
 * Configuration du site.
 *
 * FIREBASE : colle ici la config de ton projet Firebase (console Firebase > Paramètres du projet > Vos applications > Web).
 * Tant que `firebaseConfig` vaut null, le site fonctionne en « mode démo » : les données restent dans le navigateur.
 */
export const firebaseConfig: Record<string, string> | null = null

/** Code d'accès partagé du groupe (vide = pas de code). Simple garde-fou, pas une vraie sécurité. */
export const GROUP_CODE = ''

/** Dimensions en pixels de la photo du mur (public/wall.jpg). */
export const WALL_W = 1500
export const WALL_H = 1320
