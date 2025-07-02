export const placeOfSupplyOptions = [
    { code: "01", name: "Jammu & Kashmir" }, { code: "02", name: "Himachal Pradesh" },
    { code: "03", name: "Punjab" }, { code: "04", name: "Chandigarh" },
    { code: "05", name: "Uttarakhand" }, { code: "06", name: "Haryana" },
    { code: "07", name: "Delhi" }, { code: "08", name: "Rajasthan" },
    { code: "09", name: "Uttar Pradesh" }, { code: "10", name: "Bihar" },
    { code: "11", name: "Sikkim" }, { code: "12", name: "Arunachal Pradesh" },
    { code: "13", name: "Nagaland" }, { code: "14", name: "Manipur" },
    { code: "15", name: "Mizoram" }, { code: "16", name: "Tripura" },
    { code: "17", name: "Meghalaya" }, { code: "18", name: "Assam" },
    { code: "19", name: "West Bengal" }, { code: "20", name: "Jharkhand" },
    { code: "21", name: "Odisha" }, { code: "22", name: "Chhattisgarh" },
    { code: "23", "name": "Madhya Pradesh" }, { code: "24", name: "Gujarat" },
    { code: "25", name: "Daman & Diu" }, { code: "26", name: "Dadra & Nagar Haveli" },
    { code: "27", name: "Maharashtra" }, { code: "28", name: "Andhra Pradesh (pre-division)" },
    { code: "29", name: "Karnataka" }, { code: "30", name: "Goa" },
    { code: "31", name: "Lakshadweep" }, { code: "32", name: "Kerala" },
    { code: "33", name: "Tamil Nadu" }, { code: "34", name: "Puducherry" },
    { code: "35", name: "Andaman & Nicobar Islands" }, { code: "36", name: "Telangana" },
    { code: "37", name: "Andhra Pradesh (post-division)" }, { code: "38", name: "Ladakh" },
    { code: 'EX', name: 'Export' },{ code: 'SEZ', name: 'SEZ' }
];

export const gstRates = [0, 5, 12, 18, 28];

export const initialEntityState = {
    name: '',
    gstin: '',
    pan: '',
    email: '',
    phone: '',
    placeOfSupply: '',
    isGstRegistered: 'Yes',
    address: { line1: '', line2: '', city: '', state: '', pincode: '', country: '' },
    invoicePrefix: 'INV-',
    nextInvoiceNumber: 1,
    bankDetails: {
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: ''
    },
    msmeNo: '', // New field for MSME No.
    lut: '' // New field for LUT
};

export const initialCustomerState = { name: '', email: '', phone: '', gstin: '', pan: '', isGstRegistered: 'No', placeOfSupply: '', address: { line1: '', line2: '', city: '', state: '', pincode: '', country: '' }};