import React from 'react';

const GlobalStyles = () => (
    <style>{`
        /* --- Base Form Input Styles --- */
        .form-input, .form-input-modal, .form-input-create, .form-input-compact { 
            width: 100%; 
            padding: 0.5rem 0.75rem; 
            border: 1px solid #9ca3af; 
            border-radius: 0.375rem;
            background-color: #ffffff; 
            font-size: 0.875rem; 
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus, .form-input-modal:focus, .form-input-create:focus, .form-input-compact:focus, select:focus { 
            outline: none;
            border-color: #2a3f50; 
            box-shadow: 0 0 0 2px rgba(42, 63, 80, 0.2);
        }
        .form-input.bg-gray-100, .form-input-compact.bg-gray-200 {
            background-color: #f3f4f6;
            cursor: not-allowed;
            border-color: #d1d5db;
        }
        
        .form-label { 
            display: block; 
            margin-bottom: 0.375rem; 
            font-size: 0.875rem;
            font-weight: 500; 
            color: #4b5563; 
        }

        /* --- Radio Button --- */
        .form-radio {
            appearance: none;
            display: inline-block;
            width: 1.25rem;
            height: 1.25rem;
            padding: 3px;
            background-clip: content-box;
            border: 2px solid #9ca3af;
            border-radius: 50%;
            margin-right: 0.5rem;
            transition: all 0.2s;
        }
        .form-radio:checked {
            background-color: #2a3f50;
            border-color: #2a3f50;
        }
        .form-radio:disabled {
            background-color: #e5e7eb;
            border-color: #e5e7eb;
        }

        /* --- Search Input with Icon --- */
        .form-input-search { 
            padding: 0.5rem 0.75rem 0.5rem 2.5rem;
            border: 1px solid #9ca3af;
            border-radius: 0.375rem;
            background-color: #f9fafb; 
            width: 100%; 
            font-size: 0.875rem; 
        }
        .form-input-search:focus {
            background-color: white; 
            outline: none;
            border-color: #2a3f50; 
            box-shadow: 0 0 0 2px rgba(42, 63, 80, 0.2);
        }

        /* --- Select Arrow (UPDATED) --- */
        select.form-input, select.form-input-modal, select.form-input-create, select.form-input-compact { 
            appearance: none; 
            background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpath d="M6 9l6 6 6-6"/%3e%3c/svg%3e'); 
            background-position: right 0.75rem center; 
            background-repeat: no-repeat; 
            background-size: 1.2em; 
            padding-right: 2.5rem; 
        }
        
        .no-arrows::-webkit-outer-spin-button, .no-arrows::-webkit-inner-spin-button { 
            -webkit-appearance: none; margin: 0; 
        }
        .no-arrows { -moz-appearance: textfield; }
        
        @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95) translateY(-5px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in-scale {
            animation: fadeInScale 0.1s ease-out forwards;
        }
    `}</style>
);

export default GlobalStyles;