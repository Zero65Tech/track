import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebaseClient';

const googleProvider = new GoogleAuthProvider();

export const authService = {
    /**
     * Get Firebase ID token for API requests
     * @returns {Promise<string>} ID token string
     */
    async getIdToken() {
        if (!auth.currentUser) {
            throw new Error('No user logged in');
        }
        return await auth.currentUser.getIdToken();
    },

    /**
     * Get current authenticated user
     * @returns {object|null} User object or null if not authenticated
     */
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

    /**
     * Sign in with Google using popup
     * @returns {Promise<object>} User object with uid, displayName, email, photoURL
     */
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

    /**
     * Sign out current user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            throw new Error(`Sign out failed: ${error.message}`);
        }
    },

    /**
     * Listen to auth state changes
     * @param {Function} callback Function to call with user when auth state changes
     * @returns {Function} Unsubscribe function
     */
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
    }
};
