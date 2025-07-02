// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { googleSignIn, userSignOut } from './api/firebase'; // Import auth functions

// Import pages and components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import EntityManagement from './components/EntityManagement';
import CustomerMaster from './components/CustomerMaster';
import Settings from './components/Settings';
import ProductSettings from './components/settings/ProductSettings';
import PartnerSettings from './components/settings/PartnerSettings';
import ReminderSettings from './components/settings/ReminderSettings';
import CreateInvoice from './components/CreateInvoice';
import ViewInvoices from './components/ViewInvoices';
import ViewPayments from './components/ViewPayments'; // Import the new component
import Reports from './components/Reports';
import AuditHistory from './components/AuditHistory';
import PageLoader from './components/common/PageLoader';
import GlobalStyles from './components/common/GlobalStyles';
import UserManagement from './components/UserManagement';
// New: Login/Unauthorized Page Component
const AuthPage = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Receivables Management</h1>
            <p className="text-gray-600 mb-6">Please sign in with your authorized Google account to continue.</p>
            <button
                onClick={googleSignIn}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center mx-auto"
            >
                <img src="https://img.icons8.com/color/16/000000/google-logo.png" alt="Google logo" className="mr-2" />
                Sign in with Google
            </button>
            <p className="text-red-500 text-sm mt-4">Only invited users can access the application.</p>
        </div>
    </div>
);

export default function App() {
    const { user, userRole, isLoading, isAuthReady } = useAppContext(); // Get user, userRole, and loading states
    const location = useLocation();

    // Show a global loader if authentication state is still being determined
    if (isLoading || !isAuthReady) {
        return <PageLoader />;
    }

    // If authentication is ready and no user, show the login page
    if (!user) {
        return <AuthPage />;
    }

    // Authorized roles for Settings. Adjust as needed.
    const isSettingsAuthorized = userRole === 'admin';

    return (
        <div className="flex h-screen bg-background font-sans text-text-primary">
            <Sidebar currentPage={location.pathname} userRole={userRole} /> {/* Pass userRole to Sidebar */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 bg-gray-50">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/invoices" element={<ViewInvoices />} />
                        <Route path="/payments" element={<ViewPayments />} /> {/* Add new route */}
                        <Route path="/entities" element={<EntityManagement />} />
                        <Route path="/customers" element={<CustomerMaster />} />
                        <Route path="/invoices/new" element={<CreateInvoice />} />
                        <Route path="/invoices/edit/:invoiceId" element={<CreateInvoice />} />
                        <Route path="/audit-history" element={<AuditHistory />} />

                        {/* Protected Settings Routes */}
                        <Route
                            path="/settings"
                            element={isSettingsAuthorized ? <Settings /> : <Navigate to="/dashboard" replace />}
                        />
                        <Route
                            path="/settings/products"
                            element={isSettingsAuthorized ? <ProductSettings /> : <Navigate to="/dashboard" replace />}
                        />
                        <Route
                            path="/settings/partners"
                            element={isSettingsAuthorized ? <PartnerSettings /> : <Navigate to="/dashboard" replace />}
                        />
                        <Route
                            path="/settings/reminders"
                            element={isSettingsAuthorized ? <ReminderSettings /> : <Navigate to="/dashboard" replace />}
                        />
                        {/* New route for User Management (Admin only) */}
                        <Route
                            path="/settings/users"
                            element={isSettingsAuthorized ? <UserManagement /> : <Navigate to="/dashboard" replace />}
                        />

                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </main>
            </div>
            <GlobalStyles />
        </div>
    );
}