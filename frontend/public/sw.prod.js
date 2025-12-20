// Production Service Worker - optimized with minimal logging

// Import Firebase messaging scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
    apiKey: 'AIzaSyCkeRuvNUrDpn_azlDyYVBHQ_-QsLQGje8',
    authDomain: 'zero65.firebaseapp.com',
    projectId: 'zero65',
    storageBucket: 'zero65.firebasestorage.app',
    messagingSenderId: '220251834863',
    appId: '1:220251834863:web:f7205d590d82a067a20e1a',
    measurementId: ''
});

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    // Forward message to open windows in foreground
    clients.matchAll({ includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
            client.postMessage(payload);
        });
    });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Navigate to app or focus existing window
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
