import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Registering the custom font
import RobotoRegular from '../fonts/Roboto-Regular.ttf';
import RobotoBold from '../fonts/Roboto-Bold.ttf';

Font.register({
    family: 'Roboto',
    fonts: [
        { src: RobotoRegular },
        { src: RobotoBold, fontWeight: 'bold' },
    ],
});

// Utility to format numbers with Indian comma style
const formatCurrency = (num = 0) => {
    return Number(num).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Roboto',
        fontSize: 10,
        padding: 40,
        color: '#000',
    },
    header: {
        textAlign: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        textDecoration: 'underline',
        fontFamily: 'Roboto',
    },
    mainContainer: {
        borderTop: 1,
        borderLeft: 1,
        borderRight: 1,
    },
    addressContainer: {
        flexDirection: 'row',
        borderBottom: 1,
    },
    address: {
        width: '50%',
        padding: 5,
    },
    leftAddress: {
        borderRight: 1,
    },
    addressHeader: {
        fontWeight: 'bold',
        fontFamily: 'Roboto',
        marginBottom: 5,
        fontSize: 9,
    },
    addressText: {
        fontSize: 9,
        marginBottom: 2,
    },
    invoiceInfoContainer: {
        flexDirection: 'row',
        borderBottom: 1,
    },
    invoiceInfoColumn: {
        width: '50%',
        padding: 5,
        flexDirection: 'row',
    },
    leftInfoCol: {
        borderRight: 1
    },
    infoLabel: {
        fontWeight: 'bold',
        fontFamily: 'Roboto',
        fontSize: 9,
        width: 70,
    },
    infoValue: {
        fontSize: 9,
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderRight: 1,
        borderLeft: 1,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    tableColHeader: {
        backgroundColor: '#f2f2f2',
        padding: 4,
        borderRightWidth: 1,
    },
    tableCol: {
        padding: 4,
        borderRightWidth: 1,
    },
    tableCellHeader: {
        fontSize: 9,
        fontWeight: 'bold',
        fontFamily: 'Roboto',
        textAlign: 'center',
    },
    tableCell: {
        fontSize: 9,
    },
    textRight: {
        textAlign: 'right',
    },
    textCenter: {
        textAlign: 'center',
    },
    totals: {
        borderLeft: 1,
        borderRight: 1,
        borderBottom: 1,
        flexDirection: 'row',
    },
    amountInWords: {
        width: '60%',
        padding: 4,
        borderRightWidth: 1,
    },
    totalsData: {
        width: '40%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 4,
        borderBottomWidth: 1,
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 4,
        backgroundColor: '#f2f2f2'
    },
    summaryTable: {
        marginTop: 10,
        borderWidth: 1,
        display: 'table',
        width: 'auto',
    },
    narrationContainer: {
        marginTop: 10,
        padding: 5,
        borderWidth: 1,
        borderColor: '#000',
    },
    narrationHeader: {
        fontFamily: 'Roboto',
        fontWeight: 'bold',
        fontSize: 10,
        marginBottom: 3,
    },
    narrationText: {
        fontSize: 9,
    },
    bottomContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    bankDetails: {
        width: '55%',
        paddingTop: 10,
    },
    bankDetailsHeader: {
        fontFamily: 'Roboto',
        fontWeight: 'bold',
        fontSize: 11,
        marginBottom: 4,
    },
    bankDetailsText: {
        fontSize: 10,
        marginBottom: 2,
    },
    signatory: {
        width: '40%',
        textAlign: 'right',
        marginTop: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#555'
    },
    bold: {
        fontWeight: 'bold',
        fontFamily: 'Roboto',
    }
});

const numberToWords = (num) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; var str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return 'INR ' + str.trim().split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') + ' Only';
};

const getTaxSummary = (invoice) => {
    const summary = {};
    invoice.items.forEach(item => {
        const key = `${item.gstRate || 0}|${item.hsn || ''}`;
        if (!summary[key]) {
            summary[key] = {
                rate: item.gstRate || 0,
                hsn: item.hsn || '',
                taxableValue: 0,
                cgst: 0,
                sgst: 0,
                igst: 0
            };
        }
        const itemTaxable = Number(item.amount) || 0;
        summary[key].taxableValue += itemTaxable;

        if (invoice.gstType === 'IGST') {
            summary[key].igst += itemTaxable * (summary[key].rate / 100);
        } else {
            summary[key].cgst += itemTaxable * (summary[key].rate / 2 / 100);
            summary[key].sgst += itemTaxable * (summary[key].rate / 2 / 100);
        }
    });
    return Object.values(summary);
}


