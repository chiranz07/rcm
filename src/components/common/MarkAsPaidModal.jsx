import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const MarkAsPaidModal = ({ isOpen, onClose, onConfirm, invoice, entities }) => {
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedBank, setSelectedBank] = useState('');
    const [totalAmountReceived, setTotalAmountReceived] = useState(invoice?.total || 0); // Manual Input
    const [tdsReceivable, setTdsReceivable] = useState(0); // Can be manual or default calculated
    const [gstTds, setGstTds] = useState(0); // Always calculated
    const [error, setError] = useState('');
    const [isTdsReceivableManuallyChanged, setIsTdsReceivableManuallyChanged] = useState(false); // Flag to track manual changes

    const entityOfInvoice = entities.find(e => e.id === invoice?.entityId);
    const bankAccount = entityOfInvoice?.bankDetails;

    // Initialize/reset states when modal opens or invoice changes
    useEffect(() => {
        if (bankAccount && bankAccount.accountNumber) {
            setSelectedBank(bankAccount.accountNumber);
        }
        setTotalAmountReceived(invoice?.total || 0);
        setTdsReceivable(0); // Default to 0 initially
        setGstTds(0);
        setIsTdsReceivableManuallyChanged(false); // Reset manual change flag
    }, [invoice, bankAccount]);

    // Effect to calculate TDS Receivable by default
    useEffect(() => {
        if (!isTdsReceivableManuallyChanged) {
            const total = Number(invoice?.total || 0);
            const received = Number(totalAmountReceived || 0);
            const calculatedTdsReceivable = total - received;
            setTdsReceivable(calculatedTdsReceivable >= 0 ? calculatedTdsReceivable : 0);
        }
    }, [totalAmountReceived, invoice?.total, isTdsReceivableManuallyChanged]);


    // Effect to calculate GST TDS (spillover)
    useEffect(() => {
        const total = Number(invoice?.total || 0);
        const received = Number(totalAmountReceived || 0);
        const tds = Number(tdsReceivable || 0);
        const calculatedGstTds = total - received - tds;
        setGstTds(calculatedGstTds >= 0 ? calculatedGstTds : 0);
    }, [totalAmountReceived, tdsReceivable, invoice?.total]);


    const handleConfirm = () => {
        if (!paymentDate) {
            setError('Please select a payment date.');
            return;
        }
        if (!selectedBank) {
            setError('Please select the bank account where payment was received.');
            return;
        }
        if (totalAmountReceived === '' || Number(totalAmountReceived) < 0) {
            setError('Please enter a valid amount received.');
            return;
        }
        if (tdsReceivable === '' || Number(tdsReceivable) < 0) {
            setError('Please enter a valid TDS Receivable amount.');
            return;
        }

        onConfirm(invoice.id, {
            paymentDate,
            bankAccount: selectedBank,
            totalAmountReceived: Number(totalAmountReceived),
            tdsReceivable: Number(tdsReceivable),
            gstTds: Number(gstTds)
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-50 p-4 pt-10">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Mark as Paid</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                </div>
                {error && <p className="text-red-600 text-xs mb-3 bg-red-50 p-2 rounded-md">{error}</p>}
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        You are marking invoice <span className="font-bold">{invoice?.invoiceNumber}</span> (Total: ₹{invoice?.total?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) as paid. Please provide the payment details.
                    </p>
                    <div>
                        <label className="form-label">Payment Received Date</label>
                        <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => { setPaymentDate(e.target.value); setError(''); }}
                            className="form-input-modal"
                        />
                    </div>
                    <div>
                        <label className="form-label">Total Amount Received</label>
                        <input
                            type="number"
                            value={totalAmountReceived}
                            onChange={(e) => { setTotalAmountReceived(e.target.value); setIsTdsReceivableManuallyChanged(false); setError(''); }}
                            className="form-input-modal"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label className="form-label">TDS Receivable</label>
                        <input
                            type="number"
                            value={tdsReceivable}
                            onChange={(e) => { setTdsReceivable(e.target.value); setIsTdsReceivableManuallyChanged(true); setError(''); }}
                            className="form-input-modal"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label className="form-label">GST TDS</label>
                        <input
                            type="number"
                            value={gstTds.toFixed(2)} // Display with 2 decimal places
                            className="form-input-modal bg-gray-100"
                            readOnly // GST TDS is calculated
                        />
                    </div>
                    <div>
                        <label className="form-label">Payment Received In</label>
                        <select
                            value={selectedBank}
                            onChange={(e) => { setSelectedBank(e.target.value); setError(''); }}
                            className="form-input-modal"
                            disabled={!bankAccount || !bankAccount.accountNumber}
                        >
                            {bankAccount && bankAccount.accountNumber ? (
                                <option value={bankAccount.accountNumber}>
                                    {bankAccount.bankName} - A/c No: {bankAccount.accountNumber}
                                </option>
                            ) : (
                                <option value="" disabled>No bank account configured for this entity</option>
                            )}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-200 transition font-semibold text-xs">Cancel</button>
                    <button onClick={handleConfirm} className="text-white px-4 py-1.5 rounded-md transition font-semibold shadow-sm text-xs" style={{ backgroundColor: '#2a3f50' }}>Confirm Payment</button>
                </div>
            </div>
        </div>
    );
};

export default MarkAsPaidModal;