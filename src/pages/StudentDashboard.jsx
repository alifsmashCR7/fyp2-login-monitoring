import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeSettingsTab, setActiveSettingsTab] = useState('details');
    const [logs, setLogs] = useState([]);
    const [user, setUser] = useState({});
    const [portalData, setPortalData] = useState({ courses: [], announcements: [] });

    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [twoFactorSecret, setTwoFactorSecret] = useState('');
    const [verifyCode, setVerifyCode] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/auth');
            return;
        }

        if (userData) {
            setUser(JSON.parse(userData));
        }

        fetch('http://localhost:5000/api/logs/student', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setLogs(data);
            })
            .catch(err => console.error(err));

        fetch('http://localhost:5000/api/student/portal-data', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setPortalData(data))
            .catch(err => console.error(err));

    }, [navigate]);

    const fetch2FASetup = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/2fa/setup', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (res.ok) {
                setQrCodeUrl(data.qrCodeUrl);
                setTwoFactorSecret(data.secret);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const openTwoFactorSettings = () => {
        setActiveSettingsTab('2fa');
        setIsSettingsOpen(true);
        if (!user.is_two_factor_enabled) {
            fetch2FASetup();
        }
    };

    const handleEnable2FA = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/2fa/enable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ token: verifyCode, secret: twoFactorSecret })
            });
            if (res.ok) {
                const updatedUser = { ...user, is_two_factor_enabled: 1 };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setVerifyCode('');
                alert('Two-Factor Authentication successfully enabled!');
            } else {
                alert('Invalid verification code. Please try again.');
            }
        } catch (e) {
            alert('Error enabling 2FA');
        }
    };

    const handleDisable2FA = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/2fa/disable', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const updatedUser = { ...user, is_two_factor_enabled: 0 };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                fetch2FASetup();
                alert('Two-Factor Authentication disabled.');
            }
        } catch (e) {
            alert('Error disabling 2FA');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-300 p-4 md:p-8 animate-fade-in">

            <header className="max-w-7xl mx-auto flex items-center justify-between pb-6 mb-6 border-b border-slate-800/60">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Student Portal</h1>
                    <p className="text-sm text-slate-500">Welcome back, {user.username || 'Student'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="inline-flex items-center justify-center rounded-md transition-colors hover:bg-slate-800 text-slate-300 hover:text-white h-9 w-9"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <button onClick={handleLogout} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white h-9 px-4">
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log out
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-6">
                    
                    {!user.is_two_factor_enabled && (
                        <div className="flex items-start sm:items-center justify-between p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 shadow-lg">
                            <div className="flex items-start sm:items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 mt-1 sm:mt-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-indigo-300">Security Recommendation</h3>
                                    <p className="text-sm text-indigo-200/70 mt-0.5">Please enable Two-Factor Authentication (2FA) to add an extra layer of security to your account.</p>
                                </div>
                            </div>
                            <button
                                onClick={openTwoFactorSettings}
                                className="mt-3 sm:mt-0 whitespace-nowrap inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-500 h-9 px-4 ml-4 shadow-md hover:shadow-indigo-500/25"
                            >
                                Enable 2FA
                            </button>
                        </div>
                    )}

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                            <h2 className="text-lg font-semibold text-white">My Courses</h2>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {portalData.courses.map((course) => (
                                <div key={course.id} className="p-4 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{course.course_code}</span>
                                        <span className="text-xs text-slate-500">{course.credits} Credits</span>
                                    </div>
                                    <h3 className="text-md font-medium text-slate-200 group-hover:text-white transition-colors">{course.course_name}</h3>
                                    <p className="text-sm text-slate-500 mt-3 flex items-center">
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        {course.instructor}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-slate-800 bg-slate-900/80">
                            <h2 className="text-lg font-semibold text-white">Campus Announcements</h2>
                        </div>
                        <div className="divide-y divide-slate-800">
                            {portalData.announcements.map((announcement) => (
                                <div key={announcement.id} className="p-5 hover:bg-slate-800/30 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-md font-medium text-slate-200">{announcement.title}</h3>
                                        <span className="text-xs text-slate-500 whitespace-nowrap ml-4">{new Date(announcement.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">{announcement.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="space-y-6">

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-slate-800 bg-slate-900/80">
                            <h2 className="text-lg font-semibold text-white">Quick Links</h2>
                        </div>
                        <div className="p-3">
                            <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-300 hover:text-white">
                                <div className="bg-slate-800 p-2 rounded-md mr-3 text-indigo-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                </div>
                                <span className="font-medium text-sm">University Library</span>
                            </a>
                            <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-300 hover:text-white">
                                <div className="bg-slate-800 p-2 rounded-md mr-3 text-emerald-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                </div>
                                <span className="font-medium text-sm">Student Webmail</span>
                            </a>
                            <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-300 hover:text-white">
                                <div className="bg-slate-800 p-2 rounded-md mr-3 text-amber-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                </div>
                                <span className="font-medium text-sm">Academic Calendar</span>
                            </a>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-slate-800 bg-slate-900/80">
                            <h2 className="text-lg font-semibold text-white">Recent Security Logs</h2>
                        </div>
                        <div className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <tbody className="divide-y divide-slate-800">
                                        {logs.slice(0, 4).map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-5 py-3 text-sm">
                                                    <div className="text-slate-300">{new Date(log.login_time).toLocaleDateString()}</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{log.ip_address}</div>
                                                </td>
                                                <td className="px-5 py-3 whitespace-nowrap text-right">
                                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${log.status === 'Success' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {logs.length === 0 && (
                                    <div className="p-6 text-center text-slate-500 text-sm">
                                        No recent activity.
                                    </div>
                                )}
                            </div>
                            <div className="p-3 border-t border-slate-800 bg-slate-900/30">
                                <button onClick={() => setIsSettingsOpen(true)} className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 font-medium py-1">
                                    View All Security Settings →
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

            </main>

            {isSettingsOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={() => setIsSettingsOpen(false)}
                >
                    <div
                        className="flex flex-col md:flex-row w-full max-w-4xl h-[600px] bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsSettingsOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="w-full md:w-64 bg-slate-950/50 p-6 border-r border-slate-800 flex flex-col gap-2">
                            <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
                            <button
                                onClick={() => setActiveSettingsTab('details')}
                                className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === 'details' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                            >
                                User Details
                            </button>
                            <button
                                onClick={() => {
                                    setActiveSettingsTab('2fa');
                                    if (!user.is_two_factor_enabled && !qrCodeUrl) fetch2FASetup();
                                }}
                                className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === '2fa' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                            >
                                Two-Factor Auth
                            </button>
                            <button
                                onClick={() => setActiveSettingsTab('logs')}
                                className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === 'logs' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                            >
                                Login History
                            </button>
                        </div>

                        <div className="flex-1 p-8 overflow-y-auto">
                            {activeSettingsTab === 'details' && (
                                <div className="space-y-6 max-w-md">
                                    <div>
                                        <h3 className="text-lg font-medium text-white">User Details</h3>
                                        <p className="text-sm text-slate-400">Update your account information.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Username</label>
                                            <input type="text" defaultValue={user.username || ''} className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Email Address</label>
                                            <input type="email" placeholder="Update email" className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeSettingsTab === '2fa' && (
                                <div className="space-y-6 max-w-md">
                                    <div>
                                        <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
                                        <p className="text-sm text-slate-400">
                                            {user.is_two_factor_enabled ? 'Your account is secured with 2FA.' : 'Scan the QR code with your authenticator app.'}
                                        </p>
                                    </div>

                                    {user.is_two_factor_enabled ? (
                                        <div className="space-y-4">
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-4">
                                                <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-emerald-400">2FA is Enabled</h4>
                                                    <p className="text-xs text-emerald-500/70">Your account has an extra layer of security.</p>
                                                </div>
                                            </div>
                                            <button onClick={handleDisable2FA} className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-md text-sm font-medium transition-colors w-full">
                                                Disable 2FA
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-white p-4 rounded-lg w-48 h-48 mx-auto flex items-center justify-center overflow-hidden">
                                                {qrCodeUrl ? (
                                                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="animate-pulse w-full h-full bg-slate-200 rounded"></div>
                                                )}
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-300">Verification Code</label>
                                                    <input
                                                        type="text"
                                                        placeholder="123456"
                                                        maxLength={6}
                                                        value={verifyCode}
                                                        onChange={(e) => setVerifyCode(e.target.value)}
                                                        className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-widest text-center"
                                                    />
                                                </div>
                                                <button onClick={handleEnable2FA} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full">
                                                    Verify and Enable
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {activeSettingsTab === 'logs' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-white">Full Login History</h3>
                                        <p className="text-sm text-slate-400">Review all recent sessions and security events.</p>
                                    </div>
                                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-800 bg-slate-900">
                                                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Date & Time</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">IP & Device</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Location</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {logs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{new Date(log.login_time).toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-400">
                                                            <div className="font-mono text-xs">{log.ip_address}</div>
                                                            <div className="text-xs max-w-[150px] truncate mt-0.5" title={log.device}>{log.device}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-400">{log.location}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${log.status === 'Success' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {logs.length === 0 && (
                                            <div className="p-6 text-center text-slate-500 text-sm">
                                                No login history found.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}