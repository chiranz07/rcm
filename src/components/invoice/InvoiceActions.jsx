// src/components/invoice/InvoiceActions.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Send, CheckCircle, DollarSign, FileUp } from 'lucide-react';

const InvoiceActions = ({ invoice, updateInvoiceStatus, onMarkAsPaidClick, customer }) => {
    return (
        <div className="flex justify-center whitespace-nowrap">
            {invoice.status === 'Proforma' && (
                <Link
                    to={`/invoices/edit/${invoice.id}?mode=convert`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                    title="Convert to Invoice"
                >
                    <FileUp size={14} /> Convert to Invoice
                </Link>
            )}
            {/* Removed the 'Draft' status condition as it's now 'Invoiced' */}
            {invoice.status === 'Invoiced' && (
                <button onClick={(e) => { e.stopPropagation(); updateInvoiceStatus(invoice, 'Sent', customer); }} className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200" title="Mark as Sent">
                    <Send size={14} /> Mark as Sent
                </button>
            )}
            {invoice.status === 'Sent' && (
                <button onClick={(e) => { e.stopPropagation(); onMarkAsPaidClick(invoice); }} className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md text-green-600 bg-green-100 hover:bg-green-200" title="Mark as Paid">
                    <DollarSign size={14} /> Mark as Paid
                </button>
            )}
        </div>
    );
};

export default InvoiceActions;