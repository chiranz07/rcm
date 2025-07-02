// src/components/invoice/InvoiceTable.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Pencil, Trash2, ArrowUp, ArrowDown, History } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from '../InvoicePDF';
import InvoiceActions from './InvoiceActions';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const SortableHeader = ({ children, columnKey, sortConfig, requestSort, className = '' }) => {
    const isSorted = sortConfig.key === columnKey;
    const directionIcon = isSorted ? (sortConfig.direction === 'ascending' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : null;

    return (
        <th className={`px-4 py-3 font-semibold cursor-pointer select-none hover:bg-gray-100 whitespace-nowrap border-r border-gray-200 ${className}`} onClick={() => requestSort(columnKey)}>
            <div className={`flex items-center gap-2 ${className.includes('text-right') ? 'justify-end' : ''}`}>
                <span>{children}</span>
                <span className="text-gray-400">{directionIcon}</span>
            </div>
        </th>
    );
};


const InvoiceTable = ({
                          groupedInvoices,
                          sortConfig,
                          requestSort,
                          setPreviewInvoice,
                          setInvoiceToDelete,
                          updateInvoiceStatus,
                          onMarkAsPaidClick,
                          onViewHistoryClick,
                          selectedPreviewCustomer,
                          selectedPreviewEntity,
                          groupBy,
                          customers,
                          entities,
                      }) => {
    // Removed 'Draft' from statusColors
    const statusColors = { Paid: 'bg-green-100 text-green-800', Sent: 'bg-blue-100 text-blue-800', Invoiced: 'bg-indigo-100 text-indigo-800', Proforma: 'bg-orange-100 text-orange-800' };

    const getGroupName = (key) => {
        if (groupBy === 'customerId') {
            return customers.find(c => c.id === key)?.name || key;
        }
        if (groupBy === 'entityId') {
            return entities.find(e => e.id === key)?.name || key;
        }
        return key;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead className="bg-gray-50 border-b-2 border-gray-200 text-xs uppercase text-gray-500 tracking-wider">
                    <tr>
                        <SortableHeader columnKey="invoiceDate" sortConfig={sortConfig} requestSort={requestSort}>Invoice Date</SortableHeader>
                        <SortableHeader columnKey="invoiceNumber" sortConfig={sortConfig} requestSort={requestSort}>Invoice #</SortableHeader>
                        <SortableHeader columnKey="customerName" sortConfig={sortConfig} requestSort={requestSort}>Customer</SortableHeader>
                        <SortableHeader columnKey="total" sortConfig={sortConfig} requestSort={requestSort} className="text-right">Amount</SortableHeader>
                        <SortableHeader columnKey="status" sortConfig={sortConfig} requestSort={requestSort}>Status</SortableHeader>
                        <SortableHeader columnKey="dueDate" sortConfig={sortConfig} requestSort={requestSort}>Due Date</SortableHeader>
                        <th className="px-4 py-3 font-semibold border-r border-gray-200">Due Status</th>
                        <th className="px-4 py-3 font-semibold border-r border-gray-200">Partner</th>
                        <th className="px-4 py-3 font-semibold border-r border-gray-200">Entity</th>
                        <th className="px-4 py-3 font-semibold text-center whitespace-nowrap border-r border-gray-200">Next Step</th>
                        <th className="px-4 py-3 font-semibold text-center">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="text-sm">
                    {Object.keys(groupedInvoices).map(groupKey => (
                        <React.Fragment key={groupKey}>
                            {groupBy !== 'none' && (
                                <tr className="bg-gray-100">
                                    <td colSpan="11" className="px-4 py-2 font-bold text-gray-700">
                                        {getGroupName(groupKey)}
                                    </td>
                                </tr>
                            )}
                            {groupedInvoices[groupKey].map(invoice => {
                                // Updated isEditable to include 'Invoiced' instead of 'Draft'
                                const isEditable = ['Invoiced', 'Proforma'].includes(invoice.status);
                                const currentCustomer = customers.find(c => c.id === invoice.customerId);
                                return (
                                    <tr key={invoice.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer" onClick={() => setPreviewInvoice(invoice)}>
                                        <td className="px-4 py-3 text-gray-600 align-middle whitespace-nowrap border-r border-gray-200">{formatDate(invoice.invoiceDate)}</td>
                                        <td className="px-4 py-3 font-mono text-gray-600 align-middle whitespace-nowrap border-r border-gray-200">{invoice.invoiceNumber}</td>
                                        <td className="px-4 py-3 text-gray-800 font-medium align-middle border-r border-gray-200">{invoice.customerName}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-800 text-right align-middle whitespace-nowrap border-r border-gray-200">₹{invoice.total?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                        <td className="px-4 py-3 align-middle border-r border-gray-200"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColors[invoice.status] || 'bg-gray-100 text-gray-800'}`}>{invoice.status}</span></td>
                                        <td className="px-4 py-3 text-gray-600 align-middle whitespace-nowrap border-r border-gray-200">{formatDate(invoice.dueDate)}</td>
                                        <td className="px-4 py-3 align-middle border-r border-gray-200">{invoice.dueStatus && <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${ invoice.dueStatus === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800' }`}>{invoice.dueStatus}</span>}</td>
                                        <td className="px-4 py-3 text-gray-600 align-middle border-r border-gray-200">{invoice.partner || 'N/A'}</td>
                                        <td className="px-4 py-3 text-gray-600 align-middle border-r border-gray-200">{invoice.entityName}</td>
                                        <td className="px-4 py-3 align-middle border-r border-gray-200">
                                            <InvoiceActions
                                                invoice={invoice}
                                                updateInvoiceStatus={(inv, newStatus) => updateInvoiceStatus(inv, newStatus, currentCustomer)}
                                                onMarkAsPaidClick={onMarkAsPaidClick}
                                                customer={currentCustomer}
                                            />
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                            <div className="flex items-center justify-center space-x-1">
                                                <button onClick={(e) => { e.stopPropagation(); onViewHistoryClick(invoice); }} className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-md" title="View History">
                                                    <History size={16}/>
                                                </button>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <PDFDownloadLink
                                                        document={<InvoicePDF invoice={invoice} customer={customers.find(c => c.id === invoice.customerId)} entity={entities.find(e => e.id === invoice.entityId)} />}
                                                        fileName={`${invoice.invoiceNumber || 'Invoice'}_${invoice.customerName || 'Customer'}.pdf`} // Modified filename with fallback
                                                        className="p-2 block rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                        title="Download PDF"
                                                    >
                                                        <Download size={16}/>
                                                    </PDFDownloadLink>
                                                </div>
                                                <Link to={`/invoices/edit/${invoice.id}`} className={`p-2 rounded-md ${isEditable ? 'text-gray-500 hover:text-cyan-600 hover:bg-cyan-50' : 'text-gray-300 cursor-not-allowed'}`} title={isEditable ? 'Edit Invoice' : 'Cannot edit a sent or paid invoice'}>
                                                    <Pencil size={16}/>
                                                </Link>
                                                <button onClick={(e) => { e.stopPropagation(); setInvoiceToDelete(invoice); }} className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-md" title="Delete Invoice">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </React.Fragment>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InvoiceTable;