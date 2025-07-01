// src/components/Reports.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, appId } from '../api/firebase'; // Removed getUserId
import { useAppContext } from '../context/AppContext'; // Import useAppContext
import { Link } from 'react-router-dom';
import { Download, Pencil, Trash2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';

const AgingReport = ({ invoices, onBucketSelect, selectedBucket }) => {
    const formatIndianCurrency = (num) => Number(num).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const agingData = useMemo(() => {
        const today = new Date();
        const buckets = { all: 0, current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        invoices.forEach(inv => {
            if (!['Sent', 'Invoiced'].includes(inv.status)) return;
            const total = inv.total || 0;
            buckets.all += total;
            const dueDate = new Date(inv.dueDate);
            if (isNaN(dueDate.getTime())) return;
            const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) buckets.current += total;
            else if (diffDays <= 30) buckets['1-30'] += total;
            else if (diffDays <= 60) buckets['31-60'] += total;
            else if (diffDays <= 90) buckets['61-90'] += total;
            else buckets['90+'] += total;
        });
        return buckets;
    }, [invoices]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Object.entries(agingData).map(([bucket, amount]) => (
                <div
                    key={bucket}
                    className={`p-3 rounded-lg border text-center cursor-pointer transition-all duration-200 ${selectedBucket === bucket ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 hover:bg-gray-100'}`}
                    onClick={() => onBucketSelect(bucket)}
                >
                    <p className={`text-xs capitalize ${selectedBucket === bucket ? 'text-white/80' : 'text-gray-500'}`}>{bucket === 'current' ? 'Current' : bucket === 'all' ? 'All Invoices' : `${bucket} Days`}</p>
                    <p className={`text-xl font-semibold mt-1 ${selectedBucket === bucket ? 'text-white' : 'text-gray-700'}`}>₹{formatIndianCurrency(amount)}</p>
                </div>
            ))}
        </div>
    );
};

const InvoiceList = ({ invoices, customers, entities }) => {
    const formatIndianCurrency = (num) => Number(num).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    if (invoices.length === 0) {
        return <p className="text-center text-gray-500 py-8">No invoices in this category.</p>
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
                <thead className="border-b-2 border-gray-100">
                <tr>
                    <th className="p-2 font-semibold text-gray-500 text-xs">Invoice #</th>
                    <th className="p-2 font-semibold text-gray-500 text-xs">Customer</th>
                    <th className="p-2 font-semibold text-gray-500 text-xs">Entity</th>
                    <th className="p-2 font-semibold text-gray-500 text-xs">Total</th>
                    <th className="p-2 font-semibold text-gray-500 text-xs">Status</th>
                    <th className="p-2 font-semibold text-gray-500 text-xs">Due Date</th>
                </tr>
                </thead>
                <tbody>
                {invoices.map(invoice => (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 font-mono text-xs text-gray-500">{invoice.invoiceNumber}</td>
                        <td className="p-2 text-gray-600 text-xs">{customers.find(c => c.id === invoice.customerId)?.name || 'N/A'}</td>
                        <td className="p-2 text-gray-600 text-xs">{entities.find(e => e.id === invoice.entityId)?.name || 'N/A'}</td>
                        <td className="p-2 font-medium text-gray-600">₹{formatIndianCurrency(invoice.total)}</td>
                        {/* Updated status color logic to align with 'Invoiced' replacing 'Draft' */}
                        <td className="p-2"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800' : invoice.status === 'Invoiced' ? 'bg-indigo-100 text-indigo-800' : invoice.status === 'Proforma' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800' }`}>{invoice.status}</span></td>
                        <td className="p-2 text-gray-500">{invoice.dueDate}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}

const Reports = () => {
    const { entities, user, isAuthReady } = useAppContext(); // Get user and isAuthReady from context
    const [allInvoices, setAllInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBucket, setSelectedBucket] = useState('all');

    const invoicesCollectionPath = `/artifacts/${appId}/invoices`;
    const customersCollectionPath = `/artifacts/${appId}/customers`;

    useEffect(() => {
        // Only proceed if authentication state is ready and a user is logged in
        if (!isAuthReady || !user) {
            setIsLoading(false);
            return;
        }

        const qInvoices = query(collection(db, invoicesCollectionPath));
        const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
            setAllInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, () => setIsLoading(false));

        const qCustomers = query(collection(db, customersCollectionPath));
        const unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeInvoices();
            unsubscribeCustomers();
        };
    }, [user, isAuthReady]); // Add user and isAuthReady to dependency array

    const filteredInvoices = useMemo(() => {
        if (selectedBucket === 'all') {
            return allInvoices.filter(inv => ['Sent', 'Invoiced'].includes(inv.status));
        }

        const today = new Date();
        return allInvoices.filter(inv => {
            if (!['Sent', 'Invoiced'].includes(inv.status)) return false;

            const dueDate = new Date(inv.dueDate);
            if (isNaN(dueDate.getTime())) return false;

            const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

            switch (selectedBucket) {
                case 'current': return diffDays <= 0;
                case '1-30': return diffDays > 0 && diffDays <= 30;
                case '31-60': return diffDays > 30 && diffDays <= 60;
                case '61-90': return diffDays > 60 && diffDays <= 90;
                case '90+': return diffDays > 90;
                default: return false;
            }
        });
    }, [selectedBucket, allInvoices]);

    if (isLoading || !isAuthReady) { // Adjusted loading condition to also wait for auth readiness
        return <p>Loading reports...</p>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Receivables Aging</h2>
                <AgingReport
                    invoices={allInvoices}
                    onBucketSelect={setSelectedBucket}
                    selectedBucket={selectedBucket}
                />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Invoice Details</h2>
                <InvoiceList
                    invoices={filteredInvoices}
                    customers={customers}
                    entities={entities}
                />
            </div>
        </div>
    );
};

export default Reports;