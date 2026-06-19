// import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const messaging = getMessaging(app);
// const analytics = getAnalytics(app);

const swFile = import.meta.env.MODE === 'prod' || import.meta.env.MODE === 'gamma' ? '/sw.prod.js' : '/sw.test.js';
const swRegistration = await navigator.serviceWorker.register(swFile, {
    scope: '/'
});

const getFcmToken = async () =>
    await getToken(messaging, {
        serviceWorkerRegistration: swRegistration,
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });

export { auth, getFcmToken };
