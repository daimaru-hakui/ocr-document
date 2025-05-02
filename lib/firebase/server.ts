import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string;
export const firebaseAdmin =
  getApps()[0] ??
  initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
  });

export const auth = getAuth(firebaseAdmin);
export const db = getFirestore(firebaseAdmin);
export const storage = getStorage(firebaseAdmin);
