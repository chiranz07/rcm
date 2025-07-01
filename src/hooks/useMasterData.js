import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../api/firebase';
import { getObjectChanges } from '../utils/diff.js';
import { logAuditEvent } from '../api/auditlog.js';

export const useMasterData = (collectionName, initialItemState, itemNameSingular, itemNamePlural) => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(initialItemState);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const collectionPath = `/artifacts/${appId}/${collectionName}`;

    useEffect(() => {
        const q = query(collection(db, collectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, (err) => {
            console.error(`Error fetching ${itemNamePlural}: `, err);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [collectionPath, itemNamePlural]);

    const handleOpenModalForCreate = () => {
        setIsEditing(false);
        setCurrentItem(initialItemState);
        setShowModal(true);
        setError('');
    };

    const handleOpenModalForEdit = (item) => {
        setIsEditing(true);
        setCurrentItem(item);
        setShowModal(true);
        setError('');
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        setError('');
        if (!currentItem.name) {
            setError(`Please fill all required fields.`);
            return;
        }

        try {
            if (isEditing) {
                const itemRef = doc(db, collectionPath, currentItem.id);
                const originalDoc = await getDoc(itemRef);
                const originalData = originalDoc.data();

                await updateDoc(itemRef, currentItem);

                const changes = getObjectChanges(originalData, currentItem);
                if (Object.keys(changes).length > 0) {
                    logAuditEvent(`UPDATE_${itemNameSingular.toUpperCase()}`, {
                        [`${itemNameSingular}Id`]: currentItem.id,
                        [`${itemNameSingular}Name`]: currentItem.name,
                        changes,
                    });
                }
            } else {
                const docRef = await addDoc(collection(db, collectionPath), currentItem);
                logAuditEvent(`CREATE_${itemNameSingular.toUpperCase()}`, {
                    [`${itemNameSingular}Id`]: docRef.id,
                    [`${itemNameSingular}Name`]: currentItem.name,
                });
            }
            setShowModal(false);
        } catch (err) {
            console.error(`Error saving ${itemNameSingular}: `, err);
            setError(`Failed to save ${itemNameSingular}.`);
        }
    };

    const openDeleteConfirm = (item) => {
        setItemToDelete(item);
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;
        try {
            await deleteDoc(doc(db, collectionPath, itemToDelete.id));
            setItemToDelete(null);
        } catch (err) {
            console.error(`Error deleting ${itemNameSingular}:`, err);
        }
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const closeDeleteModal = () => {
        setItemToDelete(null);
    }

    return {
        items,
        isLoading,
        showModal,
        currentItem,
        setCurrentItem,
        error,
        isEditing,
        itemToDelete,
        handleOpenModalForCreate,
        handleOpenModalForEdit,
        handleSaveItem,
        openDeleteConfirm,
        handleDeleteItem,
        closeModal,
        closeDeleteModal
    };
};