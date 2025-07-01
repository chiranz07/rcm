import React, { useState } from 'react';
import { writeBatch, collection, doc } from 'firebase/firestore';
import { Plus, Search, Pencil, Trash2, Upload } from 'lucide-react';
import { db, appId } from '../api/firebase';
import { initialEntityState, placeOfSupplyOptions } from '../constants';
import FormModal from './common/FormModal';
import ImportModal from './common/ImportModal';
import SearchableDropdown from './common/SearchableDropdown';
import { useMasterData } from '../hooks/useMasterData';

const EntityFormModal = ({ entity, setEntity, onClose, onSubmit, error, isEditing }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'nextInvoiceNumber') {
            setEntity(prev => ({ ...prev, [name]: parseInt(value, 10) || 1 }));
        } else {
            setEntity(prev => ({ ...prev, [name]: value }));
        }
    };
    const handleAddressChange = (e) => setEntity(prev => ({...prev, address: {...prev.address, [e.target.name]: e.target.value}}));
    const handleBankDetailsChange = (e) => setEntity(prev => ({...prev, bankDetails: {...(prev.bankDetails || {}), [e.target.name]: e.target.value}}));


    const handleGstinChange = (e) => {
        const gstin = e.target.value.toUpperCase();
        let newState = { ...entity, gstin };
        if (gstin.length >= 12) { newState.pan = gstin.substring(2, 12); }
        if (gstin.length >= 2) {
            const stateCode = gstin.substring(0, 2);
            const placeOfSupply = placeOfSupplyOptions.find(opt => opt.code === stateCode);
            if (placeOfSupply) { newState.placeOfSupply = placeOfSupply.name; }
        }
        setEntity(newState);
    };

    return (
        <FormModal title={isEditing ? "Edit Entity" : "New Entity"} error={error} onClose={onClose} onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="form-label">Entity Name*</label><input type="text" name="name" value={entity.name} onChange={handleChange} className="form-input-modal" required /></div>
                <div><label className="form-label">GST Registered?*</label><select name="isGstRegistered" value={entity.isGstRegistered} onChange={handleChange} className="form-input-modal"><option value="Yes">Yes</option><option value="No">No</option></select></div>
                {entity.isGstRegistered === 'Yes' ? (
                    <>
                        <div><label className="form-label">GSTIN*</label><input type="text" name="gstin" value={entity.gstin} onChange={handleGstinChange} className="form-input-modal" maxLength="15" required /></div>
                        <div><label className="form-label">PAN*</label><input type="text" name="pan" value={entity.pan} onChange={handleChange} className="form-input-modal" required /></div>
                    </>
                ) : (
                    <div><label className="form-label">PAN*</label><input type="text" name="pan" value={entity.pan} onChange={handleChange} className="form-input-modal" required /></div>
                )}
                <div><label className="form-label">Place of Supply*</label><SearchableDropdown options={placeOfSupplyOptions} value={entity.placeOfSupply} onChange={(value) => setEntity({...entity, placeOfSupply: value})} /></div>
                <div><label className="form-label">Email*</label><input type="email" name="email" value={entity.email} onChange={handleChange} className="form-input-modal" required /></div>
                <div><label className="form-label">Phone*</label><input type="tel" name="phone" value={entity.phone} onChange={handleChange} className="form-input-modal" required /></div>
            </div>
            <div className="border-t pt-4 mt-4"><h4 className="text-md font-semibold text-gray-700 mb-3">Invoice Settings</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="form-label">Invoice Prefix</label><input type="text" name="invoicePrefix" value={entity.invoicePrefix || 'INV-'} onChange={handleChange} className="form-input-modal" /></div><div><label className="form-label">Next Invoice Number</label><input type="number" name="nextInvoiceNumber" value={entity.nextInvoiceNumber || 1} onChange={handleChange} className="form-input-modal" min="1"/></div></div></div>
            <div className="border-t pt-4 mt-4"><h4 className="text-md font-semibold text-gray-700 mb-3">Address</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="form-label">Address Line 1</label><input type="text" name="line1" value={entity.address.line1} onChange={handleAddressChange} className="form-input-modal" /></div><div className="md:col-span-2"><label className="form-label">Address Line 2</label><input type="text" name="line2" value={entity.address.line2} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">City</label><input type="text" name="city" value={entity.address.city} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">State</label><input type="text" name="state" value={entity.address.state} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">Pincode</label><input type="text" name="pincode" value={entity.address.pincode} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">Country</label><input type="text" name="country" value={entity.address.country} onChange={handleAddressChange} className="form-input-modal" /></div></div></div>

            <div className="border-t pt-4 mt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="form-label">A/c Holder's Name</label><input type="text" name="accountHolderName" value={entity.bankDetails?.accountHolderName || ''} onChange={handleBankDetailsChange} className="form-input-modal" /></div>
                    <div><label className="form-label">Bank Name</label><input type="text" name="bankName" value={entity.bankDetails?.bankName || ''} onChange={handleBankDetailsChange} className="form-input-modal" /></div>
                    <div><label className="form-label">A/c No.</label><input type="text" name="accountNumber" value={entity.bankDetails?.accountNumber || ''} onChange={handleBankDetailsChange} className="form-input-modal" /></div>
                    <div><label className="form-label">IFSC Code</label><input type="text" name="ifscCode" value={entity.bankDetails?.ifscCode || ''} onChange={handleBankDetailsChange} className="form-input-modal" /></div>
                </div>
            </div>
        </FormModal>
    );
};

