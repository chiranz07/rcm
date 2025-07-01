import React from 'react';

const InvoiceTotals = ({ totals, isGstApplicable, gstType, formatIndianCurrency }) => {
    return (
        <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between items-center"><span className="text-gray-500">Gross Total:</span><span className="font-medium text-gray-800">₹{formatIndianCurrency(totals.grossTotal)}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">Discount:</span><span className="font-medium text-red-500">-₹{formatIndianCurrency(totals.totalDiscount)}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-dashed"><span className="text-gray-500">Taxable Amount:</span><span className="font-medium text-gray-800">₹{formatIndianCurrency(totals.taxableTotal)}</span></div>

                {isGstApplicable && (
                    gstType === 'IGST' ? (
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-500">IGST:</span>
                            <span className="font-medium text-gray-800">₹{formatIndianCurrency(totals.igst)}</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-gray-500">CGST:</span>
                                <span className="font-medium text-gray-800">₹{formatIndianCurrency(totals.cgst)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">SGST:</span>
                                <span className="font-medium text-gray-800">₹{formatIndianCurrency(totals.sgst)}</span>
                            </div>
                        </>
                    )
                )}

                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-800">
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-gray-900">₹{formatIndianCurrency(totals.total)}</span>
                </div>
            </div>
        </div>
    );
};

export default InvoiceTotals;