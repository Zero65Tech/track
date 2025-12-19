// Fallback Service Worker
// This file is kept for backward compatibility and should not be used directly.
// Use sw.dev.js for development and sw.prod.js for production.
// See firebaseClient.js for conditional registration logic.

console.warn('[SW] ⚠️  This is a fallback service worker. Use sw.dev.js or sw.prod.js instead.');

// Import Firebase messaging scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
    apiKey: 'AIzaSyBPqfSFk4m7BXPqHW-S6P_vGI2t3i5K6j7L',
    authDomain: 'track-439804487820.firebaseapp.com',
    projectId: 'track-439804487820',
    storageBucket: 'track-439804487820.appspot.com',
    messagingSenderId: '743046095123',
    appId: '1:743046095123:web:8d1c9f8e7a6b5c4d3e',
    measurementId: 'G-XYZ123ABC456'
});

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[SW Fallback] Received background message:', payload);

    const notificationTitle = payload.data?.message || 'Track Notification';
    const notificationOptions = {
        body: `Trigger completed: ${payload.data?.message || 'No additional details'}`,
        icon: '/favicon.ico',
        data: payload.data,
        tag: 'trigger-notification',
        badge: '/favicon.ico'
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

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
self.addEventListener('install', (event) => {
    self.skipWaiting();
});
