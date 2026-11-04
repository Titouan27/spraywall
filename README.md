# 🧗 Spray Wall

Site communautaire pour notre spray wall : créer des blocs en sélectionnant les prises sur la photo, enregistrer ses croix et voter les cotations (Fontainebleau).

- **Front** : React + TypeScript + Vite, hébergé gratuitement sur **GitHub Pages**
- **Données partagées** : **Firebase Firestore** (offre gratuite « Spark », aucune mise en veille)
- **Accès** : simple pseudo, avec un code de groupe optionnel. Pas de mot de passe.

## Fonctionnalités
- Photo du mur zoomable (pincer / molette) avec les prises (cercles) cliquables
- Création de bloc : prises de **départ** (vert), **main** (bleu), **pied** (jaune, pointillés), **top** (rouge)
- Liste des blocs : recherche, filtre de cotation, tri, masquer ses blocs réussis
- Croix : date, nombre d'essais (flash ⚡), cotation ressentie, note ★ à ★★★, commentaire/beta
- Cotation affichée = **médiane** des votes (cotation d'ouverture incluse)
- Profil : carnet, pyramide de niveaux, ouvertures
- Éditeur des prises (lien en bas de la page profil) : chaque prise est un cercle placé à la main (ajouter, déplacer, redimensionner, supprimer)

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

## Placer les prises
Au premier lancement le mur est vide : ouvrir **Profil > Placer / modifier les prises du mur**.
- **Ajouter** : régler la taille, puis toucher le centre de chaque prise (zoomer pour être précis). « ↶ Annuler » retire le dernier cercle.
- **Modifier** : toucher un cercle pour le sélectionner, puis toucher le mur pour le déplacer, ou régler sa taille avec le curseur. Supprimer une prise utilisée dans un bloc demande une confirmation.

## Changer de photo
Remplacer `public/wall.jpg` et mettre à jour `WALL_W` / `WALL_H` dans `src/config.ts`. Les positions des prises sont relatives à la photo : il faudra les replacer si le cadrage change.
