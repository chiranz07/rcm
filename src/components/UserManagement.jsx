// src/components/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db, appId, deleteUserAccount, revokeInvitation } from '../api/firebase'; // Import revokeInvitation
import PageLoader from './common/PageLoader';
import FormModal from './common/FormModal';
import { Plus, User, Mail, Trash2, Edit } from 'lucide-react';
import { logAuditEvent } from '../api/auditlog';
import { useAppContext } from '../context/AppContext'; // Import useAppContext to get current user

// Modified ConfirmDeleteUserModal to be more generic for delete/revoke actions
const ConfirmActionModal = ({ isOpen, onClose, onConfirm, item, actionType, errorMessage }) => {
    if (!isOpen) return null;

    const isUser = actionType === 'deleteUser';
    const isInvite = actionType === 'revokeInvite';

    const title = isUser ? "Confirm User Deletion" : "Confirm Invitation Revocation";
    const message = isUser
        ? `Are you sure you want to delete user ${item?.displayName || item?.email}? This will revoke their access.`
        : `Are you sure you want to revoke the invitation for ${item?.email}?`;
    const confirmButtonText = isUser ? "Delete User" : "Revoke Invitation";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm border">
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-600 mt-2 mb-4">{message}</p>
                {errorMessage && (
                    <p className="text-red-600 text-sm mb-4">{errorMessage}</p>
                )}
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-200 transition font-semibold text-xs">Cancel</button>
                    <button type="button" onClick={() => onConfirm(item, actionType)} className="bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 transition font-semibold shadow-sm text-xs">{confirmButtonText}</button>
                </div>
            </div>
        </div>
    );
};


const InviteUserModal = ({ isOpen, onClose, onInvite, error }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('viewer');

    const handleSubmit = (e) => {
        e.preventDefault();
        onInvite(email, role);
    };

    if (!isOpen) return null;

    return (
        <FormModal title="Invite New User" error={error} onClose={onClose} onSubmit={handleSubmit}>
            <div>
                <label className="form-label">Email Address*</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input-modal"
                    placeholder="user@example.com"
                    required
                />
            </div>
            <div>
                <label className="form-label">Assign Role*</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="form-input-modal" required>
                    <option value="viewer">Viewer</option>
                    <option value="accountant">Accountant</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
        </FormModal>
    );
};

