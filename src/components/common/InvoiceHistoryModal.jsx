import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, appId } from '../../api/firebase';
import { X } from 'lucide-react';
import PageLoader from './PageLoader';

const formatDate = (timestamp) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate();
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
};

const formatAction = (log) => {
    switch (log.action) {
        case 'CREATE_INVOICE':
            return `Created Invoice (${log.details.status})`;
        case 'UPDATE_INVOICE':
            return 'Edited Invoice';
        case 'DELETE_INVOICE':
            return 'Deleted Invoice';
        case 'CONVERT_TO_INVOICE':
            return 'Converted to Invoice';
        case 'UPDATE_INVOICE_STATUS':
            return `Status Changed to ${log.details.newStatus}`;
        case 'MARK_INVOICE_AS_PAID':
            return 'Marked as Paid';
        default:
            return log.action;
    }
};

const ChangeLog = ({ changes }) => {
    const renderChanges = (changeData, level = 0) => {
        return Object.entries(changeData).map(([key, value]) => {
            if (value && typeof value.from !== 'undefined' && typeof value.to !== 'undefined') {
                return (
                    <li key={key} style={{ marginLeft: `${level * 15}px` }}>
                        <span className="font-semibold">{key}:</span> changed from "{String(value.from)}" to "{String(value.to)}"
                    </li>
                );
            }
            if (value && typeof value === 'object') {
                return (
                    <li key={key} style={{ marginLeft: `${level * 15}px` }}>
                        <span className="font-semibold">{key}:</span>
                        <ul className="list-disc list-inside">{renderChanges(value, level + 1)}</ul>
                    </li>
                );
            }
            return null;
        });
    };
    return <ul className="list-disc list-inside mt-1 text-gray-500 text-xs">{renderChanges(changes)}</ul>;
};

const InvoiceHistoryModal = ({ isOpen, onClose, invoice }) => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !invoice?.id) return;

        setIsLoading(true);
        const auditLogCollectionPath = `/artifacts/${appId}/audit_logs`;
        const q = query(
            collection(db, auditLogCollectionPath),
            where('details.invoiceId', '==', invoice.id),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching invoice history: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, invoice]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] border flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-800">History for Invoice: {invoice?.invoiceNumber}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {isLoading ? <PageLoader /> : (
                        <table className="w-full text-left table-auto">
                            <thead className="bg-gray-50 border-b-2 border-gray-200 text-xs uppercase text-gray-500 tracking-wider sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Date & Time</th>
                                    <th className="px-4 py-3 font-semibold">Action</th>
                                    <th className="px-4 py-3 font-semibold">Details of Change</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {logs.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center p-8 text-gray-500">No history found for this invoice.</td></tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="border-b border-gray-100 last:border-b-0">
                                            <td className="px-4 py-3 text-gray-600 align-top whitespace-nowrap">{formatDate(log.timestamp)}</td>
                                            <td className="px-4 py-3 align-top">
                                                <span className="font-semibold text-gray-700">{formatAction(log)}</span>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                {log.details?.changes ? <ChangeLog changes={log.details.changes} /> : <span className="text-gray-400">N/A</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="p-4 border-t text-right">
                    <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-200 transition font-semibold text-sm">Close</button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceHistoryModal;