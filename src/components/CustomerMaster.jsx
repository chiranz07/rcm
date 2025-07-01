import React, { useState, useEffect } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { Plus, Search, Pencil, Trash2, Upload } from 'lucide-react';
import { db, appId } from '../api/firebase';
import { initialCustomerState, placeOfSupplyOptions } from '../constants';
import FormModal from './common/FormModal';
import ImportModal from './common/ImportModal';
import SearchableDropdown from './common/SearchableDropdown';
import { useMasterData } from '../hooks/useMasterData';

const CustomerFormModal = ({ customer, setCustomer, onClose, onSubmit, error, isEditing }) => {
    const handleChange = (e) => setCustomer(prev => ({...prev, [e.target.name]: e.target.value}));
    const handleAddressChange = (e) => setCustomer(prev => ({...prev, address: {...prev.address, [e.target.name]: e.target.value}}));

    const handleGstinChange = (e) => {
        const gstin = e.target.value.toUpperCase();
        let newState = { ...customer, gstin };
        if (gstin.length >= 12) { newState.pan = gstin.substring(2, 12); }
        if (gstin.length >= 2) {
            const stateCode = gstin.substring(0, 2);
            const placeOfSupply = placeOfSupplyOptions.find(opt => opt.code === stateCode);
            if (placeOfSupply) { newState.placeOfSupply = placeOfSupply.name; }
        }
        setCustomer(newState);
    };

    return (
        <FormModal title={isEditing ? "Edit Customer" : "New Customer"} error={error} onClose={onClose} onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="form-label">Customer Name*</label><input type="text" name="name" value={customer.name} onChange={handleChange} className="form-input-modal" required /></div>
                <div><label className="form-label">GST Registered?*</label><select name="isGstRegistered" value={customer.isGstRegistered} onChange={handleChange} className="form-input-modal"><option value="Yes">Yes</option><option value="No">No</option></select></div>
                {customer.isGstRegistered === 'Yes' ? (
                    <>
                        <div><label className="form-label">GSTIN*</label><input type="text" name="gstin" value={customer.gstin} onChange={handleGstinChange} className="form-input-modal" maxLength="15" required /></div>
                        <div><label className="form-label">PAN*</label><input type="text" name="pan" value={customer.pan} onChange={handleChange} className="form-input-modal" required /></div>
                    </>
                ) : (
                     <div><label className="form-label">PAN (Optional)</label><input type="text" name="pan" value={customer.pan} onChange={handleChange} className="form-input-modal" /></div>
                )}
                <div><label className="form-label">Place of Supply*</label><SearchableDropdown options={placeOfSupplyOptions} value={customer.placeOfSupply} onChange={(value) => setCustomer({...customer, placeOfSupply: value })} /></div>
                <div><label className="form-label">Email*</label><input type="email" name="email" value={customer.email} onChange={handleChange} className="form-input-modal" required /></div>
                <div><label className="form-label">Phone*</label><input type="tel" name="phone" value={customer.phone} onChange={handleChange} className="form-input-modal" required /></div>
            </div>
            <div className="border-t pt-4 mt-4"><h4 className="text-md font-semibold text-gray-700 mb-3">Address</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="form-label">Address Line 1</label><input type="text" name="line1" value={customer.address.line1} onChange={handleAddressChange} className="form-input-modal" /></div><div className="md:col-span-2"><label className="form-label">Address Line 2</label><input type="text" name="line2" value={customer.address.line2} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">City</label><input type="text" name="city" value={customer.address.city} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">State</label><input type="text" name="state" value={customer.address.state} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">Pincode</label><input type="text" name="pincode" value={customer.address.pincode} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">Country</label><input type="text" name="country" value={customer.address.country} onChange={handleAddressChange} className="form-input-modal" /></div></div></div>
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

function CustomerMaster() {
    const {
        items: customers,
        isLoading,
        showModal,
        currentItem: currentCustomer,
        setCurrentItem: setCurrentCustomer,
        error,
        isEditing,
        itemToDelete: customerToDelete,
        handleOpenModalForCreate,
        handleOpenModalForEdit,
        handleSaveItem: handleSaveCustomer,
        openDeleteConfirm,
        handleDeleteItem: handleDeleteCustomer,
        closeModal,
        closeDeleteModal,
    } = useMasterData('customers', initialCustomerState, 'customer', 'customers');

    const [showImportModal, setShowImportModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const handleImportCustomers = async (dataToImport) => {
        const batch = writeBatch(db);
        const collectionPath = `/artifacts/${appId}/customers`;
        dataToImport.forEach(item => {
            const docRef = doc(collection(db, collectionPath));
            const newCustomer = {
                ...initialCustomerState,
                name: item.name || '',
                email: item.email || '',
                phone: item.phone || '',
                gstin: item.gstin || '',
                pan: item.pan || '',
                isGstRegistered: item.isGstRegistered || 'No',
                placeOfSupply: item.placeOfSupply || '',
                address: {
                    line1: item.address_line1 || '',
                    line2: item.address_line2 || '',
                    city: item.address_city || '',
                    state: item.address_state || '',
                    pincode: item.address_pincode || '',
                    country: item.address_country || '',
                }
            };
            batch.set(docRef, newCustomer);
        });

        try {
            await batch.commit();
            alert('Customers imported successfully!');
        } catch (err) {
            console.error("Error importing customers: ", err);
            alert('An error occurred while importing customers.');
        }
    };

    const filteredCustomers = customers.filter(customer => customer.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

    if (isLoading) return <p>Loading customers...</p>

    return (
        <div className="bg-card p-8 rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
                <h2 className="text-2xl font-bold text-text-primary">Customers</h2>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-grow"><input type="text" placeholder="Search customers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input-search w-full"/><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /></div>
                    <button onClick={() => setShowImportModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center shadow-sm hover:shadow-lg text-sm font-semibold"><Upload size={18} className="mr-2" /> Import</button>
                    <button onClick={handleOpenModalForCreate} className="bg-primary text-white px-4 py-2 rounded-lg transition flex items-center justify-center shadow-sm hover:shadow-lg text-sm font-semibold"><Plus size={18} className="mr-2" /> New Customer</button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-bold text-text-secondary uppercase">
                    <div>Name</div>
                    <div>Contact</div>
                    <div>Place of Supply</div>
                    <div>GSTIN</div>
                    <div className="text-right">Actions</div>
                </div>

                {currentItems.map(customer => (
                    <div key={customer.id} className="grid md:grid-cols-5 gap-4 items-center bg-white p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="font-semibold text-text-primary">{customer.name}</div>
                        <div className="text-sm text-text-secondary">{customer.email}<br/>{customer.phone}</div>
                        <div className="text-sm text-text-secondary">{customer.placeOfSupply}</div>
                        <div className="font-mono text-xs text-text-secondary">{customer.gstin || 'N/A'}</div>
                        <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => handleOpenModalForEdit(customer)} className="text-gray-400 hover:text-primary p-2 rounded-md hover:bg-gray-100"><Pencil size={16}/></button>
                            <button onClick={() => openDeleteConfirm(customer)} className="text-gray-400 hover:text-red-600 p-2 rounded-md hover:bg-gray-100"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex justify-between items-center">
                <div>
                    <label htmlFor="itemsPerPage" className="text-sm text-gray-600 mr-2">Items per page:</label>
                    <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="form-input-compact"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={75}>75</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50">
                        Previous
                    </button>
                    <span className="px-4">Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50">
                        Next
                    </button>
                </div>
            </div>

            {showModal && <CustomerFormModal customer={currentCustomer} setCustomer={setCurrentCustomer} onClose={closeModal} onSubmit={handleSaveCustomer} error={error} isEditing={isEditing} />}
            {customerToDelete && <ConfirmDeleteModal item={customerToDelete} onConfirm={handleDeleteCustomer} onCancel={closeDeleteModal} />}
            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImportCustomers}
                requiredFields={['name', 'email', 'phone']}
            />
        </div>
    );
}

export default CustomerMaster;