import { useState, useEffect } from 'react';

const initialInvoiceState = {
    type: 'Invoice',
    entityId: '',
    customerId: '',
    partner: '',
    paymentTerms: 30,
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    items: [{ description: '', quantity: 1, rate: 0, discount: 0, gstRate: 18, hsn: '' }],
    gstType: 'IGST',
};

export const useInvoiceForm = (existingInvoice, entities, customers) => {
    const [invoice, setInvoice] = useState(initialInvoiceState);
    const [errors, setErrors] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [isGstApplicable, setIsGstApplicable] = useState(true);

    useEffect(() => {
        if (existingInvoice) {
            setIsEditing(true);
            setInvoice(prev => ({ ...initialInvoiceState, ...existingInvoice }));
        } else {
            setIsEditing(false);
            setInvoice(initialInvoiceState);
        }
    }, [existingInvoice]);

    const validate = () => {
        const newErrors = {};
        const itemErrors = {};

        if (!invoice.entityId) newErrors.entityId = "An entity is required.";
        if (!invoice.customerId) newErrors.customerId = "A customer is required.";
        if (!invoice.invoiceDate) newErrors.invoiceDate = "Invoice date is required.";
        if (invoice.paymentTerms === '' || invoice.paymentTerms === null) newErrors.paymentTerms = "Payment terms are required.";
        if (!invoice.partner) newErrors.partner = "A partner is required.";

        invoice.items.forEach((item, index) => {
            const itemError = {};
            if (!item.description.trim()) itemError.description = "Item description is required.";
            if (!item.rate || Number(item.rate) <= 0) itemError.rate = "Rate must be greater than zero.";

            const rate = parseFloat(item.rate) || 0;
            const discount = parseFloat(item.discount) || 0;
            if (discount >= rate && rate > 0) {
                 itemError.discount = `Discount (₹${discount}) must be less than the rate (₹${rate}).`;
            }

            if (Object.keys(itemError).length > 0) {
                itemErrors[index] = itemError;
            }
        });

        if (Object.keys(itemErrors).length > 0) newErrors.items = itemErrors;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleInvoiceDataChange = (e) => {
        setInvoice(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if(errors[e.target.name]) {
            setErrors(prev => ({...prev, [e.target.name]: null}))
        }
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const nextItems = invoice.items.map((item, i) => {
            if (i === index) {
                let processedValue = value;
                if (name === 'rate' || name === 'discount') {
                    processedValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
                } else if (name === 'quantity') {
                    const num = parseInt(value, 10);
                    processedValue = isNaN(num) ? 1 : Math.max(0, num);
                }
                return { ...item, [name]: processedValue };
            }
            return item;
        });
        setInvoice(prev => ({ ...prev, items: nextItems }));
    };

    const handleProductSelection = (index, product) => {
        const nextItems = invoice.items.map((item, i) => {
            if (i === index) {
                return {
                    ...item,
                    description: product.name,
                    hsn: product.hsn || ''
                };
            }
            return item;
        });
        setInvoice(prev => ({ ...prev, items: nextItems }));
    };

    const addItem = () => setInvoice(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, rate: 0, discount: 0, gstRate: 18, hsn: '' }] }));

    const removeItem = (index) => {
        setInvoice(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
        setErrors(prev => {
            const newErrors = {...prev};
            if(newErrors.items) delete newErrors.items[index];
            return newErrors;
        })
    };

    useEffect(() => {
        const terms = parseInt(invoice.paymentTerms, 10);
        if (invoice.invoiceDate && !isNaN(terms) && terms >= 0 && terms <= 10000) {
            const date = new Date(invoice.invoiceDate);
            date.setDate(date.getDate() + terms);
            setInvoice(prev => ({ ...prev, dueDate: date.toISOString().slice(0, 10) }));
        }
    }, [invoice.invoiceDate, invoice.paymentTerms]);

    useEffect(() => {
        const selectedEntity = entities.find(e => e.id === invoice.entityId);
        const selectedCustomer = customers.find(c => c.id === invoice.customerId);
        const updates = {};

        if (selectedEntity) {
            const isGstReg = selectedEntity.isGstRegistered === 'Yes';
            setIsGstApplicable(isGstReg);
            if (!isGstReg) {
                updates.type = 'Invoice';
            }

            if (!isEditing) {
                const nextNumber = selectedEntity.nextInvoiceNumber || 1;
                const prefix = selectedEntity.invoicePrefix || 'INV-';
                const paddedNumber = String(nextNumber).padStart(3, '0');
                updates.invoiceNumber = `${prefix}${paddedNumber}`;
            }
        }

        if (selectedEntity && selectedCustomer) {
            updates.gstType = selectedEntity.placeOfSupply === selectedCustomer.placeOfSupply
                ? 'CGST/SGST'
                : 'IGST';
        }

        if (Object.keys(updates).length > 0) {
            setInvoice(prev => ({ ...prev, ...updates }));
        }
    }, [invoice.entityId, invoice.customerId, entities, customers, isEditing]);

    return {
        invoice,
        setInvoice,
        isEditing,
        errors,
        validate,
        handleInvoiceDataChange,
        handleItemChange,
        handleProductSelection,
        addItem,
        removeItem,
        isGstApplicable
    };
};