const InvoicePDF = ({ invoice, customer, entity }) => {
    const showGst = invoice.isGstApplicable;
    const taxSummaryData = showGst ? getTaxSummary(invoice) : [];
    const displayTotal = invoice.type === 'Proforma' ? (invoice.taxableTotal || 0) : (invoice.total || 0);
    const amountInWords = numberToWords(Math.round(displayTotal));

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                <View style={styles.header}>
                    <Text style={styles.title}>{invoice.type === 'Proforma' ? 'Proforma Invoice' : 'Tax Invoice'}</Text>
                </View>

                <View style={styles.mainContainer}>
                    <View style={styles.addressContainer}>
                        <View style={[styles.address, styles.leftAddress]}>
                            <Text style={styles.bold}>{entity?.name}</Text>
                            <Text style={styles.addressText}>{entity?.address?.line1}</Text>
                            <Text style={styles.addressText}>{`${entity?.address?.city} ${entity?.address?.pincode}`}</Text>
                            <Text style={styles.addressText}>{entity?.address?.state?.toUpperCase()}, INDIA</Text>
                            <Text style={styles.addressText}><Text style={styles.bold}>GSTIN:</Text> {entity?.gstin || 'N/A'}</Text>
                            {entity?.msmeNo && <Text style={styles.addressText}><Text style={styles.bold}>MSME No:</Text> {entity.msmeNo}</Text>} {/* Added MSME No. */}
                            {entity?.lut && <Text style={styles.addressText}><Text style={styles.bold}>LUT:</Text> {entity.lut}</Text>} {/* Added LUT */}
                            <Text style={styles.addressText}><Text style={styles.bold}>E-Mail:</Text> {entity?.email}</Text>
                        </View>

                        <View style={styles.address}>
                            <Text style={styles.addressHeader}>Buyer (Bill to)</Text>
                            <Text style={styles.bold}>{customer?.name}</Text>
                            <Text style={styles.addressText}>{customer?.address?.line1}</Text>
                            <Text style={styles.addressText}>{`${customer?.address?.city} ${customer?.address?.pincode}`}</Text>
                            <Text style={styles.addressText}>{customer?.address?.state?.toUpperCase()}, INDIA</Text>
                            <Text style={styles.addressText}><Text style={styles.bold}>GSTIN/UIN:</Text> {customer?.gstin || 'N/A'}</Text>
                            <Text style={styles.addressText}><Text style={styles.bold}>Place of Supply:</Text> {customer?.placeOfSupply}</Text>
                        </View>
                    </View>

                    <View style={styles.invoiceInfoContainer}>
                        <View style={[styles.invoiceInfoColumn, styles.leftInfoCol]}>
                            <Text style={styles.infoLabel}>Invoice No.</Text>
                            <Text style={styles.infoValue}>: {invoice.invoiceNumber}</Text>
                        </View>
                        <View style={styles.invoiceInfoColumn}>
                            <Text style={styles.infoLabel}>Dated</Text>
                            <Text style={styles.infoValue}>: {new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <View style={{ ...styles.tableColHeader, width: '6%' }}><Text style={styles.tableCellHeader}>Sl No.</Text></View>
                        <View style={{ ...styles.tableColHeader, width: '54%' }}><Text style={styles.tableCellHeader}>Description of Goods</Text></View>
                        <View style={{ ...styles.tableColHeader, width: '15%' }}><Text style={styles.tableCellHeader}>HSN/SAC</Text></View>
                        <View style={{ ...styles.tableColHeader, width: '25%', borderRightWidth: 0 }}><Text style={styles.tableCellHeader}>Amount</Text></View>
                    </View>
                    {invoice.items.map((item, i) => (
                        <View key={i} style={{...styles.tableRow, borderBottomWidth: 1}}>
                            <View style={{ ...styles.tableCol, width: '6%', ...styles.textCenter }}><Text style={styles.tableCell}>{i + 1}</Text></View>
                            <View style={{ ...styles.tableCol, width: '54%' }}><Text style={styles.tableCell}>{item.description}</Text></View>
                            <View style={{ ...styles.tableCol, width: '15%', ...styles.textCenter }}><Text style={styles.tableCell}>{item.hsn || 'N/A'}</Text></View>
                            <View style={{ ...styles.tableCol, width: '25%', ...styles.textRight, borderRightWidth: 0 }}><Text style={styles.tableCell}>{formatCurrency(item.amount)}</Text></View>
                        </View>
                    ))}
                </View>

                <View style={styles.totals}>
                    <View style={styles.amountInWords}>
                        <Text style={{...styles.bold, fontSize: 9}}>Amount Chargeable (in words)</Text>
                        <Text style={{fontSize: 9, marginTop: 4}}>{amountInWords}</Text>
                    </View>
                    <View style={styles.totalsData}>
                        <View style={styles.totalRow}><Text style={styles.tableCell}>Taxable Amount</Text><Text style={[styles.tableCell, styles.textRight]}>₹{formatCurrency(invoice.taxableTotal)}</Text></View>
                        {showGst && invoice.cgst > 0 && <View style={styles.totalRow}><Text style={styles.tableCell}>CGST</Text><Text style={[styles.tableCell, styles.textRight]}>₹{formatCurrency(invoice.cgst)}</Text></View>}
                        {showGst && invoice.sgst > 0 && <View style={styles.totalRow}><Text style={styles.tableCell}>SGST</Text><Text style={[styles.tableCell, styles.textRight]}>₹{formatCurrency(invoice.sgst)}</Text></View>}
                        {showGst && invoice.igst > 0 && <View style={styles.totalRow}><Text style={styles.tableCell}>IGST</Text><Text style={[styles.tableCell, styles.textRight]}>₹{formatCurrency(invoice.igst)}</Text></View>}
                        <View style={styles.grandTotalRow}><Text style={[styles.bold, styles.tableCell]}>TOTAL</Text><Text style={[styles.tableCell, styles.textRight, styles.bold]}>₹{formatCurrency(displayTotal)}</Text></View>
                    </View>
                </View>

                {showGst && <View style={styles.summaryTable}>
                    <View style={{...styles.tableRow, backgroundColor: '#f2f2f2'}}>
                        <View style={{...styles.tableColHeader, width: '25%'}}><Text style={styles.tableCellHeader}>HSN/SAC</Text></View>
                        <View style={{...styles.tableColHeader, width: '25%'}}><Text style={styles.tableCellHeader}>Taxable Value</Text></View>
                        <View style={{...styles.tableColHeader, width: '25%'}}><Text style={styles.tableCellHeader}>{invoice.gstType === 'IGST' ? 'IGST Amount' : 'CGST Amount'}</Text></View>
                        <View style={{...styles.tableColHeader, width: '25%', borderRightWidth: 0}}><Text style={styles.tableCellHeader}>{invoice.gstType === 'IGST' ? '' : 'SGST Amount'}</Text></View>
                    </View>
                    {taxSummaryData.map((tax, i) => (
                        <View key={i} style={{...styles.tableRow, borderBottomWidth: 1}}>
                            <View style={{...styles.tableCol, width: '25%', ...styles.textCenter}}><Text style={styles.tableCell}>{tax.hsn || 'N/A'}</Text></View>
                            <View style={{...styles.tableCol, width: '25%', ...styles.textRight}}><Text style={styles.tableCell}>{formatCurrency(tax.taxableValue)}</Text></View>
                            <View style={{...styles.tableCol, width: '25%', ...styles.textRight}}><Text style={styles.tableCell}>{invoice.gstType === 'IGST' ? formatCurrency(tax.igst) : formatCurrency(tax.cgst)}</Text></View>
                            <View style={{...styles.tableCol, width: '25%', ...styles.textRight, borderRightWidth: 0}}><Text style={styles.tableCell}>{invoice.gstType === 'IGST' ? '' : formatCurrency(tax.sgst)}</Text></View>
                        </View>
                    ))}
                    <View style={{...styles.tableRow, backgroundColor: '#f2f2f2', borderBottomWidth: 0}}>
                        <View style={{...styles.tableCol, width: '25%', ...styles.bold, borderRightWidth: 1}}><Text style={styles.tableCell}>Total</Text></View>
                        <View style={{...styles.tableCol, width: '25%', ...styles.textRight, ...styles.bold, borderRightWidth: 1}}><Text style={styles.tableCell}>{formatCurrency(invoice.taxableTotal)}</Text></View>
                        <View style={{...styles.tableCol, width: '25%', ...styles.textRight, ...styles.bold, borderRightWidth: 1}}><Text style={styles.tableCell}>{invoice.gstType === 'IGST' ? formatCurrency(invoice.igst) : formatCurrency(invoice.cgst)}</Text></View>
                        <View style={{...styles.tableCol, width: '25%', ...styles.textRight, borderRightWidth: 0, ...styles.bold}}><Text style={styles.tableCell}>{invoice.gstType === 'IGST' ? '' : formatCurrency(invoice.sgst)}</Text></View>
                    </View>
                </View>}

                {/* Narration Section */}
                {invoice.narration && (
                    <View style={styles.narrationContainer}>
                        <Text style={styles.narrationHeader}>Narration:</Text>
                        <Text style={styles.narrationText}>{invoice.narration}</Text>
                    </View>
                )}

                <View style={styles.bottomContainer}>
                    <View style={styles.bankDetails}>
                        <Text style={styles.bankDetailsHeader}>Bank Details</Text>
                        <Text style={styles.bankDetailsText}>A/c Holder: {entity?.bankDetails?.accountHolderName}</Text>
                        <Text style={styles.bankDetailsText}>Bank Name: {entity?.bankDetails?.bankName}</Text>
                        <Text style={styles.bankDetailsText}>A/c No: {entity?.bankDetails?.accountNumber}</Text>
                        <Text style={styles.bankDetailsText}>IFSC Code: {entity?.bankDetails?.ifscCode}</Text>
                    </View>
                    <View style={styles.signatory}>
                        <Text style={{...styles.bold, marginBottom: 40}}>for {entity?.name}</Text>
                        <Text style={styles.bold}>Authorised Signatory</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text>This is a Computer Generated Invoice</Text>
                </View>

            </Page>
        </Document>
    )
};

export default InvoicePDF;