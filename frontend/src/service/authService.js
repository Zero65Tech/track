import { auth } from '@/config/firebaseClient';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

export const authService = {
    onAuthStateChanged(callback) {
        onAuthStateChanged(auth, (user) => {
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

    async getIdToken() {
        return auth.currentUser ? await auth.currentUser.getIdToken() : null;
    },

    async loginWithGoogle() {
        await signInWithPopup(auth, googleProvider);
    },

    async logout() {
        await signOut(auth);
    }
};
