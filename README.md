# 🧗 Spray Wall

Base de blocs communautaire pour notre spray wall. Chacun crée des blocs en posant des cercles sur la photo du mur.

- **Front** : React + TypeScript + Vite, hébergé gratuitement sur **GitHub Pages**
- **Données partagées** : **Firebase Firestore** (offre gratuite « Spark », sans mise en veille)
- **Pas de compte** : on entre juste un pseudo (gardé dans le navigateur)

## Fonctionnement
- **Créer un bloc** (« ＋ Bloc ») : choisir le type de prise — **Départ** (vert), **Main** (bleu), **Pied** (jaune, pointillés), **Top** (rouge) — et la taille, puis toucher les prises sur la photo pour poser des cercles. Toucher un cercle permet de changer son type, sa taille ou de le retirer. Zoom : pincer / molette.
- Chaque bloc a un nom, une cotation (Fontainebleau), une description et l'auteur (pseudo).
- **Liste** : recherche par nom/auteur, filtre de cotation, tri par date ou cotation.
- C'est une base communautaire : tout le monde peut modifier ou supprimer un bloc.

## Développement
```bash
npm install
npm run dev
```
Sans configuration Firebase, le site tourne en **mode démo** (blocs stockés dans le navigateur uniquement).

## Mise en ligne
1. **Firebase** (≈ 5 min) — https://console.firebase.google.com
   - Créer un projet (Google Analytics inutile)
   - *Build > Firestore Database > Create database* (région `europe-west`, mode production)
   - Onglet *Règles* : coller le contenu de `firestore.rules` et publier
   - *Paramètres du projet > Vos applications > Web (</>)* : copier l'objet `firebaseConfig` dans `src/config.ts`
     (ces clés sont publiques par nature, c'est normal de les committer)
2. **GitHub Pages**
   - Pousser ce dépôt sur GitHub (branche `main`)
   - *Settings > Pages > Source* : **GitHub Actions**
   - Le site est publié à chaque push sur `https://<pseudo>.github.io/<depot>/`

## Changer de photo
Remplacer `public/wall.jpg` et mettre à jour `WALL_W` / `WALL_H` dans `src/config.ts`. Les cercles sont positionnés relativement à la photo : les blocs existants ne correspondront plus si le cadrage change.
