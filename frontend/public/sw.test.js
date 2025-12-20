// Development Service Worker with enhanced logging

// Import Firebase messaging scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

console.log('[SW-Dev] Development service worker loaded');

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
    console.log('[SW-Dev] ✉️  Background message received');
    console.log('[SW-Dev] Payload:', payload);
    console.log('[SW-Dev] Data:', payload.data);
    console.log('[SW-Dev] Trigger Type:', payload.data?.triggerType);
    console.log('[SW-Dev] Trigger State:', payload.data?.triggerState);
    console.log('[SW-Dev] Message:', payload.data?.message);
    console.log('[SW-Dev] Profile ID:', payload.data?.profileId);
    console.log('[SW-Dev] Trigger ID:', payload.data?.triggerId);

    const notificationTitle = payload.data?.message || 'Track Dev Notification';
    const notificationOptions = {
        body: `[DEV] Trigger completed: ${payload.data?.message || 'No additional details'}`,
        icon: '/favicon.ico',
        data: payload.data,
        tag: 'trigger-notification-dev',
        badge: '/favicon.ico'
    };

    console.log('[SW-Dev] Showing notification:', notificationTitle, notificationOptions);
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click in background
self.addEventListener('notificationclick', (event) => {
    console.log('[SW-Dev] Notification clicked:', event.notification);
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
    console.log('[SW-Dev] Service worker activated');
    event.waitUntil(clients.claim());
});

// Handle service worker installation
self.addEventListener('install', (event) => {
    console.log('[SW-Dev] Service worker installed');
    self.skipWaiting();
});
