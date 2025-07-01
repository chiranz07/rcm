import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const MarkAsPaidModal = ({ isOpen, onClose, onConfirm, invoice, entities }) => {
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedBank, setSelectedBank] = useState('');
    const [error, setError] = useState('');

    const entityOfInvoice = entities.find(e => e.id === invoice?.entityId);
    const bankAccount = entityOfInvoice?.bankDetails;

    useEffect(() => {
        // Pre-select the bank account if there is only one
        if (bankAccount && bankAccount.accountNumber) {
            setSelectedBank(bankAccount.accountNumber);
        }
    }, [invoice]);

    const handleConfirm = () => {
        if (!paymentDate) {
            setError('Please select a payment date.');
            return;
        }
        if (!selectedBank) {
            setError('Please select the bank account where payment was received.');
            return;
        }
        onConfirm(invoice.id, { paymentDate, bankAccount: selectedBank });
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
                        You are marking invoice <span className="font-bold">{invoice?.invoiceNumber}</span> as paid. Please provide the payment details.
                    </p>
                    <div>
                        <label className="form-label">Payment Received Date</label>
                        <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="form-input-modal"
                        />
                    </div>
                    <div>
                        <label className="form-label">Payment Received In</label>
                        <select
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
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