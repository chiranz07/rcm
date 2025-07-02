import { useState, useEffect } from 'react';

const initialInvoiceState = {
    type: 'Invoice',
    entityId: '',
    customerId: '',
    partner: '',
    paymentTerms: 10, // Modified default from 30 to 10
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    items: [{ description: '', amount: 0, gstRate: 18, hsn: '' }], // Removed quantity, rate, discount; added amount
    gstType: 'IGST',
    narration: '', // New field for narration
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
            if (item.amount === '' || item.amount === null || Number(item.amount) <= 0) itemError.amount = "Amount must be greater than zero.";

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
                if (name === 'amount') {
                    processedValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
                }
                return { ...item, [name]: processedValue };
            }
            return item;
        });
        setInvoice(prev => ({ ...prev, items: nextItems }));

        // Clear specific item error if it exists for the changed field
        setErrors(prevErrors => {
            if (prevErrors.items && prevErrors.items[index] && prevErrors.items[index][name]) {
                const newItemsErrors = { ...prevErrors.items };
                const newItemError = { ...newItemsErrors[index] };
                delete newItemError[name];
                if (Object.keys(newItemError).length === 0) {
                    delete newItemsErrors[index];
                } else {
                    newItemsErrors[index] = newItemError;
                }
                return { ...prevErrors, items: newItemsErrors };
            }
            return prevErrors;
        });
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

    const addItem = () => setInvoice(prev => ({ ...prev, items: [...prev.items, { description: '', amount: 0, gstRate: 18, hsn: '' }] }));

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