import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScrollText, ShieldAlert, LogOut, Settings, Wrench, Users } from 'lucide-react';
import Overview from './Overview';
import LoginLogs from './LoginLogs';
import Alerts from './Alerts';
import UserList from './UserList';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminLogs, setAdminLogs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const isAuth = sessionStorage.getItem('adminAuth');
        if (isAuth === 'true') {
            setIsAuthenticated(true);
            fetchLogs();
        } else {
            const user = window.prompt("Enter Admin Username:");
            if (user === 'admin') {
                const pass = window.prompt("Enter Admin Password:");
                if (pass === '1234') {
                    sessionStorage.setItem('adminAuth', 'true');
                    setIsAuthenticated(true);
                    fetchLogs();
                } else {
                    navigate('/auth');
                }
            } else {
                navigate('/auth');
            }
        }
    }, [navigate]);

    const fetchLogs = () => {
        fetch('http://localhost:5000/api/admin/logs')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAdminLogs(data);
            })
            .catch(err => console.error(err));
    };

    const handleLogout = () => {
        sessionStorage.removeItem('adminAuth');
        navigate('/auth');
    };

    if (!isAuthenticated) return null;

    const alertCount = adminLogs.filter(l => l.risk_level === 'High Risk' || l.risk_level === 'Suspicious').length;

    return (
        <div className="min-h-screen flex bg-slate-950 font-sans animate-fade-in">

            <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">Admin Portal</h1>
                    <p className="text-xs text-slate-500 mt-1">Student Web Test</p>
                </div>

                <nav className="flex-1 p-4 space-y-1.5">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview'
                            ? 'bg-indigo-600/10 text-indigo-400'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Overview
                    </button>

                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'logs'
                            ? 'bg-indigo-600/10 text-indigo-400'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                            }`}
                    >
                        <ScrollText className="w-4 h-4" />
                        Login Logs
                    </button>

                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'alerts'
                            ? 'bg-indigo-600/10 text-indigo-400'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="w-4 h-4" />
                            Alerts
                        </div>
                        {alertCount > 0 && (
                            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {alertCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users'
                            ? 'bg-indigo-600/10 text-indigo-400'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        User List
                    </button>

                    <div className="pt-4 mt-4 border-t border-slate-800">
                        <button
                            onClick={() => navigate('/admin/debug')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-amber-500 hover:bg-amber-500/10"
                        >
                            <Wrench className="w-4 h-4" />
                            Debug Tools
                        </button>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-1.5">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors">
                        <Settings className="w-4 h-4" />
                        System Settings
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 flex items-center justify-between md:justify-end px-6 border-b border-slate-800 bg-slate-950">
                    <div className="md:hidden font-bold text-white">Admin Portal</div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-white">System Administrator</div>
                            <div className="text-xs text-slate-500">admin@studentweb.test</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white border border-indigo-500">
                            A
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {activeTab === 'overview' && <Overview logs={adminLogs} />}
                        {activeTab === 'logs' && <LoginLogs logs={adminLogs} />}
                        {activeTab === 'alerts' && <Alerts logs={adminLogs} fetchLogs={fetchLogs} />}
                        {activeTab === 'users' && <UserList />}
                    </div>
                </div>
            </main>

        </div>
    );
}