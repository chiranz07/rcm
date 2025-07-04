// src/components/ViewInvoices.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { X, FileDown, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db, appId } from '../api/firebase';
import { PDFViewer, pdf } from '@react-pdf/renderer'; // Make sure 'pdf' is imported
import InvoicePDF from './InvoicePDF';
import { useAppContext } from '../context/AppContext';
import InvoiceFilters from './invoice/InvoiceFilters';
import InvoiceTable from './invoice/InvoiceTable';
import ImportModal from './common/ImportModal';
import MarkAsPaidModal from './common/MarkAsPaidModal';
import InvoiceHistoryModal from './common/InvoiceHistoryModal';
import { logAuditEvent } from '../api/auditlog.js';

function InvoicePreviewModal({ invoice, customer, entity, onClose }) {
    if (!invoice) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] border flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-800">
                        Invoice Preview: {invoice.invoiceNumber}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-grow">
                    <PDFViewer width="100%" height="100%">
                        <InvoicePDF invoice={invoice} customer={customer} entity={entity} />
                    </PDFViewer>
                </div>
            </div>
        </div>,
        document.getElementById('portal-root')
    );
}

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


function ViewInvoices({ initialFilters }) {
    const { entities, partners } = useAppContext();
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [invoiceToMarkAsPaid, setInvoiceToMarkAsPaid] = useState(null);
    const [historyInvoice, setHistoryInvoice] = useState(null);
    const defaultFilters = { status: [], customerId: [], entityId: [], partner: [], dueStatus: [], startDate: null, endDate: null, dueDateBefore: null, dueDateAfter: null };
    const [filters, setFilters] = useState({ ...defaultFilters, ...(initialFilters || {}) });
    const [sortConfig, setSortConfig] = useState({ key: 'invoiceDate', direction: 'descending' });
    const [searchTerm, setSearchTerm] = useState('');
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [previewInvoice, setPreviewInvoice] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [groupBy, setGroupBy] = useState('none');

    const invoicesCollectionPath = `/artifacts/${appId}/invoices`;
    const customersCollectionPath = `/artifacts/${appId}/customers`;

    useEffect(() => {
        const q = query(collection(db, invoicesCollectionPath));
        const unsubscribeInvoices = onSnapshot(q, (snapshot) => {
            setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching invoices: ", err);
            setIsLoading(false);
        });

        const qCustomers = query(collection(db, customersCollectionPath));
        const unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeInvoices();
            unsubscribeCustomers();
        };
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage, groupBy]);

    const processedInvoices = useMemo(() => {
        const customerMap = new Map(customers.map(c => [c.id, c.name]));
        const entityMap = new Map(entities.map(e => [e.id, e.name]));
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return invoices.map(inv => {
            let dueStatus = '';
            if (['Invoiced', 'Sent'].includes(inv.status)) {
                const dueDate = new Date(inv.dueDate);
                if (!isNaN(dueDate.getTime())) {
                    if (dueDate < today) dueStatus = 'Overdue';
                    else dueStatus = 'Due';
                }
            }
            return { ...inv, customerName: customerMap.get(inv.customerId) || 'N/A', entityName: entityMap.get(inv.entityId) || 'N/A', dueStatus };
        });
    }, [invoices, customers, entities]);

    const sortedAndFilteredInvoices = useMemo(() => {
        let filtered = processedInvoices.filter(inv => {
            const searchMatch = searchTerm === '' || inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = filters.status.length === 0 || filters.status.includes(inv.status);
            const customerMatch = filters.customerId.length === 0 || filters.customerId.includes(inv.customerId);
            const entityMatch = filters.entityId.length === 0 || filters.entityId.includes(inv.entityId);
            const partnerMatch = filters.partner.length === 0 || filters.partner.includes(inv.partner);
            const dueStatusMatch = filters.dueStatus.length === 0 || filters.dueStatus.includes(inv.dueStatus);
            const invoiceDate = new Date(inv.invoiceDate);
            const dateMatch = (!filters.startDate || invoiceDate >= filters.startDate) && (!filters.endDate || invoiceDate <= filters.endDate);
            const dueDateForFilter = new Date(inv.dueDate);
            const afterDate = filters.dueDateAfter ? new Date(filters.dueDateAfter) : null;
            const beforeDate = filters.dueDateBefore ? new Date(filters.dueDateBefore) : null;
            const dueDateMatch = (!afterDate || dueDateForFilter >= afterDate) && (!beforeDate || dueDateForFilter < beforeDate);
            return searchMatch && statusMatch && customerMatch && entityMatch && partnerMatch && dueStatusMatch && dateMatch && dueDateMatch;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key]; let bValue = b[sortConfig.key];
                if (sortConfig.key.includes('Date')) { aValue = new Date(aValue); bValue = new Date(bValue); }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [processedInvoices, searchTerm, filters, sortConfig]);

    const groupedInvoices = useMemo(() => {
        if (groupBy === 'none') {
            return { 'all': sortedAndFilteredInvoices }
        }
        return sortedAndFilteredInvoices.reduce((acc, invoice) => {
            const key = invoice[groupBy] || 'N/A';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(invoice);
            return acc;
        }, {});
    }, [sortedAndFilteredInvoices, groupBy]);

    const paginatedInvoices = useMemo(() => {
        if (groupBy !== 'none') {
            return groupedInvoices;
        }
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return { 'all': sortedAndFilteredInvoices.slice(indexOfFirstItem, indexOfLastItem) };
    }, [groupedInvoices, currentPage, itemsPerPage, groupBy, sortedAndFilteredInvoices]);

    const totalPages = Math.ceil(sortedAndFilteredInvoices.length / itemsPerPage);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const selectedPreviewCustomer = useMemo(() => previewInvoice ? customers.find(c => c.id === previewInvoice.customerId) : null, [previewInvoice, customers]);
    const selectedPreviewEntity = useMemo(() => previewInvoice ? entities.find(e => e.id === previewInvoice.entityId) : null, [previewInvoice, entities]);

    // Helper function to convert Blob to Base64 string
    const blobToBase64 = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    const updateInvoiceStatus = async (invoice, newStatus, customer) => {
        console.log("--- updateInvoiceStatus triggered ---");
        console.log("Invoice:", invoice);
        console.log("New Status:", newStatus);
        console.log("Customer:", customer);

        try {
            const invoiceRef = doc(db, invoicesCollectionPath, invoice.id);
            await updateDoc(invoiceRef, { status: newStatus });
            console.log("Firestore invoice status updated successfully.");

            logAuditEvent('UPDATE_INVOICE_STATUS', {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.total,
                customerName: invoice.customerName,
                changes: {
                    status: { from: invoice.status, to: newStatus }
                }
            });
            console.log("Audit event logged.");

            console.log(`Checking email condition: newStatus === 'Sent' (${newStatus === 'Sent'}) && customer?.email (${customer?.email})`);
            if (newStatus === 'Sent' && customer?.email) {
                console.log(`Email sending condition met for customer: ${customer.name} (${customer.email})`);

                // Get the entity associated with the invoice
                const invoiceEntity = entities.find(e => e.id === invoice.entityId);

                // Generate PDF Base64 string
                let pdfBase64Data = null;
                try {
                    const pdfInstance = pdf(<InvoicePDF invoice={invoice} customer={customer} entity={invoiceEntity} />);
                    const blob = await pdfInstance.toBlob(); // Correctly get Blob
                    console.log("PDF Blob generated successfully. Size:", blob.size, "Type:", blob.type);

                    const dataUrl = await blobToBase64(blob); // Convert Blob to Data URL

                    console.log("Full Data URL from blobToBase64:", dataUrl.substring(0, 100) + '...' + dataUrl.substring(dataUrl.length - 100));
                    console.log("Length of full Data URL:", dataUrl.length);

                    pdfBase64Data = dataUrl.split(',')[1]; // Strip the "data:application/pdf;base64," prefix

                    console.log("PDF Base64 data (after stripping prefix):", pdfBase64Data.substring(0, 100) + '...' + pdfBase64Data.substring(pdfBase64Data.length - 100));
                    console.log("Length of PDF Base64 data:", pdfBase64Data.length);

                    // Optional: Client-side atob() decode check for Base64 validity
                    try {
                        const decodedTest = atob(pdfBase64Data);
                        console.log("Client-side atob() decode successful. Length:", decodedTest.length);
                    } catch (decodeError) {
                        console.error("Client-side atob() decode failed:", decodeError);
                        console.error("This suggests the Base64 string might be invalid or malformed from the source.");
                    }

                    console.log("PDF Base64 data prepared for sending.");
                } catch (pdfError) {
                    console.error("Error generating PDF Blob or Base64 data:", pdfError);
                    // Handle case where PDF generation fails (e.g., show a user error)
                }

                const cloudFunctionUrl = "https://us-central1-recmgmt1.cloudfunctions.net/send_email";
                console.log("Attempting to send email to Cloud Function:", cloudFunctionUrl);
                const emailPayload = {
                    to: customer.email,
                    subject: `Invoice ${invoice.invoiceNumber} Sent`,
                    body: `Dear ${customer.name},\n\nYour invoice #${invoice.invoiceNumber} has been sent.\n\nThank you.`,
                };

                if (pdfBase64Data) {
                    emailPayload.attachment = {
                        filename: `${invoice.invoiceNumber}.pdf`,
                        data: pdfBase64Data,
                        mimeType: 'application/pdf'
                    };
                    console.log("Email Payload with attachment:", emailPayload);
                } else {
                    console.log("Email Payload (no attachment due to PDF generation error):", emailPayload);
                }


                try {
                    const response = await fetch(cloudFunctionUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(emailPayload),
                    });

                    if (response.ok) {
                        console.log("Email Cloud Function call successful!");
                        const responseData = await response.text();
                        console.log("Cloud Function Response:", responseData);
                    } else {
                        const errorText = await response.text();
                        console.error(`Email Cloud Function call failed: ${response.status} ${response.statusText}`, errorText);
                    }
                } catch (fetchError) {
                    console.error("Error during fetch call to Cloud Function:", fetchError);
                }
            } else {
                console.log("Email not sent: condition (newStatus === 'Sent' && customer?.email) not met.");
            }

        } catch (err) {
            console.error("Caught an error in updateInvoiceStatus:", err);
        }
        console.log("--- updateInvoiceStatus finished ---");
    };

    const handleDeleteInvoice = async () => {
        if (!invoiceToDelete) return;
        try {
            await deleteDoc(doc(db, invoicesCollectionPath, invoiceToDelete.id));
            logAuditEvent('DELETE_INVOICE', {
                invoiceId: invoiceToDelete.id,
                invoiceNumber: invoiceToDelete.invoiceNumber,
                amount: invoiceToDelete.total,
                customerName: invoiceToDelete.customerName,
            });
            setInvoiceToDelete(null);
        }
        catch (err) {
            console.error("Error deleting invoice: ", err);
        }
    };

    const handleFilterChange = (category, values) => setFilters(prev => ({ ...prev, [category]: values }));
    const handleDateRangeChange = ({ startDate, endDate }) => setFilters(prev => ({ ...prev, startDate, endDate }));

    const clearAllFilters = () => {
        setFilters(defaultFilters);
        setSearchTerm('');
        setGroupBy('none');
    };

    const handleConfirmMarkAsPaid = async (invoice, paymentDetails) => {
        try {
            const payload = {
                status: 'Paid',
                paymentDate: paymentDetails.paymentDate,
                paymentReceivedIn: paymentDetails.bankAccount,
                totalAmountReceived: paymentDetails.totalAmountReceived, // Added
                tdsReceivable: paymentDetails.tdsReceivable,             // Added
                gstTds: paymentDetails.gstTds                           // Added
            };
            await updateDoc(doc(db, invoicesCollectionPath, invoice.id), payload);
            logAuditEvent('MARK_INVOICE_AS_PAID', {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.total,
                customerName: invoice.customerName,
                changes: {
                    status: { from: invoice.status, to: 'Paid' },
                    paymentDate: { to: paymentDetails.paymentDate }
                }
            });
            setInvoiceToMarkAsPaid(null);
        } catch (err) {
            console.error("Error marking invoice as paid: ", err);
        }
    };

    const handleExport = () => {
        const header = [
            "Invoice #", "Customer", "Entity", "Invoice Date", "Due Date",
            "Status", "Due Status", "Amount", "Partner"
        ];
        const dataToExport = sortedAndFilteredInvoices.map(inv => ({
            'Invoice #': inv.invoiceNumber, 'Customer': inv.customerName,
            'Entity': inv.entityName, 'Invoice Date': inv.invoiceDate,
            'Due Date': inv.dueDate, 'Status': inv.status,
            'Due Status': inv.dueStatus, 'Amount': inv.total,
            'Partner': inv.partner
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const colWidths = header.map(h => ({ wch: Math.max(h.length, ...dataToExport.map(row => row[h]?.toString().length || 0)) }));
        worksheet['!cols'] = colWidths;
        const headerStyle = { font: { color: { rgb: "FFFFFF" }, bold: true }, fill: { fgColor: { rgb: "002060" } } };
        const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ c: C, r: headerRange.s.r });
            if (!worksheet[address]) continue;
            worksheet[address].s = headerStyle;
        }
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
        XLSX.writeFile(workbook, "invoices.xlsx");
    };

    const handleImportInvoices = async (dataToImport) => {
        const batch = writeBatch(db);
        dataToImport.forEach(item => {
            const docRef = doc(collection(db, invoicesCollectionPath));
            const newInvoice = {
                invoiceNumber: item.invoiceNumber, customerId: item.customerId,
                entityId: item.entityId, invoiceDate: item.invoiceDate,
                dueDate: item.dueDate, total: parseFloat(item.total) || 0,
                status: item.status || 'Draft',
            };
            batch.set(docRef, newInvoice);
        });
        try {
            await batch.commit();
            alert('Invoices imported successfully!');
        } catch (err) {
            console.error("Error importing invoices: ", err);
            alert('An error occurred while importing invoices.');
        }
    };

    if (isLoading) return <p>Loading invoices...</p>;

    return (
        <div className="space-y-6">
            {previewInvoice && <InvoicePreviewModal invoice={previewInvoice} customer={selectedPreviewCustomer} entity={selectedPreviewEntity} onClose={() => setPreviewInvoice(null)} />}
            {invoiceToDelete && <ConfirmDeleteModal item={invoiceToDelete} onConfirm={handleDeleteInvoice} onCancel={() => setInvoiceToDelete(null)} />}
            {invoiceToMarkAsPaid && (
                <MarkAsPaidModal
                    isOpen={!!invoiceToMarkAsPaid}
                    onClose={() => setInvoiceToMarkAsPaid(null)}
                    onConfirm={(id, details) => handleConfirmMarkAsPaid(invoiceToMarkAsPaid, details)}
                    invoice={invoiceToMarkAsPaid}
                    entities={entities}
                />
            )}
            {historyInvoice && (
                <InvoiceHistoryModal
                    isOpen={!!historyInvoice}
                    onClose={() => setHistoryInvoice(null)}
                    invoice={historyInvoice}
                />
            )}

            <h1 className="text-3xl font-bold text-gray-800">All Invoices</h1>

            <InvoiceFilters
                filters={filters} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                handleFilterChange={handleFilterChange} handleDateRangeChange={handleDateRangeChange}
                entities={entities} customers={customers} partners={partners}
            />

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div>
                        <label htmlFor="groupBy" className="form-label">Group By:</label>
                        <select id="groupBy" value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="form-input-create">
                            <option value="none">None</option> <option value="customerId">Customer</option>
                            <option value="entityId">Entity</option> <option value="status">Status</option>
                            <option value="type">Type</option> <option value="partner">Partner</option>
                        </select>
                    </div>
                    <button onClick={clearAllFilters} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg mt-6">Clear All Filters</button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowImportModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mt-6">
                        <Upload size={16} /> Import Invoices
                    </button>
                    <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mt-6">
                        <FileDown size={16} /> Export to Excel
                    </button>
                </div>
            </div>

            <InvoiceTable
                groupedInvoices={paginatedInvoices} sortConfig={sortConfig} requestSort={requestSort}
                setPreviewInvoice={setPreviewInvoice} setInvoiceToDelete={setInvoiceToDelete}
                updateInvoiceStatus={updateInvoiceStatus} onMarkAsPaidClick={setInvoiceToMarkAsPaid}
                onViewHistoryClick={setHistoryInvoice}
                selectedPreviewCustomer={selectedPreviewCustomer} selectedPreviewEntity={selectedPreviewEntity}
                groupBy={groupBy} customers={customers} entities={entities}
            />

            {groupBy === 'none' && (
                <div className="mt-4 flex justify-between items-center">
                    <div>
                        <label htmlFor="itemsPerPage" className="text-sm text-gray-600 mr-2">Items per page:</label>
                        <select id="itemsPerPage" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="form-input-compact">
                            <option value={10}>10</option> <option value={25}>25</option>
                            <option value={50}>50</option> <option value={75}>75</option>
                            <option value={100}>100</option> <option value={200}>200</option>
                        </select>
                    </div>
                    <div className="flex items-center">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50">
                            Previous
                        </button>
                        <span className="px-4">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50">
                            Next
                        </button>
                    </div>
                </div>
            )}

            {sortedAndFilteredInvoices.length === 0 && <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200"><p className="text-gray-500">No invoices match the current filters.</p></div>}
            <ImportModal
                isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleImportInvoices}
                requiredFields={['invoiceNumber', 'customerId', 'entityId', 'invoiceDate', 'dueDate', 'total']}
            />
        </div>
    );
}

export default ViewInvoices;
