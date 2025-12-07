import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyAbO7K2w-WRd2lM1V7cXEqppo6k6_NzHfU',
  authDomain: 'zero65-test.firebaseapp.com',
  projectId: 'zero65-test',
  storageBucket: 'zero65-test.firebasestorage.app',
  messagingSenderId: '439804487820',
  appId: '1:439804487820:web:ff5b88a7f0f26f5a3033a9',
  measurementId: 'G-NFJH3CX0MC',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const analytics = getAnalytics(app)

export { app, auth, analytics }
