import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SIDEBAR_ITEMS } from '../constants';
import { Page } from '../types';
import { CreditCardIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';


interface SidebarProps {
    isCollapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setCollapsed }) => {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [credits, setCredits] = useState<number | string>(0);
    const [loadingCredits, setLoadingCredits] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Check if user is admin
    useEffect(() => {
        const adminData = localStorage.getItem('admin');
        setIsAdmin(!!adminData);
    }, []);

    const handleLogout = async () => {
        try {
            await signOut();
            // Redirect to login page
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const getPagePath = (page: Page): string => {
        switch (page) {
            case Page.Dashboard:
                return '/dashboard';
            case Page.Campaigns:
                return '/campaigns';
            case Page.Agent:
                return '/agents';
            case Page.PhoneNo:
                return '/phone-numbers';
            case Page.Settings:
                return '/settings';
            case Page.API:
                return '/api';
            case Page.Credits:
                return '/credits';
            default:
                return '/dashboard';
        }
    };

    const getCurrentPage = (): Page => {
        const path = location.pathname;
        switch (path) {
            case '/dashboard':
                return Page.Dashboard;
            case '/campaigns':
                return Page.Campaigns;
            case '/agents':
                return Page.Agent;
            case '/phone-numbers':
                return Page.PhoneNo;
            case '/settings':
                return Page.Settings;
            case '/api':
                return Page.API;
            case '/credits':
                return Page.Credits;
            default:
                return Page.Dashboard;
        }
    };

    const activePage = getCurrentPage();

    return (
        <aside className={`fixed top-0 left-0 h-full bg-white dark:bg-darkbg border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out z-20 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-800">
                <h1 className={`text-xl font-bold text-slate-800 dark:text-white transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Ziya Voice</h1>
                <h1 className={`text-2xl font-bold text-primary transition-opacity duration-300 ${!isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>ZV</h1>
            </div>

            <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
                <ul>
                    {SIDEBAR_ITEMS.map((item) => (
                        <li key={item.id} className="mb-1">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate(getPagePath(item.id));
                                }}
                                className={`flex items-center py-2.5 px-3 rounded-r-full mr-2 transition-colors duration-200 ${activePage === item.id
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-darkbg-light'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${activePage === item.id ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`} />
                                <span className={`ml-4 text-sm transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>{item.id}</span>
                            </a>
                        </li>
                    ))}
                    {/* Admin Panel Link */}
                    {isAdmin && (
                        <li className="mb-1">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate('/admin/dashboard');
                                }}
                                className={`flex items-center py-2.5 px-3 rounded-r-full mr-2 transition-colors duration-200 ${location.pathname.startsWith('/admin')
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-darkbg-light'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className={`ml-4 text-sm transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Admin Panel</span>
                            </a>
                        </li>
                    )}
                </ul>
            </nav>
            <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/credits');
                    }}
                    className={`flex items-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-darkbg-light mb-1 ${isCollapsed ? 'justify-center' : ''}`}
                    aria-label="View credits and usage"
                >
                    <CreditCardIcon className="h-5 w-5 flex-shrink-0" />
                    <div className={`ml-4 overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                        <span className="font-semibold block text-sm">{typeof credits === 'number' ? credits.toLocaleString() : credits}</span>
                        <span className="text-xs text-slate-500">Credits Remaining</span>
                    </div>
                </a>
                <button
                    onClick={handleLogout}
                    className={`flex items-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-darkbg-light w-full ${isCollapsed ? 'justify-center' : ''}`}
                    aria-label="Logout"
                >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
                    <span className={`ml-4 text-sm font-medium transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Logout</span>
                </button>
                <button
                    onClick={() => setCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-gray-100 dark:hover:bg-darkbg-light mt-1"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;