# 🧗 Spray Wall

Base de blocs communautaire pour notre spray wall. Chacun crée des blocs en posant des cercles sur la photo du mur.

- **Front** : React + TypeScript + Vite, hébergé gratuitement sur **GitHub Pages**
- **Données partagées** : **Firebase Firestore** (offre gratuite « Spark », sans mise en veille)
- **Consultation libre** : sans connexion, le site est en lecture seule
- **Connexion Google** pour créer des blocs ; chacun ne peut modifier ou supprimer que les siens

## Fonctionnement
- **Créer un bloc** (« ＋ Bloc ») : choisir le type de prise — **Départ** (vert), **Main** (bleu), **Pied** (jaune, pointillés), **Top** (rouge) — et la taille, puis toucher les prises sur la photo pour poser des cercles. Toucher un cercle permet de changer son type, sa taille ou de le retirer. Zoom : pincer / molette.
- Chaque bloc a un nom, une cotation (Fontainebleau), une description et l'auteur (pseudo).
- **Liste** : recherche par nom/auteur, filtre sur la cotation proposée, tri par date, cotation ou popularité ; badges ✓ (fait) et 🎯 (projet).
- **Ascensions** (connecté) : sur un bloc, « ✓ Je l'ai fait » avec sa cotation et la date. La **cotation ressentie** est la moyenne des cotations des grimpeurs ayant fait le bloc (auteur compris s'il le valide), arrondie à la cotation la plus proche. La cotation proposée par l'auteur reste affichée à côté.
- **Projets** (connecté, privés) : « 🎯 Projet » sur un bloc ; il passe dans les ascensions une fois validé.
- **Onglets** (connecté) : Blocs · Mes ascensions (stats et pyramide) · Mes projets.
- **Commentaires** sous chaque bloc : lisibles par tous, publiés une fois connecté (500 caractères max). Chacun supprime les siens ; l'auteur d'un bloc peut supprimer ceux de son bloc. Pas de modification après publication.
- **Connexion** : bouton « Se connecter » (Google). À la première connexion, on choisit un pseudo unique et définitif, affiché sur ses blocs.
- **Droits** (vérifiés par les règles Firestore, pas seulement dans l'interface) : tout le monde lit ; un compte avec pseudo crée des blocs ; seul l'auteur modifie ou supprime son bloc.

## Développement
```bash
npm install
npm run dev
```
Sans configuration Firebase, le site tourne en **mode démo** (blocs stockés dans le navigateur uniquement, connexion simulée).

Avec les émulateurs Firebase (nécessite Java) — aucune donnée réelle touchée :
```bash
npm run dev:emu      # site local branché sur des émulateurs (connexion Google simulée par un e-mail)
npm run test:rules   # tests automatiques des règles de sécurité
```

## Mise en ligne
1. **Firebase** (≈ 5 min) — https://console.firebase.google.com
   - Créer un projet (Google Analytics inutile)
   - *Build > Firestore Database > Create database* (région `europe-west`, mode production)
   - Onglet *Règles* : coller le contenu de `firestore.rules` et publier
   - *Build > Authentication > Get started* → onglet *Sign-in method* → activer **Google**
   - *Authentication > Settings > Authorized domains* → ajouter `<pseudo>.github.io`
   - *Paramètres du projet > Vos applications > Web (</>)* : copier l'objet `firebaseConfig` dans `src/config.ts`
     (ces clés sont publiques par nature, c'est normal de les committer)
2. **GitHub Pages**
   - Pousser ce dépôt sur GitHub (branche `main`)
   - *Settings > Pages > Source* : **GitHub Actions**
   - Le site est publié à chaque push sur `https://<pseudo>.github.io/<depot>/`

## Changer de photo
Remplacer `public/wall.jpg` et mettre à jour `WALL_W` / `WALL_H` dans `src/config.ts`. Les cercles sont positionnés relativement à la photo : les blocs existants ne correspondront plus si le cadrage change.
