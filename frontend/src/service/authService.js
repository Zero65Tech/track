import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getToken } from 'firebase/messaging';
import { auth, messaging } from '@/config/firebaseClient';

const googleProvider = new GoogleAuthProvider();

export const authService = {
    async getIdToken() {
        if (!auth.currentUser) {
            throw new Error('No user logged in');
        }
        return await auth.currentUser.getIdToken();
    },

    getCurrentUser() {
        return auth.currentUser
            ? {
                  uid: auth.currentUser.uid,
                  displayName: auth.currentUser.displayName,
                  email: auth.currentUser.email,
                  photoURL: auth.currentUser.photoURL
              }
            : null;
    },

    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            return {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL
            };
        } catch (error) {
            throw new Error(`Google sign-in failed: ${error.message}`);
        }
    },

    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            throw new Error(`Sign out failed: ${error.message}`);
        }
    },

    onAuthStateChanged(callback) {
        return onAuthStateChanged(auth, (user) => {
            if (user) {
                callback({
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL
                });
            } else {
                callback(null);
            }
        });
    },

    async getFcmToken() {
        return await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
    }
};
