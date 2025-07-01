import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, doc, deleteDoc, getDoc } from 'firebase/firestore'; // Import getDoc
import { Plus, Trash2, Search, UserCheck, ArrowLeft } from 'lucide-react';
import { db, appId } from '../../api/firebase';
import { useAppContext } from '../../context/AppContext';
import { logAuditEvent } from '../../api/auditlog'; // Import the audit log function

const PartnerSettings = () => {
    const { partners, isLoading } = useAppContext();
    const [newPartnerName, setNewPartnerName] = useState('');
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const addPartnerInputRef = useRef(null);

    const partnersCollectionPath = `/artifacts/${appId}/partners`;

    useEffect(() => {
        addPartnerInputRef.current?.focus();
    }, []);

    const handleAddPartner = async (e) => {
        e.preventDefault();
        setError('');
        if (!newPartnerName.trim()) {
            setError("Partner name cannot be empty.");
            return;
        }
        if (partners.some(p => p.name.toLowerCase() === newPartnerName.trim().toLowerCase())) {
            setError("This partner already exists.");
            return;
        }

        try {
            const docRef = await addDoc(collection(db, partnersCollectionPath), { name: newPartnerName.trim() });
            logAuditEvent('CREATE_PARTNER', {
                partnerId: docRef.id,
                partnerName: newPartnerName.trim()
            });
            setNewPartnerName('');
        } catch (err) {
            console.error("Error adding partner: ", err);
            setError("Failed to add partner.");
        }
    };

    const handleDeletePartner = async (partnerId) => {
        try {
            const partnerRef = doc(db, partnersCollectionPath, partnerId);
            const partnerDoc = await getDoc(partnerRef);
            if (partnerDoc.exists()) {
                const partnerName = partnerDoc.data().name;
                await deleteDoc(partnerRef);
                logAuditEvent('DELETE_PARTNER', {
                    partnerId: partnerId,
                    partnerName: partnerName
                });
            }
        } catch (err) {
            console.error("Error deleting partner: ", err);
        }
    };

    const filteredPartners = partners.filter(partner =>
        partner.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <p>Loading partners...</p>;

    return (
        <div>
            <div className="mb-6">
                <Link to="/settings" className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900">
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Settings
                </Link>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start">
                    <div className="p-2 bg-gray-100 rounded-lg mr-4">
                        <UserCheck size={24} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Partners</h2>
                        <p className="text-gray-500 mt-1 text-sm">Manage your list of partners.</p>
                    </div>
                </div>

                <div className="border-t my-6"></div>

                <form onSubmit={handleAddPartner} className="mb-4 flex items-center gap-2">
                    <input
                        ref={addPartnerInputRef}
                        type="text"
                        value={newPartnerName}
                        onChange={(e) => setNewPartnerName(e.target.value)}
                        placeholder="Enter new partner name"
                        className="form-input-create flex-grow"
                    />
                    <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg transition flex items-center justify-center shadow-sm hover:shadow-lg text-sm font-semibold">
                        <Plus size={18} />
                        <span className="ml-2">Add Partner</span>
                    </button>
                </form>
                {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

                <div className="mt-4 pt-4 border-t">
                     <input
                        type="text"
                        placeholder="Search existing partners..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input-search w-full max-w-sm mb-4"
                    />
                    <div className="space-y-2">
                        {filteredPartners.map(partner => (
                            <div key={partner.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300">
                                <span className="font-medium text-gray-700">{partner.name}</span>
                                <button onClick={() => handleDeletePartner(partner.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-md">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerSettings;