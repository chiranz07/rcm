// src/api/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    deleteUser
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// --- Firebase and App ID Configuration ---
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
export const appId = import.meta.env.VITE_APP_ID;

// --- Firebase Initialization ---
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// --- Cloud Function Callable Reference ---
const adminDeleteUserCallable = httpsCallable(functions, 'adminDeleteUser');

// --- Global state for user and loading status ---
let currentUser = null;
let currentRole = null;
let isAuthLoading = true;
const authStateListeners = [];

// Listen for authentication state changes
onAuthStateChanged(auth, async (user) => {
    isAuthLoading = true; // Set loading to true while we process the user
    if (user) {
        // User is signed in
        currentUser = user;
        const userRef = doc(db, `/artifacts/${appId}/users`, user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            // Existing user
            currentUser = { ...user, ...userSnap.data() };
            currentRole = userSnap.data().role;
            console.log("Existing user logged in:", currentUser.email, "Role:", currentRole);
        } else {
            // New user trying to sign in
            console.log("New user detected. Checking invitations...");
            const invitationsRef = doc(db, `/artifacts/${appId}/invitations`, user.email);
            const invitationSnap = await getDoc(invitationsRef);

            if (invitationSnap.exists() && invitationSnap.data().status === 'pending') {
                const invitationData = invitationSnap.data();
                console.log("Matching pending invitation found. Accepting invitation...");

                // 1. Update invitation status
                await updateDoc(invitationsRef, {
                    status: 'accepted',
                    acceptedAt: new Date().toISOString(),
                    acceptedByUid: user.uid
                });

                // 2. Create user profile
                const newUserProfile = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email,
                    role: invitationData.initialRole || 'viewer', // Default role if not specified in invite
                    createdAt: new Date().toISOString(),
                    lastLoginAt: new Date().toISOString()
                };
                await setDoc(userRef, newUserProfile);
                currentUser = newUserProfile;
                currentRole = newUserProfile.role;
                console.log("New user profile created and invitation accepted.");
            } else {
                // No matching pending invitation or invitation already used/invalid
                console.warn("No valid invitation found for new user or invitation already used. Denying access.");
                alert("You are not invited to this application or your invitation is invalid/used. Your sign-in attempt has been denied.");
                await signOut(auth); // Sign out immediately
                currentUser = null;
                currentRole = null;
            }
        }
    } else {
        // User is signed out
        currentUser = null;
        currentRole = null;
        console.log("User is signed out.");
    }
    isAuthLoading = false;
    authStateListeners.forEach(listener => listener({ user: currentUser, role: currentRole, isLoading: isAuthLoading }));
});

export const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        // onAuthStateChanged listener will handle further logic
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        if (error.code === 'auth/popup-closed-by-user') {
            // User closed the popup, no need to show a general error
            console.log("Google Sign-In popup closed by user.");
        } else if (error.code === 'auth/cancelled-popup-request') {
            console.log("Multiple pop-up requests. Ignoring.");
        } else {
            alert(`Authentication failed: ${error.message}`);
        }
    }
};

export const userSignOut = async () => {
    try {
        await signOut(auth);
        console.log("User signed out successfully.");
    } catch (error) {
        console.error("Sign-out error:", error);
        alert("Failed to sign out. Please try again.");
    }
};

export const getCurrentUser = () => currentUser;
export const getCurrentUserRole = () => currentRole;
export const isAuthenticationLoading = () => isAuthLoading;

export const subscribeToAuthChanges = (callback) => {
    authStateListeners.push(callback);
    // Immediately call with current state
    callback({ user: currentUser, role: currentRole, isLoading: isAuthLoading });
    return () => {
        const index = authStateListeners.indexOf(callback);
        if (index > -1) {
            authStateListeners.splice(index, 1);
        }
    };
};

/**
 * Deletes a Firebase Authentication user account and its Firestore profile.
 * This function uses a Cloud Function for deleting other users.
 * @param {string} uidToDelete - The UID of the user to delete from Firebase Auth and Firestore /users collection.
 * @returns {Promise<Object>} - Success status.
 */
export const deleteUserAccount = async (uidToDelete) => {
    if (!uidToDelete) {
        throw new Error("UID is required to delete a user account.");
    }

    try {
        // Step 1: Delete Firebase Auth user
        if (auth.currentUser && auth.currentUser.uid === uidToDelete) {
            // Allow current user to delete their own account
            await deleteUser(auth.currentUser);
            console.log("Currently logged-in user deleted from Firebase Auth.");
        } else {
            // For admin deleting other users, call the Cloud Function
            console.log(`Calling Cloud Function to delete user: ${uidToDelete}`);
            await adminDeleteUserCallable({ uid: uidToDelete });
            console.log(`User ${uidToDelete} deleted via Cloud Function.`);
        }

        // Step 2: Delete user profile document from Firestore /users collection
        const userDocRef = doc(db, `/artifacts/${appId}/users`, uidToDelete);
        await deleteDoc(userDocRef);
        console.log(`User profile ${uidToDelete} deleted from Firestore.`);

        return { success: true };
    } catch (error) {
        console.error("Error deleting user account:", error);
        throw error;
    }
};

/**
 * Revokes a pending invitation by updating its status in Firestore.
 * @param {string} invitationEmail - The email address of the invitation to revoke.
 * @returns {Promise<Object>} - Success status.
 */
export const revokeInvitation = async (invitationEmail) => {
    if (!invitationEmail) {
        throw new Error("Invitation email is required to revoke an invitation.");
    }

    try {
        const invitationDocRef = doc(db, `/artifacts/${appId}/invitations`, invitationEmail);
        const invitationSnap = await getDoc(invitationDocRef);

        if (invitationSnap.exists()) {
            await updateDoc(invitationDocRef, {
                status: 'revoked',
                revokedAt: new Date().toISOString()
            });
            console.log(`Invitation for ${invitationEmail} marked as revoked.`);
            return { success: true };
        } else {
            console.warn(`Invitation for ${invitationEmail} not found when attempting to revoke.`);
            // Still return success if it doesn't exist, as the desired state (revoked/gone) is achieved
            return { success: true, message: "Invitation not found, but considered revoked." };
        }
    } catch (error) {
        console.error("Error revoking invitation:", error);
        throw error;
    }
};