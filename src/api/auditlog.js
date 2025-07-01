// src/api/auditlog.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId, getCurrentUser } from './firebase'; // Import getCurrentUser

/**
 * Logs an audit event to Firestore.
 * @param {string} action - A string identifying the action (e.g., 'CREATE_INVOICE').
 * @param {object} details - An object with relevant details about the event.
 */
export const logAuditEvent = async (action, details = {}) => {
    try {
        const auditLogCollectionPath = `/artifacts/${appId}/audit_logs`;

        // Get current user information
        const user = getCurrentUser();
        const userId = user ? user.uid : 'anonymous';
        const userName = user ? (user.displayName || user.email || 'Anonymous User') : 'Anonymous User';
        const userEmail = user ? user.email : 'N/A';

        const logEntry = {
            action,
            details,
            timestamp: serverTimestamp(),
            userId: userId, // Add user ID
            userName: userName, // Add user name/email
            userEmail: userEmail, // Add user email
            // Ensure these top-level fields are always present for easier querying/display
            invoiceNumber: details.invoiceNumber || 'N/A',
            amount: details.amount || 0,
            customerName: details.customerName || 'N/A',
            entityName: details.entityName || 'N/A', // Assuming entityName might also be relevant
            productName: details.productName || 'N/A', // Assuming productName might also be relevant
            partnerName: details.partnerName || 'N/A', // Assuming partnerName might also be relevant
        };

        await addDoc(collection(db, auditLogCollectionPath), logEntry);

    } catch (error) {
        console.error("Error writing to audit log:", error);
    }
};