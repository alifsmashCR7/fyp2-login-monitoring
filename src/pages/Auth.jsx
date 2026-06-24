import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
    const [activeTab, setActiveTab] = useState('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [tempUserId, setTempUserId] = useState(null);
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();

        let endpoint = '/api/login';
        let payload = { email, password, location: 'Kajang, Malaysia' };

        if (activeTab === 'register') {
            endpoint = '/api/register';
            payload = { username, email, password, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, location: 'Kajang, Malaysia' };
        } else if (activeTab === '2fa') {
            endpoint = '/api/login/verify-2fa';
            payload = { userId: tempUserId, token: twoFactorCode, location: 'Kajang, Malaysia' };
        }

        try {
            const res = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                if (data.requires2FA) {
                    setTempUserId(data.userId);
                    setActiveTab('2fa');
                    return;
                }

                if (data.token) localStorage.setItem('token', data.token);
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

                if (activeTab === 'register') {
                    setActiveTab('login');
                    alert('Registration successful! Please login.');
                } else {
                    navigate('/dashboard');
                }
            } else {
                alert(data.error || 'Authentication failed');
            }
        } catch (error) {
            alert('Failed to connect to server');
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center bg-slate-950 overflow-hidden font-sans p-4 animate-fade-in">

            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-600 to-purple-800 blur-[120px] opacity-30 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-orange-600 to-pink-800 blur-[150px] opacity-20"></div>

            <div className="z-10 mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                    Student Web Test
                </h1>
            </div>

            <div className="relative z-10 w-full max-w-[400px] p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl">

                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                        {activeTab === 'login' ? 'Sign in to your account' : activeTab === 'register' ? 'Create an account' : 'Two-Factor Authentication'}
                    </h2>
                    <p className="text-sm text-slate-400 mt-2">
                        {activeTab === 'login' && 'Enter your email below to login to your account'}
                        {activeTab === 'register' && 'Enter your details below to create your account'}
                        {activeTab === '2fa' && 'Enter the 6-digit code from your authenticator app'}
                    </p>
                </div>

                {activeTab !== '2fa' && (
                    <div className="flex p-1 mb-6 bg-slate-950/50 border border-slate-800 rounded-lg">
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'login' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setActiveTab('register')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'register' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
                        >
                            Register
                        </button>
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleAuth}>

                    {activeTab === 'register' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-300">Username</label>
                            <input
                                type="text"
                                placeholder="johndoe"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>
                    )}

                    {(activeTab === 'login' || activeTab === 'register') && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-slate-300">Email</label>
                                <input
                                    type="email"
                                    placeholder="m.example@gmail.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium leading-none text-slate-300">Password</label>
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </>
                    )}

                    {activeTab === '2fa' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-300">Verification Code</label>
                            <input
                                type="text"
                                placeholder="123456"
                                required
                                maxLength={6}
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all tracking-widest text-center"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 bg-indigo-600 text-white hover:bg-indigo-500 h-10 w-full mt-4"
                    >
                        {activeTab === 'login' ? 'Sign in' : activeTab === 'register' ? 'Create account' : 'Verify Code'}
                    </button>

                    {activeTab === '2fa' && (
                        <button
                            type="button"
                            onClick={() => { setActiveTab('login'); setTwoFactorCode(''); }}
                            className="text-xs text-slate-400 hover:text-white mt-4 w-full text-center"
                        >
                            Back to login
                        </button>
                    )}
                </form>

            </div>
        </div>
    );
}