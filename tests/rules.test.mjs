// Tests des règles Firestore contre les émulateurs Firebase.
// Lancer : npm run test:rules   (nécessite Java)
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, collection, getFirestore, query, setDoc, where, writeBatch } from 'firebase/firestore'

const PROJECT = 'demo-spraywall'
await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' })
await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' })

let n = 0, failed = 0
async function check(label, shouldPass, fn) {
  n++
  let ok
  try { await fn(); ok = true } catch { ok = false }
  if (ok !== shouldPass) failed++
  console.log(`${ok === shouldPass ? '✓' : '✗'} ${label} (${shouldPass ? 'autorisé' : 'refusé'} attendu)`)
}
async function client(sub) {
  const app = initializeApp({ projectId: PROJECT, apiKey: 'fake' }, sub || 'visiteur')
  const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8080)
  if (!sub) return { db, uid: null }
  const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  const { user } = await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub, email: sub + '@test.fr', email_verified: true })))
  return { db, uid: user.uid }
}
function claim({ db, uid }, name) {
  const b = writeBatch(db)
  b.set(doc(db, 'usernames', name.toLowerCase()), { uid })
  b.set(doc(db, 'users', uid), { name, key: name.toLowerCase() })
  return b.commit()
}
const C = [{ id: 'c1', x: .5, y: .5, r: .015, role: 'hand' }]
const problem = (id, author, authorUid, extra = {}) => ({ id, name: 'Test', grade: '6A', description: '', author, authorUid, circles: C, createdAt: 1, updatedAt: 1, ...extra })

const alice = await client('alice'), bob = await client('bob'), eve = await client('eve'), guest = await client(null)

console.log('— Pseudos')
await check('Alice réserve « Alice »', true, () => claim(alice, 'Alice'))
await check('Bob ne peut pas prendre « alice »', false, () => claim(bob, 'alice'))
await check('Bob réserve « Bob »', true, () => claim(bob, 'Bob'))
await check('Bob ne peut pas changer son pseudo', false, () => setDoc(doc(bob.db, 'users', bob.uid), { name: 'Alice', key: 'alice' }))
await check('Bob ne peut pas réserver un 2e pseudo', false, () => claim(bob, 'Robert'))
await check('Eve ne peut pas réserver un pseudo sans profil', false, () => setDoc(doc(eve.db, 'usernames', 'evil'), { uid: eve.uid }))
await check('Eve ne peut pas créer le profil de Bob', false, () => setDoc(doc(eve.db, 'users', bob.uid), { name: 'Zed', key: 'zed' }))
await check('Un visiteur ne peut pas réserver de pseudo', false, () => setDoc(doc(guest.db, 'usernames', 'x'), { uid: 'x' }))

console.log('— Lecture')
await check('Alice crée un bloc', true, () => setDoc(doc(alice.db, 'problems', 'p1'), problem('p1', 'Alice', alice.uid)))
await check('Un visiteur lit les blocs', true, () => getDocs(collection(guest.db, 'problems')))
await check('Eve (connectée, sans pseudo) lit les blocs', true, () => getDoc(doc(eve.db, 'problems', 'p1')))

console.log('— Création')
await check('Un visiteur ne peut pas créer de bloc', false, () => setDoc(doc(guest.db, 'problems', 'g1'), problem('g1', 'Alice', 'x')))
await check('Eve (sans pseudo) ne peut pas créer de bloc', false, () => setDoc(doc(eve.db, 'problems', 'e1'), problem('e1', 'Eve', eve.uid)))
await check('Bob ne peut pas créer un bloc signé « Alice »', false, () => setDoc(doc(bob.db, 'problems', 'b1'), problem('b1', 'Alice', bob.uid)))
await check('Bob ne peut pas créer un bloc au nom du compte d\'Alice', false, () => setDoc(doc(bob.db, 'problems', 'b1'), problem('b1', 'Alice', alice.uid)))
await check('Un bloc avec un champ en trop est refusé', false, () => setDoc(doc(bob.db, 'problems', 'b1'), problem('b1', 'Bob', bob.uid, { hack: 1 })))
await check('Un bloc sans cercle est refusé', false, () => setDoc(doc(bob.db, 'problems', 'b1'), problem('b1', 'Bob', bob.uid, { circles: [] })))
await check('Bob crée son bloc', true, () => setDoc(doc(bob.db, 'problems', 'b1'), problem('b1', 'Bob', bob.uid)))

console.log('— Modification / suppression')
await check('Bob ne peut pas modifier le bloc d\'Alice', false, () => setDoc(doc(bob.db, 'problems', 'p1'), problem('p1', 'Bob', bob.uid)))
await check('Bob ne peut pas supprimer le bloc d\'Alice', false, () => deleteDoc(doc(bob.db, 'problems', 'p1')))
await check('Un visiteur ne peut pas supprimer de bloc', false, () => deleteDoc(doc(guest.db, 'problems', 'p1')))
await check('Alice ne peut pas changer la date de création', false, () => setDoc(doc(alice.db, 'problems', 'p1'), problem('p1', 'Alice', alice.uid, { createdAt: 999 })))
await check('Alice ne peut pas donner son bloc à Bob', false, () => setDoc(doc(alice.db, 'problems', 'p1'), problem('p1', 'Bob', bob.uid)))
await check('Alice modifie son bloc', true, () => setDoc(doc(alice.db, 'problems', 'p1'), problem('p1', 'Alice', alice.uid, { name: 'Renommé', updatedAt: 2 })))
await check('Alice supprime son bloc', true, () => deleteDoc(doc(alice.db, 'problems', 'p1')))

console.log('— Ascensions')
await setDoc(doc(alice.db, 'problems', 'p2'), problem('p2', 'Alice', alice.uid))
const asc = (who, name, pid, extra = {}) => ({ id: `${who.uid}_${pid}`, uid: who.uid, user: name, problemId: pid, grade: '6B', date: '2026-11-05', createdAt: 1, ...extra })
await check('Bob valide le bloc d\'Alice', true, () => setDoc(doc(bob.db, 'ascents', `${bob.uid}_p2`), asc(bob, 'Bob', 'p2')))
await check('Alice valide son propre bloc', true, () => setDoc(doc(alice.db, 'ascents', `${alice.uid}_p2`), asc(alice, 'Alice', 'p2', { grade: '6C' })))
await check('Un visiteur lit les ascensions', true, () => getDocs(collection(guest.db, 'ascents')))
await check('Bob modifie sa cotation', true, () => setDoc(doc(bob.db, 'ascents', `${bob.uid}_p2`), asc(bob, 'Bob', 'p2', { grade: '6B+' })))
await check('Un visiteur ne peut pas valider', false, () => setDoc(doc(guest.db, 'ascents', 'x_p2'), { ...asc({ uid: 'x' }, 'X', 'p2') }))
await check('Eve (sans pseudo) ne peut pas valider', false, () => setDoc(doc(eve.db, 'ascents', `${eve.uid}_p2`), asc(eve, 'Eve', 'p2')))
await check('Bob ne peut pas valider au nom d\'Alice (pseudo)', false, () => setDoc(doc(bob.db, 'ascents', `${bob.uid}_p2`), asc(bob, 'Alice', 'p2')))
await check('Bob ne peut pas écrire l\'ascension d\'Alice', false, () => setDoc(doc(bob.db, 'ascents', `${alice.uid}_p2`), asc(alice, 'Alice', 'p2')))
await check('Identifiant d\'ascension incohérent refusé (doublon)', false, () => setDoc(doc(bob.db, 'ascents', 'autre'), { ...asc(bob, 'Bob', 'p2'), id: 'autre' }))
await check('Cotation invalide refusée', false, () => setDoc(doc(bob.db, 'ascents', `${bob.uid}_p2`), asc(bob, 'Bob', 'p2', { grade: '9Z' })))
await check('Date invalide refusée', false, () => setDoc(doc(bob.db, 'ascents', `${bob.uid}_p2`), asc(bob, 'Bob', 'p2', { date: 'hier' })))
await check('Ascension sur un bloc inexistant refusée', false, () => setDoc(doc(bob.db, 'ascents', `${bob.uid}_nope`), asc(bob, 'Bob', 'nope')))
await check('Bob ne peut pas supprimer l\'ascension d\'Alice', false, () => deleteDoc(doc(bob.db, 'ascents', `${alice.uid}_p2`)))

console.log('— Projets')
const proj = (who, pid) => ({ id: `${who.uid}_${pid}`, uid: who.uid, problemId: pid, createdAt: 1 })
await check('Bob met un bloc en projet', true, () => setDoc(doc(bob.db, 'projects', `${bob.uid}_p2`), proj(bob, 'p2')))
await check('Bob lit ses projets', true, () => getDocs(query(collection(bob.db, 'projects'), where('uid', '==', bob.uid))))
await check('Alice ne peut pas lire les projets de Bob', false, () => getDoc(doc(alice.db, 'projects', `${bob.uid}_p2`)))
await check('Alice ne peut pas lister tous les projets', false, () => getDocs(collection(alice.db, 'projects')))
await check('Un visiteur ne peut pas lire les projets', false, () => getDocs(query(collection(guest.db, 'projects'), where('uid', '==', bob.uid))))
await check('Alice ne peut pas créer un projet pour Bob', false, () => setDoc(doc(alice.db, 'projects', `${bob.uid}_p2`), proj(bob, 'p2')))
await check('Alice ne peut pas supprimer le projet de Bob', false, () => deleteDoc(doc(alice.db, 'projects', `${bob.uid}_p2`)))
await check('Projet sur un bloc inexistant refusé', false, () => setDoc(doc(bob.db, 'projects', `${bob.uid}_nope`), proj(bob, 'nope')))
await check('Valider retire du projet (même opération)', true, async () => {
  const b = writeBatch(bob.db); b.set(doc(bob.db, 'ascents', `${bob.uid}_p2`), asc(bob, 'Bob', 'p2')); b.delete(doc(bob.db, 'projects', `${bob.uid}_p2`)); await b.commit()
})
await check('Bob retire sa propre ascension', true, () => deleteDoc(doc(bob.db, 'ascents', `${bob.uid}_p2`)))

console.log('— Suppression d\'un bloc avec ses ascensions')
await setDoc(doc(bob.db, 'ascents', `${bob.uid}_p2`), asc(bob, 'Bob', 'p2'))
await check('Bob ne peut pas supprimer le bloc d\'Alice avec ses ascensions', false, async () => {
  const b = writeBatch(bob.db); b.delete(doc(bob.db, 'ascents', `${alice.uid}_p2`)); b.delete(doc(bob.db, 'problems', 'p2')); await b.commit()
})
await check('Alice supprime son bloc et toutes ses ascensions', true, async () => {
  const b = writeBatch(alice.db)
  b.delete(doc(alice.db, 'ascents', `${alice.uid}_p2`)); b.delete(doc(alice.db, 'ascents', `${bob.uid}_p2`)); b.delete(doc(alice.db, 'problems', 'p2'))
  await b.commit()
})

console.log(`\n${n - failed}/${n} tests OK`)
process.exit(failed ? 1 : 0)
