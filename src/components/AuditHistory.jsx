import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, appId } from '../api/firebase';
import PageLoader from './common/PageLoader';

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

const formatIndianCurrency = (num) => {
    if (typeof num !== 'number') return 'N/A';
    return Number(num).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

const formatAction = (log) => {
    switch (log.action) {
        case 'CREATE_INVOICE':
            return `Created Invoice`;
        case 'UPDATE_INVOICE':
            return 'Edited Invoice';
        case 'DELETE_INVOICE':
            return 'Deleted Invoice';
        case 'CONVERT_TO_INVOICE':
            return 'Converted to Invoice';
        case 'UPDATE_INVOICE_STATUS':
            return `Status Changed`;
        case 'MARK_INVOICE_AS_PAID':
            return 'Marked as Paid';
        case 'CREATE_ENTITY':
            return 'Created Entity';
        case 'UPDATE_ENTITY':
            return 'Edited Entity';
        case 'CREATE_CUSTOMER':
            return 'Created Customer';
        case 'UPDATE_CUSTOMER':
            return 'Edited Customer';
        default:
            return log.action;
    }
};

const ChangeLog = ({ changes }) => {
    const renderChanges = (changeData, level = 0) => {
        return Object.entries(changeData).map(([key, value]) => {
            if (value && typeof value.from !== 'undefined' && typeof value.to !== 'undefined') {
                return (
                    <li key={key} style={{ marginLeft: `${level * 20}px` }}>
                        <span className="font-semibold">{key}:</span> changed from "{value.from}" to "{value.to}"
                    </li>
                );
            }
            if (value && typeof value === 'object') {
                return (
                    <li key={key} style={{ marginLeft: `${level * 20}px` }}>
                        <span className="font-semibold">{key}:</span>
                        <ul className="list-disc list-inside">{renderChanges(value, level + 1)}</ul>
                    </li>
                );
            }
            return null; // Don't render if the format is unexpected
        });
    };

    return (
        <ul className="list-disc list-inside mt-1 text-gray-500 text-xs">
            {renderChanges(changes)}
        </ul>
    );
};

const ActionDetails = ({ log }) => {
    if (log.details?.changes) {
        return <ChangeLog changes={log.details.changes} />;
    }

    let detailsString = '';
    if(log.action === 'CREATE_INVOICE') detailsString = `Status: ${log.details.status}`;
    if(log.action === 'MARK_INVOICE_AS_PAID') detailsString = `Payment Date: ${log.details.paymentDate}`;

    return <span className="text-gray-500">{detailsString || 'N/A'}</span>;
};


const AuditHistory = () => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const auditLogCollectionPath = `/artifacts/${appId}/audit_logs`;
        const q = query(
            collection(db, auditLogCollectionPath),
            orderBy('timestamp', 'desc'),
            limit(200)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching audit logs: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return <PageLoader />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Audit History</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead className="bg-gray-50 border-b-2 border-gray-200 text-xs uppercase text-gray-500 tracking-wider">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Date & Time</th>
                                <th className="px-4 py-3 font-semibold">User</th>
                                <th className="px-4 py-3 font-semibold">Action</th>
                                <th className="px-4 py-3 font-semibold">Target</th>
                                <th className="px-4 py-3 font-semibold">Details of Change</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {auditLogs.map(log => (
                                <tr key={log.id} className="border-b border-gray-100 last:border-b-0">
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                                    <td className="px-4 py-3 text-gray-800 font-medium">{log.userName}</td>
                                    <td className="px-4 py-3">
                                        <span className="font-semibold text-gray-700">
                                            {formatAction(log)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {log.invoiceNumber !== 'N/A' ? `Invoice: ${log.invoiceNumber}` : ''}
                                        {log.details?.entityName ? `Entity: ${log.details.entityName}` : ''}
                                        {log.details?.customerName ? `Customer: ${log.details.customerName}` : ''}
                                    </td>
                                    <td className="px-4 py-3">
                                        <ActionDetails log={log} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditHistory;