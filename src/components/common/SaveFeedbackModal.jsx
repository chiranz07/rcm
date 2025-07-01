import React from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const SaveFeedbackModal = ({ status, message, onClose }) => {
    let icon;
    let title;
    let colorClass;

    switch (status) {
        case 'loading':
            icon = <Loader size={64} className="text-blue-500 animate-spin" />;
            title = 'Processing...'; // Changed to be more generic
            colorClass = 'text-gray-700';
            break;
        case 'success':
            icon = <CheckCircle size={64} className="text-green-500" />;
            title = 'Success!';
            colorClass = 'text-green-700';
            break;
        case 'error':
            icon = <XCircle size={64} className="text-red-500" />;
            title = 'Error!';
            colorClass = 'text-red-700';
            break;
        default:
            return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-xs border flex flex-col items-center text-center">
                <div className="mb-4">{icon}</div>
                <h3 className={`text-xl font-bold ${colorClass}`}>{title}</h3>
                {message && <p className="text-sm text-gray-600 mt-2 mb-6">{message}</p>}
                {status === 'error' && (
                    <button
                        onClick={onClose}
                        className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition font-semibold text-sm mt-4"
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
};

export default SaveFeedbackModal;