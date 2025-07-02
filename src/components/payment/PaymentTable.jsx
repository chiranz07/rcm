import React from 'react';

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
    const directionIcon = isSorted ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : '';

    return (
        <th className={`px-4 py-3 font-semibold cursor-pointer select-none hover:bg-gray-100 ${className}`} onClick={() => requestSort(columnKey)}>
            {children}{directionIcon}
        </th>
    );
};

const PaymentTable = ({ invoices, sortConfig, requestSort }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead className="bg-gray-50 border-b-2 border-gray-200 text-xs uppercase text-gray-500 tracking-wider">
                    <tr>
                        <SortableHeader columnKey="paymentDate" sortConfig={sortConfig} requestSort={requestSort}>Payment Date</SortableHeader>
                        <SortableHeader columnKey="invoiceNumber" sortConfig={sortConfig} requestSort={requestSort}>Invoice #</SortableHeader>
                        <SortableHeader columnKey="customerName" sortConfig={sortConfig} requestSort={requestSort}>Customer</SortableHeader>
                        <SortableHeader columnKey="total" sortConfig={sortConfig} requestSort={requestSort} className="text-right">Amount</SortableHeader>
                        <SortableHeader columnKey="paymentReceivedIn" sortConfig={sortConfig} requestSort={requestSort}>Bank Account</SortableHeader>
                        <SortableHeader columnKey="entityName" sortConfig={sortConfig} requestSort={requestSort}>Entity</SortableHeader>
                    </tr>
                    </thead>
                    <tbody className="text-sm">
                    {invoices.map(invoice => (
                        <tr key={invoice.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-200">
                            <td className="px-4 py-3 text-gray-600">{formatDate(invoice.paymentDate)}</td>
                            <td className="px-4 py-3 font-mono text-gray-600">{invoice.invoiceNumber}</td>
                            <td className="px-4 py-3 text-gray-800 font-medium">{invoice.customerName}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800 text-right">₹{invoice.total?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-gray-600">{invoice.paymentReceivedIn}</td>
                            <td className="px-4 py-3 text-gray-600">{invoice.entityName}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentTable;