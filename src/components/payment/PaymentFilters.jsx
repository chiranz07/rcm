import React from 'react';
import MultiSelectDropdown from '../common/MultiSelectDropdown';
import DateRangePicker from '../common/DateRangePicker';

const PaymentFilters = ({ filters, handleFilterChange, handleDateRangeChange, customers }) => {

    return (
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <DateRangePicker onDateChange={handleDateRangeChange} />
                <MultiSelectDropdown
                    options={customers}
                    selectedValues={filters.customerId}
                    onChange={(values) => handleFilterChange('customerId', values)}
                    placeholder="Customer"
                />
            </div>
        </div>
    );
};

export default PaymentFilters;