import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, appId } from '../api/firebase';
import { useAppContext } from '../context/AppContext';
import PaymentFilters from './payment/PaymentFilters.jsx';
import PaymentTable from './payment/PaymentTable.jsx';

function ViewPayments() {
    // Use the context's loading state and rename it to avoid conflicts.
    const { entities, customers, isLoading: isContextLoading } = useAppContext();
    const [invoices, setInvoices] = useState([]);
    // This state is now specifically for loading the invoices.
    const [isInvoiceLoading, setIsInvoiceLoading] = useState(true);
    const [filters, setFilters] = useState({ customerId: [], startDate: null, endDate: null });
    const [sortConfig, setSortConfig] = useState({ key: 'paymentDate', direction: 'descending' });

    const invoicesCollectionPath = `/artifacts/${appId}/invoices`;

    useEffect(() => {
        const q = query(collection(db, invoicesCollectionPath), where("status", "==", "Paid"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsInvoiceLoading(false); // Stop loading once invoices are fetched.
        }, (err) => {
            console.error("Error fetching paid invoices: ", err);
            setIsInvoiceLoading(false); // Also stop loading on error.
        });

        return () => unsubscribe();
    }, [invoicesCollectionPath]); // Correctly add dependency

    const processedInvoices = useMemo(() => {
        // Guard clause: Don't process until customers and entities are loaded.
        if (!customers || !entities || customers.length === 0 || entities.length === 0) {
            return [];
        }
        const customerMap = new Map(customers.map(c => [c.id, c.name]));
        const entityMap = new Map(entities.map(e => [e.id, e.name]));

        return invoices.map(inv => ({
            ...inv,
            customerName: customerMap.get(inv.customerId) || 'N/A',
            entityName: entityMap.get(inv.entityId) || 'N/A',
        }));
    }, [invoices, customers, entities]);

    const sortedAndFilteredInvoices = useMemo(() => {
        let filtered = processedInvoices.filter(inv => {
            const customerMatch = filters.customerId.length === 0 || filters.customerId.includes(inv.customerId);
            const paymentDate = new Date(inv.paymentDate);
            const dateMatch = (!filters.startDate || paymentDate >= filters.startDate) && (!filters.endDate || paymentDate <= filters.endDate);
            return customerMatch && dateMatch;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                if (sortConfig.key.includes('Date')) {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [processedInvoices, filters, sortConfig]);


    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleFilterChange = (category, values) => {
        setFilters(prev => ({ ...prev, [category]: values }));
    };

    const handleDateRangeChange = ({ startDate, endDate }) => {
        setFilters(prev => ({ ...prev, startDate, endDate }));
    };

    // Show a loading message if either the context or the invoices are still loading.
    if (isContextLoading || isInvoiceLoading) {
        return <p>Loading payments...</p>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Recorded Payments</h1>

            <PaymentFilters
                filters={filters}
                handleFilterChange={handleFilterChange}
                handleDateRangeChange={handleDateRangeChange}
                customers={customers || []} // Pass an empty array if customers is null/undefined
            />

            <PaymentTable
                invoices={sortedAndFilteredInvoices}
                sortConfig={sortConfig}
                requestSort={requestSort}
            />
            {sortedAndFilteredInvoices.length === 0 && <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200"><p className="text-gray-500">No payments match the current filters.</p></div>}
        </div>
    );
}

export default ViewPayments;