const EditUserRoleModal = ({ isOpen, onClose, onSave, user, error }) => {
    const [role, setRole] = useState(user?.role || 'viewer');

    useEffect(() => {
        if (user) setRole(user.role);
    }, [user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(user.id, role);
    };

    if (!isOpen) return null;

    return (
        <FormModal title={`Edit Role for ${user?.displayName || user?.email}`} error={error} onClose={onClose} onSubmit={handleSubmit}>
            <div>
                <label className="form-label">User Email</label>
                <input type="text" value={user?.email} className="form-input-modal bg-gray-100" disabled />
            </div>
            <div>
                <label className="form-label">Assign New Role*</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="form-input-modal" required>
                    <option value="viewer">Viewer</option>
                    <option value="accountant">Accountant</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
        </FormModal>
    );
};


const UserManagement = () => {
    const { user: currentUser } = useAppContext();
    const [users, setUsers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [showEditRoleModal, setShowEditRoleModal] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);
    const [editRoleError, setEditRoleError] = useState('');
    const [itemToDelete, setItemToDelete] = useState(null); // Changed from userToDelete
    const [deleteActionType, setDeleteActionType] = useState(null); // 'deleteUser' or 'revokeInvite'
    const [actionErrorMessage, setActionErrorMessage] = useState(''); // Generic error message for actions

    const usersCollectionPath = `/artifacts/${appId}/users`;
    const invitationsCollectionPath = `/artifacts/${appId}/invitations`;

    useEffect(() => {
        const unsubUsers = onSnapshot(collection(db, usersCollectionPath), (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching users: ", err);
            setIsLoading(false);
        });

        const unsubInvitations = onSnapshot(collection(db, invitationsCollectionPath), (snapshot) => {
            setInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubUsers();
            unsubInvitations();
        };
    }, []);

    const handleInviteUser = async (email, role) => {
        setInviteError('');
        if (!email || !role) {
            setInviteError('Email and role are required.');
            return;
        }

        if (users.some(u => u.email === email) || invitations.some(i => i.id === email && i.status === 'pending')) {
            setInviteError('User with this email already exists or has a pending invitation.');
            return;
        }

        try {
            await setDoc(doc(db, invitationsCollectionPath, email), {
                email: email,
                initialRole: role,
                status: 'pending',
                createdAt: new Date().toISOString(),
                invitedBy: currentUser?.uid || 'anonymous'
            });
            logAuditEvent('INVITE_USER', { invitedEmail: email, assignedRole: role, invitedByUid: currentUser?.uid });
            setShowInviteModal(false);
        } catch (err) {
            console.error("Error inviting user: ", err);
            setInviteError("Failed to send invitation. Please try again.");
        }
    };

    const handleSaveUserRole = async (userId, newRole) => {
        setEditRoleError('');
        try {
            const userBeingEdited = users.find(u => u.id === userId);
            if (userBeingEdited && userBeingEdited.role === 'admin' && newRole !== 'admin') {
                const adminUsers = users.filter(u => u.role === 'admin');
                if (adminUsers.length === 1 && adminUsers[0].id === userId) {
                    setEditRoleError("Cannot change the role of the last administrator. Ensure at least one admin remains.");
                    return;
                }
            }

            const userRef = doc(db, usersCollectionPath, userId);
            const oldRole = users.find(u => u.id === userId)?.role;
            await updateDoc(userRef, { role: newRole });
            logAuditEvent('UPDATE_USER_ROLE', {
                userId,
                newRole,
                oldRole,
                userEmail: users.find(u => u.id === userId)?.email,
                performedByUid: currentUser?.uid
            });
            setShowEditRoleModal(false);
            setUserToEdit(null);
        } catch (err) {
            console.error("Error updating user role: ", err);
            setEditRoleError("Failed to update user role. Please try again.");
        }
    };

    // Consolidated confirmation for both user deletion and invitation revocation
    const handleConfirmAction = async (item, type) => {
        setActionErrorMessage(''); // Clear error on new confirmation attempt

        try {
            if (type === 'deleteUser') {
                // Pre-checks for user deletion
                if (currentUser && item.id === currentUser.uid) {
                    setActionErrorMessage("You cannot delete your own user account.");
                    return;
                }
                if (item.role === 'admin') {
                    const adminUsers = users.filter(u => u.role === 'admin');
                    if (adminUsers.length === 1 && adminUsers[0].id === item.id) {
                        setActionErrorMessage("Cannot delete the last administrator. Ensure at least one admin remains.");
                        return;
                    }
                }
                // ADDED console.log to debug UID
                console.log("Attempting to delete user with UID:", item.id);
                await deleteUserAccount(item.id); // Call deleteUserAccount for actual users
                logAuditEvent('DELETE_USER', {
                    deletedUserId: item.id,
                    deletedUserEmail: item.email,
                    deletedUserRole: item.role,
                    performedByUid: currentUser?.uid
                });
            } else if (type === 'revokeInvite') {
                await revokeInvitation(item.email); // Call new revokeInvitation for invites
                logAuditEvent('REVOKE_INVITATION', {
                    revokedEmail: item.email,
                    performedByUid: currentUser?.uid
                });
            }
            setItemToDelete(null);
            setDeleteActionType(null);
        } catch (err) {
            console.error(`Error during ${type} action:`, err);
            setActionErrorMessage(`Failed to perform action: ${err.message}`);
        }
    };


    if (isLoading) {
        return <PageLoader />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>

            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg transition flex items-center justify-center shadow-sm hover:shadow-lg text-sm font-semibold"
                >
                    <Plus size={18} className="mr-2" /> Invite New User
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <h2 className="text-xl font-bold text-gray-800 p-4 border-b">Active Users</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead className="bg-gray-50 border-b-2 border-gray-200 text-xs uppercase text-gray-500 tracking-wider">
                        <tr>
                            <th className="px-4 py-3 font-semibold">User Name</th>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold">Role</th>
                            <th className="px-4 py-3 font-semibold">Last Login</th>
                            <th className="px-4 py-3 font-semibold text-center">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="text-sm">
                        {users.length === 0 ? (
                            <tr><td colSpan="5" className="text-center p-8 text-gray-500">No active users found.</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="border-b border-gray-100 last:border-b-0">
                                    <td className="px-4 py-3 text-gray-800 font-medium">{user.displayName || 'N/A'}</td>
                                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                    <td className="px-4 py-3 text-gray-600 capitalize">{user.role}</td>
                                    <td className="px-4 py-3 text-gray-600">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => { setUserToEdit(user); setShowEditRoleModal(true); }} className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-md" title="Edit Role">
                                                <Edit size={16}/>
                                            </button>
                                            {/* Use handleConfirmAction for user deletion */}
                                            <button
                                                onClick={() => {
                                                    setItemToDelete(user);
                                                    setDeleteActionType('deleteUser');
                                                    setActionErrorMessage(''); // Clear previous error
                                                }}
                                                className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-md" title="Delete User">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                <h2 className="text-xl font-bold text-gray-800 p-4 border-b">Pending Invitations</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead className="bg-gray-50 border-b-2 border-gray-200 text-xs uppercase text-gray-500 tracking-wider">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold">Initial Role</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Invited At</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="text-sm">
                        {invitations.length === 0 ? (
                            <tr><td colSpan="5" className="text-center p-8 text-gray-500">No pending invitations.</td></tr>
                        ) : (
                            invitations.filter(inv => inv.status === 'pending').map(inv => (
                                <tr key={inv.id} className="border-b border-gray-100 last:border-b-0">
                                    <td className="px-4 py-3 text-gray-600">{inv.email}</td>
                                    <td className="px-4 py-3 text-gray-600 capitalize">{inv.initialRole}</td>
                                    <td className="px-4 py-3"><span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">{inv.status}</span></td>
                                    <td className="px-4 py-3 text-gray-600">{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : 'N/A'}</td>
                                    <td className="px-4 py-3">
                                        {/* Use handleConfirmAction for invitation revocation */}
                                        <button
                                            onClick={() => {
                                                setItemToDelete(inv); // Pass the invitation object
                                                setDeleteActionType('revokeInvite');
                                                setActionErrorMessage(''); // Clear previous error
                                            }}
                                            className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-md" title="Revoke Invitation">
                                            <Trash2 size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <InviteUserModal
                isOpen={showInviteModal}
                onClose={() => { setShowInviteModal(false); setInviteError(''); }}
                onInvite={handleInviteUser}
                error={inviteError}
            />
            <EditUserRoleModal
                isOpen={showEditRoleModal}
                onClose={() => { setShowEditRoleModal(false); setEditRoleError(''); setUserToEdit(null); }}
                onSave={handleSaveUserRole}
                user={userToEdit}
                error={editRoleError}
            />
            <ConfirmActionModal // Renamed modal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleConfirmAction} // Consolidated confirmation handler
                item={itemToDelete}
                actionType={deleteActionType}
                errorMessage={actionErrorMessage}
            />
        </div>
    );
};

export default UserManagement;