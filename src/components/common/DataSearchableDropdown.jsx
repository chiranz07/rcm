import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';

const DataSearchableDropdown = React.forwardRef(({ options, value, onChange, placeholder, displayProp = 'name', valueProp = 'id', error, disabled = false }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [position, setPosition] = useState({});

    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current.focus(), 0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const currentButtonRef = ref || buttonRef;
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && currentButtonRef.current && !currentButtonRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ref]);

    const handleToggleDropdown = () => {
        if (disabled) return;
        if (!isOpen) {
            const currentButtonRef = ref || buttonRef;
            const rect = currentButtonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
        setIsOpen(!isOpen);
    };

    const handleSelect = (option) => {
        onChange(option);
        setIsOpen(false);
        setSearchTerm('');
    };

    const selectedOption = options.find(opt => opt[valueProp] === value);
    const displayValue = selectedOption ? selectedOption[displayProp] : placeholder;

    const filteredOptions = options.filter(option =>
        option[displayProp]?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const DropdownMenu = (
        <div
            ref={dropdownRef}
            className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto animate-fade-in-scale"
            style={{ ...position }}
        >
            <div className="p-2">
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    className="form-input-modal w-full text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <ul>
                {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
                    <li
                        key={option[valueProp] || index}
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSelect(option)}
                    >
                        {option[displayProp]}
                    </li>
                )) : <li className="px-3 py-2 text-sm text-gray-500">No options found</li>}
            </ul>
        </div>
    );

    return (
        <div className="relative">
            <button
                ref={ref || buttonRef}
                type="button"
                className={`form-input-create !bg-white w-full flex justify-between items-center text-left ${error ? 'border-red-500' : ''} ${disabled ? 'bg-gray-100 !cursor-not-allowed' : ''}`}
                onClick={handleToggleDropdown}
                disabled={disabled}
            >
                <span className={`truncate ${selectedOption ? 'text-gray-800' : 'text-gray-400'}`}>{displayValue}</span>
                <div className="flex items-center">
                    {selectedOption && !disabled && (
                        <button
                            type="button"
                            className="p-0.5 mr-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(null);
                            }}
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && createPortal(DropdownMenu, document.getElementById('portal-root'))}
        </div>
    );
});

export default DataSearchableDropdown;