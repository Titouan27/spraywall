/**
 * Configuration du site.
 *
 * FIREBASE : colle ici la config de ton projet Firebase (console Firebase > Paramètres du projet > Vos applications > Web).
 * Tant que `firebaseConfig` vaut null, le site fonctionne en « mode démo » : les blocs restent dans le navigateur.
 */
export const firebaseConfig: Record<string, string> | null = {
  apiKey: 'AIzaSyAffrHD9QUlgXBiDYlR0YgNxVUNd3LwEA0',
  authDomain: 'spray-f2269.firebaseapp.com',
  projectId: 'spray-f2269',
  storageBucket: 'spray-f2269.firebasestorage.app',
  messagingSenderId: '768677734861',
  appId: '1:768677734861:web:db0bc251d798e147703c84',
}

/** Dimensions en pixels de la photo du mur (public/wall.jpg). */
export const WALL_W = 1500
export const WALL_H = 1320
