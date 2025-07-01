// src/components/Settings.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, UserCheck, Users } from 'lucide-react'; // Changed BellRing to Users for User Management icon

const SettingsCard = ({ icon, title, description, to }) => {
    return (
        <Link to={to} className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all flex items-center text-left">
            <div className="p-2 bg-gray-100 rounded-lg mr-4">
                {icon}
            </div>
            <div className="flex-grow">
                <h3 className="font-bold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
        </Link>
    );
};

function Settings() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SettingsCard
                    icon={<Package size={24} className="text-primary" />}
                    title="Products & Services"
                    description="Manage your list of reusable items for invoices."
                    to="/settings/products"
                />
                <SettingsCard
                    icon={<UserCheck size={24} className="text-primary" />} // Icon for Partners
                    title="Partners"
                    description="Manage your list of partners for invoices."
                    to="/settings/partners"
                />
                <SettingsCard // NEW: User Management Card
                    icon={<Users size={24} className="text-primary" />} // Using Users icon for User Management
                    title="User Management"
                    description="Manage application users and their roles."
                    to="/settings/users"
                />
                {/* Removed Reminder Settings Card */}
            </div>
        </div>
    );
}

export default Settings;