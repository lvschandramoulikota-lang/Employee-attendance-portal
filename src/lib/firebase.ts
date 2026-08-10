import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

let config: any = {};
try {
  // @ts-ignore
  const firebaseConfig = import.meta.glob('../../firebase-applet-config.json', { eager: true, import: 'default' });
  config = Object.values(firebaseConfig)[0] || {};
} catch {
  // Config file not present
}

const app = !getApps().length ? initializeApp(config) : getApp();

export const db: Firestore = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

export default app;

