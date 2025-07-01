import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

const ImportModal = ({ isOpen, onClose, onImport, requiredFields }) => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.type === 'application/vnd.ms-excel')) {
            setFile(selectedFile);
            setError('');
        } else {
            setFile(null);
            setError('Please select a valid Excel file (.xlsx or .xls)');
        }
    };

    const handleImportClick = () => {
        if (!file) {
            setError('Please select a file to import.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    setError('The selected file is empty or has no data rows.');
                    return;
                }

                const headers = jsonData[0];
                const missingFields = requiredFields.filter(field => !headers.includes(field));

                if (missingFields.length > 0) {
                    setError(`The following required columns are missing: ${missingFields.join(', ')}`);
                    return;
                }

                const dataToImport = jsonData.slice(1).map(row => {
                    const rowData = {};
                    headers.forEach((header, index) => {
                        rowData[header] = row[index];
                    });
                    return rowData;
                });

                onImport(dataToImport);
                onClose();
            } catch (err) {
                console.error("Error parsing file: ", err);
                setError('An error occurred while parsing the file. Please ensure it is a valid Excel file.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-50 p-4 pt-10">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Import Data</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                </div>
                {error && <p className="text-red-600 text-xs mb-3 bg-red-50 p-2 rounded-md">{error}</p>}
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Select an Excel file (.xlsx or .xls) to import. The first row of the sheet should contain the headers.
                        Required headers are: <span className="font-semibold">{requiredFields.join(', ')}</span>.
                    </p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".xlsx, .xls"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            {file ? (
                                <div className="flex items-center justify-center text-gray-700">
                                    <FileText size={24} className="mr-2" />
                                    <span>{file.name}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-500">
                                    <Upload size={32} />
                                    <span className="mt-2">Click to select a file</span>
                                </div>
                            )}
                        </label>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-200 transition font-semibold text-xs">Cancel</button>
                    <button onClick={handleImportClick} className="text-white px-4 py-1.5 rounded-md transition font-semibold shadow-sm text-xs" style={{ backgroundColor: '#2a3f50' }}>Import</button>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;