import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Home, FileText, Users, Briefcase, BarChart2,
    ChevronsLeft, ChevronsRight, Settings, FilePlus, History, UserPlus
} from 'lucide-react';
import { userSignOut } from '../api/firebase'; // Ensure userSignOut is imported

function Sidebar({ currentPage, userRole }) { // userRole is received as prop
    const [isCollapsed, setIsCollapsed] = useState(true);

    // Define nav links with optional roles
    const navLinks = [
        { to: "/dashboard", icon: <Home size={20} color="#2980b9" />, label: "Dashboard", roles: ['admin', 'accountant', 'viewer'] },
        { to: "/entities", icon: <Briefcase size={20} color="#27ae60" />, label: "Entities", roles: ['admin', 'accountant'] },
        { to: "/customers", icon: <Users size={20} color="#8e44ad" />, label: "Customers", roles: ['admin', 'accountant'] },
        { to: "/invoices/new", icon: <FilePlus size={20} color="#16a085" />, label: "Create Invoice", roles: ['admin', 'accountant'] },
        { to: "/invoices", icon: <FileText size={20} color="#f39c12" />, label: "View Invoices", roles: ['admin', 'accountant', 'viewer'] },
        { to: "/reports", icon: <BarChart2 size={20} color="#d35400" />, label: "Reports", roles: ['admin', 'accountant', 'viewer'] },
        { to: "/audit-history", icon: <History size={20} color="#7f8c8d" />, label: "Audit History", roles: ['admin'] },
    ];

    const settingsLinks = [
        { to: "/settings", icon: <Settings size={20} color="#c0392b" />, label: "Settings", roles: ['admin'] },
        // Removed User Management from here, it's now only accessible via the Settings page
    ];

    const NavLink = ({ to, icon, children }) => {
        const isActive = currentPage === to;
        const baseClasses = "flex items-center text-sm font-medium rounded-lg transition-colors duration-200";
        const activeClasses = "bg-blue-100 text-primary";
        const inactiveClasses = "text-text-secondary hover:bg-gray-100";

        if (isCollapsed) {
            return (
                <div className="relative group w-10 h-10 flex items-center justify-center mx-auto">
                    <Link
                        to={to}
                        className={`p-2 rounded-lg ${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                    >
                        {icon}
                    </Link>
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                        {children}
                    </div>
                </div>
            );
        }

        return (
            <Link
                to={to}
                className={`${baseClasses} w-full px-4 py-2 ${isActive ? activeClasses : inactiveClasses}`}
            >
                {icon && (
                    <div className="w-6 flex-shrink-0 flex items-center justify-center">
                        {icon}
                    </div>
                )}
                <span className="ml-2">{children}</span>
            </Link>
        );
    };

    const isLinkVisible = (roles) => {
        if (!userRole) return false;
        return roles.includes(userRole);
    };

    return (
        <aside className={`bg-card border-r border-gray-100 flex-shrink-0 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
            <div className="h-20 flex items-center justify-center border-b border-gray-100 px-4">
                <svg
                    className="h-8 w-8 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {!isCollapsed && <h1 className="text-xl font-bold text-text-primary ml-2">Receivables</h1>}
            </div>

            <nav className={`flex-1 py-6 space-y-2 ${isCollapsed ? '' : 'px-4'}`}>
                {navLinks.map(link => (
                    isLinkVisible(link.roles) && (
                        <NavLink key={link.to} to={link.to} icon={link.icon}>{link.label}</NavLink>
                    )
                ))}
            </nav>

            <div className={`py-6 space-y-2 border-t border-gray-100 mt-auto ${isCollapsed ? '' : 'px-4'}`}>
                {settingsLinks.map(link => (
                    isLinkVisible(link.roles) && (
                        <NavLink key={link.to} to={link.to} icon={link.icon}>{link.label}</NavLink>
                    )
                ))}
                {/* Sign Out Button */}
                <button
                    onClick={userSignOut}
                    className={`w-full flex items-center justify-center p-2 rounded-lg text-text-secondary hover:bg-gray-100 ${isCollapsed ? 'mx-auto w-10 h-10' : 'px-4 py-2'}`}
                >
                    <div className="w-6 flex-shrink-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                    </div>
                    {!isCollapsed && <span className="ml-2">Sign Out</span>}
                </button>
            </div>

            <div className={`py-4 border-t border-gray-100 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center p-2 rounded-lg text-text-secondary hover:bg-gray-100"
                >
                    <div className="w-6 flex-shrink-0 flex items-center justify-center">
                        {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
                    </div>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;