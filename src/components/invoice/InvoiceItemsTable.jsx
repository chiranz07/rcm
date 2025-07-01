import React, { useRef, useEffect } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { gstRates } from '../../constants';
import DataSearchableDropdown from '../common/DataSearchableDropdown';

const InvoiceItemsTable = ({ items, handleItemChange, handleProductSelection, addItem, removeItem, isGstApplicable, formatIndianCurrency, products, errors }) => {
    const lastItemRef = useRef(null);

    useEffect(() => {
        if (lastItemRef.current) {
            lastItemRef.current.focus();
        }
    }, [items.length]);

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Items</h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                        <tr>
                            <th className="p-2 text-left font-semibold text-gray-600 text-sm">Item</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-600 text-sm w-24">Qty</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-600 text-sm w-32">Rate</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-600 text-sm w-32">Discount</th>
                            {isGstApplicable && <th className="px-2 py-2 text-center font-semibold text-gray-600 text-sm w-28">GST</th>}
                            <th className="px-2 py-2 text-right font-semibold text-gray-600 text-sm w-36">Amount</th>
                            <th className="p-2 w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <React.Fragment key={index}>
                                <tr className="border-b border-gray-100 last:border-b-0">
                                    <td className="p-2 align-top">
                                        <DataSearchableDropdown
                                            ref={index === items.length - 1 ? lastItemRef : null}
                                            options={products}
                                            value={item.description}
                                            onChange={(selectedProduct) => handleProductSelection(index, selectedProduct)}
                                            placeholder="Select or type..."
                                            displayProp="name"
                                            valueProp="name"
                                            error={errors[index]?.description}
                                        />
                                    </td>
                                    <td className="p-2 align-top"><input type="number" name="quantity" min="0" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="form-input w-full text-right no-arrows" required/></td>
                                    <td className="p-2 align-top"><input type="text" name="rate" value={item.rate ? item.rate.toLocaleString('en-IN') : ''} onChange={(e) => handleItemChange(index, e)} className={`form-input w-full text-right ${errors[index]?.rate ? 'border-red-500' : ''}`} required/></td>
                                    <td className="p-2 align-top"><input type="text" name="discount" value={item.discount ? item.discount.toLocaleString('en-IN') : ''} onChange={(e) => handleItemChange(index, e)} className={`form-input w-full text-right ${errors[index]?.discount ? 'border-red-500' : ''}`}/></td>
                                    {isGstApplicable && (<td className="p-2 align-top">
                                        <select
                                            name="gstRate"
                                            value={item.gstRate}
                                            onChange={(e) => handleItemChange(index, e)}
                                            className="form-input w-full pl-3 pr-10 text-center"
                                        >
                                            {gstRates.map(rate => <option key={rate} value={rate}>{rate}%</option>)}
                                        </select>
                                    </td>)}
                                    <td className="p-2 text-right font-medium text-gray-800 align-top pt-4">₹{formatIndianCurrency((Number(item.quantity) * Number(item.rate)) - Number(item.discount || 0))}</td>
                                    <td className="p-2 text-center align-top pt-3"><button type="button" onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50"><X size={16}/></button></td>
                                </tr>
                                {(errors[index]?.description || errors[index]?.rate || errors[index]?.discount) && (
                                     <tr>
                                        <td colSpan={isGstApplicable ? 7 : 6} className="pt-0 pb-2 px-2">
                                            <div className="text-red-600 text-xs p-2 flex items-center gap-2">
                                                <AlertCircle size={14} />
                                                {errors[index].description || errors[index].rate || errors[index].discount}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <button type="button" onClick={addItem} className="mt-4 bg-blue-50 text-primary px-4 py-2 rounded-lg hover:bg-blue-100 transition text-sm font-semibold flex items-center gap-2"><Plus size={16}/> Add Line Item</button>
        </div>
    );
};

export default InvoiceItemsTable;