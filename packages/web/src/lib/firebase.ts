/**
 * Firebase Configuration
 * Initializes Firebase app for storage operations
 *
 * @module lib/firebase
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// Firebase configuration from environment variables
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'taxasge-dev',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'taxasge-dev.firebasestorage.app',
}

// Initialize Firebase only once (client-side only)
let app: FirebaseApp | undefined
let storage: FirebaseStorage | undefined

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  storage = getStorage(app)
}

export { app, storage }
