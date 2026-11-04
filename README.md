# 🧗 Spray Wall

Site communautaire pour notre spray wall : créer des blocs en sélectionnant les prises sur la photo, enregistrer ses croix et voter les cotations (Fontainebleau).

- **Front** : React + TypeScript + Vite, hébergé gratuitement sur **GitHub Pages**
- **Données partagées** : **Firebase Firestore** (offre gratuite « Spark », aucune mise en veille)
- **Accès** : simple pseudo, avec un code de groupe optionnel. Pas de mot de passe.

## Fonctionnalités
- Photo du mur zoomable (pincer / molette) avec les prises cliquables
- Création de bloc : prises de **départ** (vert), **main** (bleu), **pied** (jaune, pointillés), **top** (rouge)
- Liste des blocs : recherche, filtre de cotation, tri, masquer ses blocs réussis
- Croix : date, nombre d'essais (flash ⚡), cotation ressentie, note ★ à ★★★, commentaire/beta
- Cotation affichée = **médiane** des votes (cotation d'ouverture incluse)
- Profil : carnet, pyramide de niveaux, ouvertures
- Éditeur des prises (lien en bas de la page profil) pour corriger la détection automatique

## Développement
```bash
npm install
npm run dev
```
Sans configuration Firebase, le site tourne en **mode démo** (données stockées dans le navigateur).

## Mise en ligne
1. **Firebase** (≈ 5 min) — https://console.firebase.google.com
   - Créer un projet (Google Analytics inutile)
   - *Build > Authentication > Get started* → activer **Anonymous**
   - *Build > Firestore Database > Create database* (région `europe-west`, mode production)
   - Onglet *Règles* : coller le contenu de `firestore.rules` et publier
   - *Paramètres du projet > Vos applications > Web (</>)* : copier l'objet `firebaseConfig` dans `src/config.ts`
     (ces clés sont publiques par nature, c'est normal de les committer)
2. **GitHub Pages**
   - Pousser ce dépôt sur GitHub (branche `main`)
   - *Settings > Pages > Source* : **GitHub Actions**
   - Le site est publié à chaque push sur `https://<pseudo>.github.io/<depot>/`
3. (Optionnel) Dans `src/config.ts`, définir `GROUP_CODE` pour demander un code à l'entrée.

## Changer de photo
Remplacer `public/wall.jpg`, mettre à jour `WALL_W`/`WALL_H` dans `src/config.ts`, puis :
```bash
pip install opencv-python-headless numpy
python3 tools/detect_holds.py   # adapter le contour du mur dans le script
```
⚠️ La liste initiale ne sert qu'au premier lancement : une fois Firestore initialisé, les prises se modifient via l'éditeur.
