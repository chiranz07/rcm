import React from 'react';
import DataSearchableDropdown from '../common/DataSearchableDropdown';
import { useAppContext } from '../../context/AppContext';

const InvoiceFormHeader = ({ invoice, handleInvoiceDataChange, entities, customers, errors, isProformaDisabled, isConverting = false }) => {
    const { partners } = useAppContext();
    return (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-x-5 gap-y-5">
            <div className="md:col-span-3">
                <label className="form-label">Billing From (Entity)</label>
                <DataSearchableDropdown
                    options={entities}
                    value={invoice.entityId}
                    onChange={(selected) => handleInvoiceDataChange({ target: { name: 'entityId', value: selected.id } })}
                    placeholder="Select your entity"
                    error={errors.entityId}
                    disabled={isConverting}
                />
                {errors.entityId && <p className="text-red-500 text-xs mt-1">{errors.entityId}</p>}
            </div>
            <div className="md:col-span-3">
                <label className="form-label">Billing To (Customer)</label>
                <DataSearchableDropdown
                    options={customers}
                    value={invoice.customerId}
                    onChange={(selected) => handleInvoiceDataChange({ target: { name: 'customerId', value: selected.id } })}
                    placeholder="Select a customer"
                    error={errors.customerId}
                    disabled={isConverting}
                />
                {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>}
            </div>

            <div className="md:col-span-2">
                <label className="form-label text-xs">Invoice #</label>
                <input type="text" name="invoiceNumber" value={invoice.invoiceNumber} className="form-input bg-gray-100" readOnly/>
            </div>
            <div className="md:col-span-2">
                <label className="form-label text-xs">Invoice Date</label>
                <input type="date" name="invoiceDate" value={invoice.invoiceDate} onChange={handleInvoiceDataChange} className={`form-input ${errors.invoiceDate ? 'border-red-500' : ''}`} required disabled={isConverting}/>
                {errors.invoiceDate && <p className="text-red-500 text-xs mt-1">{errors.invoiceDate}</p>}
            </div>
            <div className="md:col-span-2">
                <label className="form-label text-xs">Payment Terms (Days)</label>
                <input type="number" name="paymentTerms" value={invoice.paymentTerms} onChange={handleInvoiceDataChange} placeholder="e.g., 30" className={`form-input no-arrows ${errors.paymentTerms ? 'border-red-500' : ''}`} required disabled={isConverting}/>
                {errors.paymentTerms && <p className="text-red-500 text-xs mt-1">{errors.paymentTerms}</p>}
            </div>

            <div className="md:col-span-2">
                <label className="form-label text-xs">Due Date</label>
                <input type="date" name="dueDate" value={invoice.dueDate} className="form-input bg-gray-100" readOnly/>
            </div>
            <div className="md:col-span-2">
                <label className="form-label">Partner</label>
                <DataSearchableDropdown
                    options={partners.map(p => ({ id: p.name, name: p.name }))}
                    value={invoice.partner}
                    onChange={(selected) => handleInvoiceDataChange({ target: { name: 'partner', value: selected.name } })}
                    placeholder="Select a partner"
                    error={errors.partner}
                    displayProp="name"
                    valueProp="name"
                    disabled={isConverting}
                />
                {errors.partner && <p className="text-red-500 text-xs mt-1">{errors.partner}</p>}
            </div>
            <div className="md:col-span-2 self-end">
                <label className="form-label">Invoice Type</label>
                <div className="flex items-center gap-6 h-10">
                    <label className="flex items-center text-sm text-gray-700"><input type="radio" name="type" value="Invoice" checked={invoice.type === 'Invoice'} onChange={handleInvoiceDataChange} className="form-radio" disabled={isConverting}/>Invoice</label>
                    <label className={`flex items-center text-sm text-gray-700 ${isProformaDisabled || isConverting ? 'cursor-not-allowed opacity-50' : ''}`}>
                        <input type="radio" name="type" value="Proforma" checked={invoice.type === 'Proforma'} onChange={handleInvoiceDataChange} className="form-radio" disabled={isProformaDisabled || isConverting} />
                        Proforma
                    </label>
                </div>
            </div>
            {/* New Narration Field */}
            <div className="md:col-span-6">
                <label className="form-label text-xs">Narration</label>
                <textarea
                    name="narration"
                    value={invoice.narration}
                    onChange={handleInvoiceDataChange}
                    placeholder="Add any additional notes or narration here..."
                    rows="3"
                    className="form-input"
                ></textarea>
            </div>
        </div>
    );
};

export default InvoiceFormHeader;