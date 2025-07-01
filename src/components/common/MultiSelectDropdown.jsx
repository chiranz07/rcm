import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const MultiSelectDropdown = ({ options, selectedValues, onChange, placeholder, displayProp = 'name', valueProp = 'id' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [position, setPosition] = useState({});
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    const handleToggle = (e) => {
        e.stopPropagation();
        if (!isOpen) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
        setIsOpen(!isOpen);
    };

    const handleOptionClick = (optionValue) => {
        const newSelectedValues = selectedValues.includes(optionValue)
            ? selectedValues.filter(v => v !== optionValue)
            : [...selectedValues, optionValue];
        onChange(newSelectedValues);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt[displayProp]?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDisplayValue = () => {
        if (selectedValues.length === 0) return placeholder;
        if (selectedValues.length === 1) {
            const selectedOption = options.find(opt => opt[valueProp] === selectedValues[0]);
            return selectedOption ? selectedOption[displayProp] : '1 item selected';
        }
        return `${selectedValues.length} items selected`;
    };

    return (
        <div className="relative w-full sm:w-48">
            <button
                ref={buttonRef}
                type="button"
                className="form-input-create !bg-white w-full flex justify-between items-center text-left text-sm h-full"
                onClick={handleToggle}
            >
                <span className={`truncate ${selectedValues.length > 0 ? 'text-gray-800' : 'text-gray-500'}`}>{getDisplayValue()}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="absolute z-30 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 flex flex-col"
                    style={{ ...position }}
                >
                    <div className="p-2 border-b">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="form-input-modal w-full text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <ul className="py-1 overflow-y-auto">
                        {filteredOptions.map(option => (
                            <li
                                key={option[valueProp]}
                                className="px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer flex items-center"
                                onClick={() => handleOptionClick(option[valueProp])}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedValues.includes(option[valueProp])}
                                    readOnly
                                    className="mr-3 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span>{option[displayProp]}</span>
                            </li>
                        ))}
                    </ul>
                </div>,
                document.body
            )}
        </div>
    );
};

export default MultiSelectDropdown;