// src/components/settings/ReminderSettings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Plus, Trash2, ArrowLeft, BellRing } from 'lucide-react';
import { db, appId } from '../../api/firebase';
import PageLoader from '../common/PageLoader';

const ReminderSettings = () => {
    const [reminderDays, setReminderDays] = useState([]);
    const [newDay, setNewDay] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const inputRef = useRef(null);

    const settingsCollectionPath = `/artifacts/${appId}/settings`;
    const reminderConfigDocRef = doc(db, settingsCollectionPath, 'reminder_config'); // Single document for settings

    useEffect(() => {
        const unsubscribe = onSnapshot(reminderConfigDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setReminderDays(data.days || []);
            } else {
                // If document doesn't exist, create it with a default empty array
                setDoc(reminderConfigDocRef, { days: [] }, { merge: true })
                    .catch(err => console.error("Error creating reminder_config doc:", err));
                setReminderDays([]);
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching reminder settings:", err);
            setError("Failed to load reminder settings.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAddDay = async (e) => {
        e.preventDefault();
        setError('');
        const dayValue = parseInt(newDay.trim(), 10);

        if (isNaN(dayValue) || dayValue < 0) {
            setError("Please enter a valid positive number for days.");
            return;
        }
        if (reminderDays.includes(dayValue)) {
            setError("This day value already exists.");
            return;
        }

        try {
            await updateDoc(reminderConfigDocRef, {
                days: arrayUnion(dayValue)
            });
            setNewDay('');
            inputRef.current?.focus();
        } catch (err) {
            console.error("Error adding reminder day:", err);
            setError("Failed to add reminder day.");
        }
    };

    const handleRemoveDay = async (dayToRemove) => {
        try {
            await updateDoc(reminderConfigDocRef, {
                days: arrayRemove(dayToRemove)
            });
        } catch (err) {
            console.error("Error removing reminder day:", err);
            setError("Failed to remove reminder day.");
        }
    };

    if (isLoading) {
        return <PageLoader />;
    }

    return (
        <div>
            <div className="mb-6">
                <Link to="/settings" className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900">
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Settings
                </Link>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start">
                    <div className="p-2 bg-gray-100 rounded-lg mr-4">
                        <BellRing size={24} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Reminder Settings</h2>
                        <p className="text-gray-500 mt-1 text-sm">Configure how many days before the due date invoice reminders should be sent.</p>
                    </div>
                </div>

                <div className="border-t my-6"></div>

                <form onSubmit={handleAddDay} className="mb-4 flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="number"
                        value={newDay}
                        onChange={(e) => setNewDay(e.target.value)}
                        placeholder="e.g., 3 (days before due date)"
                        className="form-input-create flex-grow no-arrows"
                        min="0"
                    />
                    <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg transition flex items-center justify-center shadow-sm hover:shadow-lg text-sm font-semibold">
                        <Plus size={18} />
                        <span className="ml-2">Add Day</span>
                    </button>
                </form>
                {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

                <div className="mt-4 pt-4 border-t">
                    <p className="font-semibold text-gray-700 mb-2">Configured Reminder Days:</p>
                    {reminderDays.length === 0 ? (
                        <p className="text-gray-500 text-sm">No reminder days configured yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {reminderDays.sort((a,b)=>a-b).map(day => (
                                <div key={day} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300">
                                    <span className="font-medium text-gray-700">
                                        {day === 0 ? 'On Due Date' : `${day} Day${day === 1 ? '' : 's'} Before Due Date`}
                                    </span>
                                    <button onClick={() => handleRemoveDay(day)} className="text-gray-400 hover:text-red-600 p-2 rounded-md">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReminderSettings;