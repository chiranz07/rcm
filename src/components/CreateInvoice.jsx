// src/components/CreateInvoice.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../api/firebase';
import { useAppContext } from '../context/AppContext';
import { useInvoiceForm } from '../hooks/useInvoiceForm';
import { Save } from 'lucide-react';
import { getObjectChanges } from '../utils/diff.js';
import { logAuditEvent } from '../api/auditlog.js';

import InvoiceFormHeader from './invoice/InvoiceFormHeader';
import InvoiceItemsTable from './invoice/InvoiceItemsTable';
import InvoiceTotals from './invoice/InvoiceTotals';
import SaveFeedbackModal from './common/SaveFeedbackModal';

const CreateInvoice = () => {
    const { entities, products } = useAppContext();
    const [customers, setCustomers] = useState([]);
    const [existingInvoice, setExistingInvoice] = useState(null);
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const isConverting = queryParams.get('mode') === 'convert';

    const {
        invoice, setInvoice, isEditing, errors, validate,
        handleInvoiceDataChange, handleItemChange, handleProductSelection,
        addItem, removeItem, isGstApplicable
    } = useInvoiceForm(existingInvoice, entities, customers);

    const [notification, setNotification] = useState(null);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [saveMessage, setSaveMessage] = useState('');

    const invoicesCollectionPath = `/artifacts/${appId}/invoices`;
    const customersCollectionPath = `/artifacts/${appId}/customers`;

    useEffect(() => {
        const qCustomers = query(collection(db, customersCollectionPath));
        const unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        if (invoiceId) {
            const fetchInvoice = async () => {
                const docRef = doc(db, invoicesCollectionPath, invoiceId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setExistingInvoice({ id: docSnap.id, ...docSnap.data() });
                }
            };
            fetchInvoice();
        }

        return () => {
            unsubscribeCustomers();
        };
    }, [invoiceId]);

    const formatIndianCurrency = (num) => Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const { totals, shouldApplyGst } = useMemo(() => {
        const grossTotal = invoice.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.rate)), 0);
        const totalDiscount = invoice.items.reduce((acc, item) => {
            const rate = Number(item.rate) || 0;
            const discount = Number(item.discount) || 0;
            return discount < rate ? acc + discount : acc;
        }, 0);
        const taxableTotal = grossTotal - totalDiscount;

        let applyGst = isGstApplicable || isConverting;

        const selectedCustomer = customers.find(c => c.id === invoice.customerId);
        if (selectedCustomer) {
            const placeOfSupply = selectedCustomer.placeOfSupply;
            if (placeOfSupply === 'Export' || placeOfSupply === 'SEZ') {
                applyGst = false;
            }
        }

        const totalGst = applyGst
            ? invoice.items.reduce((acc, item) => {
                const rate = Number(item.rate) || 0;
                const discount = Number(item.discount) || 0;
                const itemTotal = (Number(item.quantity) * rate);
                const itemTaxable = itemTotal - (discount < rate ? discount : 0);
                return acc + (itemTaxable * (Number(item.gstRate) / 100));
            }, 0)
            : 0;

        const total = taxableTotal + totalGst;
        const igst = applyGst && invoice.gstType === 'IGST' ? totalGst : 0;
        const cgst = applyGst && invoice.gstType === 'CGST/SGST' ? totalGst / 2 : 0;
        const sgst = applyGst && invoice.gstType === 'CGST/SGST' ? totalGst / 2 : 0;

        return {
            totals: { grossTotal, totalDiscount, taxableTotal, totalGst, total, igst, cgst, sgst },
            shouldApplyGst: applyGst
        };
    }, [invoice.items, invoice.gstType, invoice.type, isGstApplicable, isConverting, invoice.customerId, customers]);


    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSaveInvoice = async () => {
        if (!validate()) {
            showNotification("Please fix the errors before saving.", "error");
            return;
        }

        setSaveStatus('loading');
        const collectionPath = `/artifacts/${appId}/invoices`;
        const customerName = customers.find(c => c.id === invoice.customerId)?.name || 'N/A';

        try {
            if (isEditing) {
                const invoiceRef = doc(db, collectionPath, invoice.id);
                const originalDoc = await getDoc(invoiceRef);
                const originalData = originalDoc.data();

                const finalStatus = isConverting ? 'Invoiced' : invoice.status;
                const finalType = isConverting ? 'Invoice' : invoice.type;
                const finalInvoiceData = { ...invoice, ...totals, isGstApplicable: shouldApplyGst, status: finalStatus, type: finalType };

                await updateDoc(invoiceRef, finalInvoiceData);

                const changes = getObjectChanges(originalData, finalInvoiceData);
                const action = isConverting ? 'CONVERT_TO_INVOICE' : 'UPDATE_INVOICE';

                // Prepare additional details for audit log, especially for status changes
                const auditDetails = {
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    amount: totals.total,
                    customerName: customerName,
                    changes, // Keep the detailed changes object
                };

                // Explicitly add old and new status if status changed
                if (changes.status) {
                    auditDetails.oldStatus = changes.status.old;
                    auditDetails.newStatus = changes.status.new;
                } else {
                    // If status didn't change but it's an update, log current status
                    auditDetails.status = finalInvoiceData.status;
                }


                if (Object.keys(changes).length > 0) {
                    logAuditEvent(action, auditDetails);
                }
                setSaveMessage(isConverting ? "Successfully converted to Invoice!" : "Invoice updated successfully!");
            } else {
                let status = (invoice.type === 'Proforma') ? 'Proforma' : 'Invoiced';
                const finalInvoiceData = { ...invoice, ...totals, isGstApplicable: shouldApplyGst, status, createdAt: new Date() };
                const docRef = await addDoc(collection(db, collectionPath), finalInvoiceData);

                // For CREATE_INVOICE, explicitly pass the status
                logAuditEvent('CREATE_INVOICE', {
                    invoiceId: docRef.id,
                    invoiceNumber: finalInvoiceData.invoiceNumber,
                    amount: totals.total,
                    customerName: customerName,
                    status: finalInvoiceData.status, // ADDED: Initial status
                });

                const entityRef = doc(db, `/artifacts/${appId}/entities`, invoice.entityId);
                const entityToUpdate = entities.find(e => e.id === invoice.entityId);
                if (entityToUpdate) {
                    await updateDoc(entityRef, { nextInvoiceNumber: (entityToUpdate.nextInvoiceNumber || 1) + 1 });
                }
                // Updated save message for new invoices
                setSaveMessage(`${finalInvoiceData.type} ${finalInvoiceData.invoiceNumber} Created!`);
            }
            setSaveStatus('success');
            setTimeout(() => navigate('/invoices'), 1500);
        } catch (err) {
            console.error("Error saving invoice: ", err);
            setSaveMessage("Failed to save invoice. Please try again.");
            setSaveStatus('error');
        }
    };

    const selectedEntity = entities.find(e => e.id === invoice.entityId);

    const pageTitle = isConverting
        ? 'Convert to Invoice'
        : isEditing
            ? `Edit ${invoice.type}`
            : 'Create Invoice';

    return (
        <div className="max-w-7xl mx-auto">
            {saveStatus !== 'idle' && <SaveFeedbackModal status={saveStatus} message={saveMessage} onClose={() => setSaveStatus('idle')} />}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{pageTitle}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/invoices')} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-semibold text-sm">
                        Cancel
                    </button>
                    <button onClick={handleSaveInvoice} className="text-white px-4 py-2 rounded-lg transition font-semibold shadow-sm text-sm flex items-center gap-2" style={{backgroundColor: '#2a3f50'}}>
                        <Save size={16} />
                        {/* Updated button text logic */}
                        {isConverting ? 'Save as Invoice' : (isEditing ? 'Save Changes' : (invoice.type === 'Proforma' ? 'Save as Proforma' : 'Save as Invoice'))}
                    </button>
                </div>
            </div>

            {notification && <div className={`p-3 mb-4 text-sm rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{notification.message}</div>}

            <div className="space-y-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <div className="w-full lg:w-2/3 bg-white p-6 rounded-xl shadow-sm border">
                        <InvoiceFormHeader
                            invoice={invoice}
                            handleInvoiceDataChange={handleInvoiceDataChange}
                            entities={entities}
                            customers={customers}
                            errors={errors}
                            isProformaDisabled={selectedEntity && selectedEntity.isGstRegistered === 'No'}
                            isConverting={isConverting}
                        />
                    </div>
                    <div className="w-full lg:w-1/3 bg-white p-6 rounded-xl shadow-sm border">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Summary</h3>
                        <InvoiceTotals
                            totals={totals}
                            isGstApplicable={shouldApplyGst}
                            gstType={invoice.gstType}
                            formatIndianCurrency={formatIndianCurrency}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <InvoiceItemsTable
                        items={invoice.items}
                        handleItemChange={handleItemChange}
                        handleProductSelection={handleProductSelection}
                        addItem={addItem}
                        removeItem={removeItem}
                        isGstApplicable={shouldApplyGst}
                        formatIndianCurrency={formatIndianCurrency}
                        products={products}
                        errors={errors.items || {}}
                    />
                </div>
            </div>
        </div>
    );
};

export default CreateInvoice;