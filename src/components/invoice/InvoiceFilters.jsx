// src/components/invoice/InvoiceFilters.jsx
import React from 'react';
import { Search } from 'lucide-react';
import MultiSelectDropdown from '../common/MultiSelectDropdown';
import DateRangePicker from '../common/DateRangePicker';

const InvoiceFilters = ({ filters, searchTerm, setSearchTerm, handleFilterChange, handleDateRangeChange, entities, customers, partners }) => {
    // Removed 'Draft' from statusOptions as it's replaced by 'Invoiced'
    const statusOptions = [{ id: 'Proforma', name: 'Proforma' }, { id: 'Invoiced', name: 'Invoiced' }, { id: 'Sent', name: 'Sent' }, { id: 'Paid', name: 'Paid' }];
    const dueStatusOptions = [{ id: 'Due', name: 'Due' }, { id: 'Overdue', name: 'Overdue' }];

    return (
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <input type="text" placeholder="Search by Invoice # or Customer name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input-search w-full !bg-gray-50 h-full" />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <DateRangePicker onDateChange={handleDateRangeChange} />
                <MultiSelectDropdown options={statusOptions} selectedValues={filters.status} onChange={(values) => handleFilterChange('status', values)} placeholder="Status" valueProp="id" />
                <MultiSelectDropdown options={dueStatusOptions} selectedValues={filters.dueStatus} onChange={(values) => handleFilterChange('dueStatus', values)} placeholder="Due Status" valueProp="id" />
                <MultiSelectDropdown options={entities} selectedValues={filters.entityId} onChange={(values) => handleFilterChange('entityId', values)} placeholder="Entity" />
                <MultiSelectDropdown options={customers} selectedValues={filters.customerId} onChange={(values) => handleFilterChange('customerId', values)} placeholder="Customer" />
                <MultiSelectDropdown options={partners.map(p => ({name: p.name, id: p.name}))} selectedValues={filters.partner} onChange={(values) => handleFilterChange('partner', values)} placeholder="Partner" />
            </div>
        </div>
    );
};

export default InvoiceFilters;