const ConfirmDeleteModal = ({ item, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm border">
            <h3 className="text-lg font-bold text-gray-800">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">Are you sure you want to delete <span className="font-bold">{item?.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-200 transition font-semibold text-xs">Cancel</button>
                <button type="button" onClick={onConfirm} className="bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 transition font-semibold shadow-sm text-xs">Delete</button>
            </div>
        </div>
    </div>
);


function EntityManagement() {
    const {
        items: entities,
        isLoading,
        showModal,
        currentItem: currentEntity,
        setCurrentItem: setCurrentEntity,
        error,
        isEditing,
        itemToDelete: entityToDelete,
        handleOpenModalForCreate,
        handleOpenModalForEdit,
        handleSaveItem: handleSaveEntity,
        openDeleteConfirm,
        handleDeleteItem: handleDeleteEntity,
        closeModal,
        closeDeleteModal,
    } = useMasterData('entities', initialEntityState, 'entity', 'entities');

    const [showImportModal, setShowImportModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleImportEntities = async (dataToImport) => {
        const batch = writeBatch(db);
        const collectionPath = `/artifacts/${appId}/entities`;
        dataToImport.forEach(item => {
            const docRef = doc(collection(db, collectionPath));
            const newEntity = {
                ...initialEntityState,
                name: item.name || '',
                gstin: item.gstin || '',
                pan: item.pan || '',
                email: item.email || '',
                phone: item.phone || '',
                placeOfSupply: item.placeOfSupply || '',
                isGstRegistered: item.isGstRegistered || 'No',
                address: {
                    line1: item.address_line1 || '',
                    line2: item.address_line2 || '',
                    city: item.address_city || '',
                    state: item.address_state || '',
                    pincode: item.address_pincode || '',
                    country: item.address_country || '',
                },
                // Add bank details here
                bankDetails: {
                    accountHolderName: item.bank_accountHolderName || '',
                    bankName: item.bank_bankName || '',
                    accountNumber: item.bank_accountNumber || '',
                    ifscCode: item.bank_ifscCode || ''
                }
            };
            batch.set(docRef, newEntity);
        });

        try {
            await batch.commit();
            alert('Entities imported successfully!');
        } catch (err) {
            console.error("Error importing entities: ", err);
            alert('An error occurred while importing entities.');
        }
    };

    const filteredEntities = entities.filter(entity => entity.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (isLoading) {
        return <p>Loading entities...</p>;
    }

    return (
        <div className="bg-card p-8 rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
                <h2 className="text-2xl font-bold text-text-primary">Entities</h2>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-grow"><input type="text" placeholder="Search entities..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input-search w-full" /><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /></div>
                    <button onClick={() => setShowImportModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center shadow-sm hover:shadow-lg text-sm font-semibold"><Upload size={18} className="mr-2" /> Import</button>
                    <button onClick={handleOpenModalForCreate} className="bg-primary text-white px-4 py-2 rounded-lg transition flex items-center justify-center shadow-sm hover:shadow-lg text-sm font-semibold"><Plus size={18} className="mr-2" /> New Entity</button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-bold text-text-secondary uppercase">
                    <div>Name</div>
                    <div>GST Registered</div>
                    <div>GSTIN</div>
                    <div>PAN</div>
                    <div className="text-right">Actions</div>
                </div>

                {filteredEntities.map(entity => (
                    <div key={entity.id} className="grid md:grid-cols-5 gap-4 items-center bg-white p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="font-semibold text-text-primary">{entity.name}</div>
                        <div><span className={`px-2 py-1 text-xs rounded-full ${entity.isGstRegistered === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{entity.isGstRegistered}</span></div>
                        <div className="font-mono text-xs text-text-secondary">{entity.gstin || 'N/A'}</div>
                        <div className="font-mono text-xs text-text-secondary">{entity.pan || 'N/A'}</div>
                        <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => handleOpenModalForEdit(entity)} className="text-gray-400 hover:text-primary p-2 rounded-md hover:bg-gray-100"><Pencil size={16}/></button>
                            <button onClick={() => openDeleteConfirm(entity)} className="text-gray-400 hover:text-red-600 p-2 rounded-md hover:bg-gray-100"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && <EntityFormModal entity={currentEntity} setEntity={setCurrentEntity} onClose={closeModal} onSubmit={handleSaveEntity} error={error} isEditing={isEditing} />}
            {entityToDelete && <ConfirmDeleteModal item={entityToDelete} onConfirm={handleDeleteEntity} onCancel={closeDeleteModal} />}
            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImportEntities}
                requiredFields={['name', 'pan', 'email', 'phone']}
            />
        </div>
    );
}

export default EntityManagement;