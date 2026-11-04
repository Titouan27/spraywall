// Tests des règles Firestore contre les émulateurs Firebase.
// Lancer : npm run test:rules   (nécessite Java)
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, collection, getFirestore, setDoc, writeBatch } from 'firebase/firestore'

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

console.log(`\n${n - failed}/${n} tests OK`)
process.exit(failed ? 1 : 0)
