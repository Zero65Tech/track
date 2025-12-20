import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/config/firebaseClient';

const swFile = import.meta.env.MODE === 'prod' || import.meta.env.MODE === 'gamma' ? '/sw.prod.js' : '/sw.test.js';
const swRegistration = await navigator.serviceWorker.register(swFile, {
    scope: '/'
});

export const fcmService = {
    onMessage(callback) {
        onMessage(messaging, callback);
        navigator.serviceWorker.onmessage = (event) => {
            callback(event.data);
        };
    },

    async getFcmToken() {
        return await getToken(messaging, {
            serviceWorkerRegistration: swRegistration,
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
    }
};
