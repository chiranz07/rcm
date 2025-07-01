import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

const formatDate = (date) => date ? date.toLocaleDateString('en-GB') : '';

const DateRangePicker = ({ onDateChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [range, setRange] = useState({ startDate: null, endDate: null });
    const [activePreset, setActivePreset] = useState('');
    const [viewDate, setViewDate] = useState(new Date());
    const [selecting, setSelecting] = useState('start'); // 'start' or 'end'

    const buttonRef = useRef(null);
    const pickerRef = useRef(null);

    const handleDayClick = (day) => {
        if (selecting === 'start' || day < range.startDate) {
            setRange({ startDate: day, endDate: null });
            setSelecting('end');
            setActivePreset('Custom');
        } else {
            setRange(prev => ({ ...prev, endDate: day }));
            setSelecting('start');
        }
    };

    useEffect(() => {
        if (range.startDate && range.endDate) {
            onDateChange(range);
            setIsOpen(false);
        }
    }, [range, onDateChange]);

    const handlePresetClick = (preset) => {
        // (Date calculation logic remains the same)
        // ...
        setActivePreset(preset);
        onDateChange(newRange);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setRange({ startDate: null, endDate: null });
        setActivePreset('');
        onDateChange({ startDate: null, endDate: null });
        setIsOpen(false);
    };

    const generateCalendar = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weeks = [];
        let week = [];

        // Fill initial empty days
        for (let i = 0; i < firstDay; i++) { week.push(null); }

        for (let day = 1; day <= daysInMonth; day++) {
            week.push(new Date(year, month, day));
            if (week.length === 7) {
                weeks.push(week);
                week = [];
            }
        }
        if (week.length > 0) weeks.push(week);
        return weeks;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target) && !buttonRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayValue = range.startDate ? `${formatDate(range.startDate)} - ${formatDate(range.endDate) || '...'}` : "Select Date Range";

    const presets = ["Today", "This Week", "This Month", "This Year"];

    return (
        <div className="relative w-full sm:w-64" ref={buttonRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="form-input-create !bg-white w-full flex justify-between items-center text-left text-sm h-full">
                <div className="flex items-center gap-2 truncate">
                    <Calendar size={16} className="text-gray-500" />
                    <span className={`truncate ${range.startDate ? 'text-gray-800' : 'text-gray-500'}`}>{displayValue}</span>
                </div>
                {(range.startDate) && <div className="p-0.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600" onClick={handleClear}><X size={14} /></div>}
            </button>
            {isOpen && createPortal(
                <div ref={pickerRef} className="absolute z-30 mt-1 bg-white border border-gray-200 rounded-md shadow-lg flex" style={{ top: buttonRef.current.getBoundingClientRect().bottom + 4, left: buttonRef.current.getBoundingClientRect().left }}>
                    <div className="p-2 border-r w-40 flex flex-col gap-1">
                        {presets.map(p => <button key={p} onClick={() => handlePresetClick(p)} className={`w-full text-sm py-1.5 px-2 rounded-md text-left ${activePreset === p ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>{p}</button>)}
                    </div>
                    <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                            <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1 rounded-full hover:bg-gray-100"><ChevronLeft size={18} /></button>
                            <p className="font-semibold text-sm">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                            <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1 rounded-full hover:bg-gray-100"><ChevronRight size={18} /></button>
                        </div>
                        <div className="grid grid-cols-7 gap-y-1 text-center">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day} className="text-xs font-bold text-gray-400">{day}</div>)}
                            {generateCalendar(viewDate).flat().map((day, i) => {
                                if (!day) return <div key={`empty-${i}`}></div>;
                                const isStart = range.startDate && day.getTime() === range.startDate.getTime();
                                const isEnd = range.endDate && day.getTime() === range.endDate.getTime();
                                const inRange = range.startDate && range.endDate && day > range.startDate && day < range.endDate;
                                return (
                                    <button key={day.toString()} onClick={() => handleDayClick(day)} className={`w-8 h-8 rounded-full text-sm ${isStart || isEnd ? 'bg-primary text-white' : inRange ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
                                        {day.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DateRangePicker;