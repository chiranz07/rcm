import React from 'react';
import { X } from 'lucide-react';

const FormModal = ({ title, error, onClose, onSubmit, children }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-50 p-4 pt-10">
        <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-xl border max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            {error && <p className="text-red-600 text-xs mb-3 bg-red-50 p-2 rounded-md">{error}</p>}
            <form onSubmit={onSubmit}>
                <div className="space-y-4">{children}</div>
                <div className="mt-6 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-200 transition font-semibold text-xs">Cancel</button>
                    <button type="submit" className="text-white px-4 py-1.5 rounded-md transition font-semibold shadow-sm text-xs" style={{ backgroundColor: '#2a3f50' }}>Submit</button>
                </div>
            </form>
        </div>
    </div>
);

export default FormModal;