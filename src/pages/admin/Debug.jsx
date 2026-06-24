import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ShieldAlert, Activity, CheckCircle2, UserPlus, Database, Settings2 } from 'lucide-react';

export default function Debug() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [status, setStatus] = useState('Success');

    const [manualIp, setManualIp] = useState('');
    const [manualLocation, setManualLocation] = useState('');
    const [manualDevice, setManualDevice] = useState('');
    const [manualTime, setManualTime] = useState('');
    const [bulkCount, setBulkCount] = useState(1);

    const [rules, setRules] = useState({
        bannedIp: false,
        multipleFails: false,
        diffIp: false,
        diffLoc: false,
        unrecognizedDevice: false,
        osSystemChange: false,
        unusualTime: false
    });

    useEffect(() => {
        const isAuth = sessionStorage.getItem('adminAuth');
        if (isAuth !== 'true') {
            navigate('/auth');
        } else {
            fetchUsers();
        }
    }, [navigate]);

    const fetchUsers = () => {
        fetch('http://localhost:5000/api/admin/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setUsers(data);
                    if (data.length > 0 && !selectedUserId) setSelectedUserId(data[0].id);
                }
            })
            .catch(err => console.error(err));
    };

    const handleAddTempUser = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/debug/add-user', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert(`Temporary user created! Username: ${data.username} (Password: password123)`);
                fetchUsers();
                setSelectedUserId(data.id);
            }
        } catch (e) {
            alert("Error creating temporary user");
        }
    };

    const handleRuleToggle = (rule) => {
        setRules(prev => ({ ...prev, [rule]: !prev[rule] }));
    };

    const calculateScore = () => {
        let score = 0;
        if (rules.bannedIp) score += 100;
        if (rules.multipleFails) score += 40;
        if (rules.diffIp) score += 20;
        if (rules.diffLoc) score += 20;
        if (rules.unrecognizedDevice) score += 20;
        if (rules.osSystemChange) score += 20;
        if (rules.unusualTime) score += 20;
        return score;
    };

    const getLevel = (score) => {
        if (score >= 70) return 'High Risk';
        if (score >= 30) return 'Suspicious';
        return 'Normal';
    };

    const handleInject = async () => {
        if (!selectedUserId) return alert("Please select a user first.");

        let triggered = [];
        if (rules.bannedIp) triggered.push('Banned IP Address');
        if (rules.multipleFails) triggered.push('Multiple Failed Attempts');
        if (rules.diffIp) triggered.push('Different IP from Registration');
        if (rules.diffLoc) triggered.push('Different Location from Registration');
        if (rules.unrecognizedDevice) triggered.push('Unrecognized Device/Browser');
        if (rules.osSystemChange) triggered.push('OS/System Change');
        if (rules.unusualTime) triggered.push('Unusual Time (GMT+8)');

        const score = calculateScore();
        const level = getLevel(score);

        const baseIp = rules.bannedIp ? '89.187.160.40' : rules.diffIp ? '198.51.100.22' : '192.168.1.45';
        const baseDevice = rules.unrecognizedDevice ? 'Mozilla/5.0 (Unknown Browser 1.0)' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
        const baseLocation = rules.diffLoc ? 'Moscow, Russia' : 'Kajang, Malaysia';
        const baseTime = rules.unusualTime ? new Date(new Date().setHours(3, 0, 0, 0)).toISOString() : new Date().toISOString();

        const payload = {
            userId: selectedUserId,
            ipAddress: manualIp || baseIp,
            device: manualDevice || baseDevice,
            location: manualLocation || baseLocation,
            status: status,
            riskLevel: level,
            riskScore: score,
            rulesTriggered: triggered,
            customTime: manualTime ? new Date(manualTime).toISOString() : baseTime
        };

        try {
            for (let i = 0; i < bulkCount; i++) {
                await fetch('http://localhost:5000/api/debug/inject-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            alert(`Successfully injected ${bulkCount} simulated log(s) into database!`);
        } catch (e) {
            alert("Error injecting log");
        }
    };

    const handleClearLogs = async () => {
        if (!window.confirm("Are you sure you want to delete ALL login logs from the database?")) return;
        try {
            const res = await fetch('http://localhost:5000/api/debug/clear-logs', { method: 'DELETE' });
            if (res.ok) alert("All logs cleared.");
        } catch (e) {
            alert("Error clearing logs");
        }
    };

    const currentScore = calculateScore();
    const currentLevel = getLevel(currentScore);

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-300 p-4 md:p-8 animate-fade-in">
            <header className="max-w-5xl mx-auto flex items-center justify-between pb-6 mb-6 border-b border-slate-800/60">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin')} className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-amber-500 tracking-tight flex items-center gap-2">
                            <Activity className="w-6 h-6" /> Debug & Simulation Tools
                        </h1>
                        <p className="text-sm text-slate-500">Inject raw data into the system to test dashboard visualizations.</p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                            <h2 className="text-lg font-semibold text-white">Scenario Builder</h2>
                            <button
                                onClick={handleAddTempUser}
                                className="bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
                            >
                                <UserPlus className="w-3.5 h-3.5" /> Quick Add Temp User
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Target User</label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-white focus:outline-none focus:border-amber-500"
                                >
                                    {users.length === 0 && <option value="">No users found</option>}
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Login Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-white focus:outline-none focus:border-amber-500"
                                >
                                    <option value="Success">Success</option>
                                    <option value="Failed">Failed</option>
                                    <option value="Failed (Invalid 2FA)">Failed (Invalid 2FA)</option>
                                </select>
                            </div>
                        </div>

                        <h3 className="text-sm font-medium text-slate-400 mb-4">Toggle 7-Point Security Check Rules</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { key: 'bannedIp', label: 'Banned IP Address', score: '+100' },
                                { key: 'multipleFails', label: 'Multiple Failed Attempts', score: '+40' },
                                { key: 'diffIp', label: 'Different IP from Registration', score: '+20' },
                                { key: 'diffLoc', label: 'Different Location from Registration', score: '+20' },
                                { key: 'unrecognizedDevice', label: 'Unrecognized Device/Browser', score: '+20' },
                                { key: 'osSystemChange', label: 'OS/System Change', score: '+20' },
                                { key: 'unusualTime', label: 'Unusual Time (GMT+8)', score: '+20' }
                            ].map((rule) => (
                                <button
                                    key={rule.key}
                                    onClick={() => handleRuleToggle(rule.key)}
                                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${rules[rule.key] ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                >
                                    <span className="text-sm font-medium">{rule.label}</span>
                                    <span className="text-xs font-bold">{rule.score}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                            <Settings2 className="w-4 h-4" /> Advanced Overrides (Optional)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Custom IP Address"
                                value={manualIp}
                                onChange={e => setManualIp(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-white focus:outline-none focus:border-amber-500 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Custom Location"
                                value={manualLocation}
                                onChange={e => setManualLocation(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-white focus:outline-none focus:border-amber-500 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Custom Device / User Agent"
                                value={manualDevice}
                                onChange={e => setManualDevice(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-white focus:outline-none focus:border-amber-500 text-sm"
                            />
                            <input
                                type="datetime-local"
                                value={manualTime}
                                onChange={e => setManualTime(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-white focus:outline-none focus:border-amber-500 text-sm [color-scheme:dark]"
                            />
                            <div className="sm:col-span-2 flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                <Database className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-400 font-medium">Bulk Inject Count:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={bulkCount}
                                    onChange={e => setBulkCount(Number(e.target.value))}
                                    className="w-24 bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-md focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6 border-b border-slate-800 pb-4">Payload Preview</h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Calculated Score</span>
                                <span className={`text-2xl font-bold ${currentScore >= 70 ? 'text-red-500' : currentScore >= 30 ? 'text-amber-500' : 'text-emerald-500'
                                    }`}>{currentScore}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Assigned Risk Level</span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${currentLevel === 'High Risk' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                                    currentLevel === 'Suspicious' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' :
                                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                                    }`}>{currentLevel}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                                <span className="text-sm text-slate-400">Total Logs to Inject</span>
                                <span className="text-sm font-bold text-white">{bulkCount}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleInject}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium h-12 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        >
                            <CheckCircle2 className="w-5 h-5" /> Inject Scenario Log
                        </button>
                    </div>

                    <div className="bg-slate-900 border border-red-900/50 rounded-xl p-6">
                        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Danger Zone
                        </h2>
                        <p className="text-xs text-slate-500 mb-4">This will permanently delete all login logs from the database, resetting all dashboard charts to zero.</p>
                        <button
                            onClick={handleClearLogs}
                            className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-medium h-10 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Clear Database Logs
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}