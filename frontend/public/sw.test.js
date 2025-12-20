// Development Service Worker with enhanced logging

// Import Firebase messaging scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
    apiKey: 'AIzaSyAbO7K2w-WRd2lM1V7cXEqppo6k6_NzHfU',
    authDomain: 'zero65-test.firebaseapp.com',
    projectId: 'zero65-test',
    storageBucket: 'zero65-test.firebasestorage.app',
    messagingSenderId: '439804487820',
    appId: '1:439804487820:web:ff5b88a7f0f26f5a3033a9',
    measurementId: 'G-NFJH3CX0MC'
});

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages with detailed logging
messaging.onBackgroundMessage((payload) => {
    // Forward message to open windows in foreground
    clients.matchAll({ includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
            client.postMessage(payload);
        });
    });
});

// Handle notification click in background
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Optionally navigate to relevant page
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Handle service worker installation
self.addEventListener('install', () => {
    self.skipWaiting();
});
