// src/pages/admin/LoginLogs.jsx
import React, { useState } from 'react';
import { Search, Filter, Download, X, CheckCircle2, XCircle, Shield, Clock, MapPin, Monitor, Server, AlertTriangle } from 'lucide-react';

export default function LoginLogs({ logs = [] }) {
    const [selectedLog, setSelectedLog] = useState(null);
    const [expandedRule, setExpandedRule] = useState(null);

    const getRuleStatus = (rulesString, ruleName) => {
        try {
            const rules = JSON.parse(rulesString || '[]');
            return !rules.some(r => r.includes(ruleName));
        } catch (e) {
            return true;
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-10rem)] relative">
            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-white">System-Wide Login Logs</h2>
                    <p className="text-sm text-slate-500 mt-1">Complete audit trail of all authentication events.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search users or IPs..."
                            className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                        />
                    </div>
                    <button className="bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button className="bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 shadow-sm z-10">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">IP Address</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Device / Browser</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk Level</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {logs.map((log) => (
                            <tr
                                key={log.id}
                                onClick={() => {
                                    setSelectedLog(log);
                                    setExpandedRule(null);
                                }}
                                className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">{new Date(log.login_time).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-white">{log.username}</div>
                                    <div className="text-xs text-slate-500">{log.email}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-400 font-mono text-xs">{log.ip_address}</td>
                                <td className="px-6 py-4 text-sm text-slate-300 max-w-[150px] truncate" title={log.device}>{log.device}</td>
                                <td className="px-6 py-4 text-sm text-slate-400 truncate max-w-[150px]">{log.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${log.status.includes('Success') ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${log.risk_level === 'Normal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        log.risk_level === 'Suspicious' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                        {log.risk_level}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        No logs retrieved from backend yet.
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900">
                <p className="text-sm text-slate-500">Showing {logs.length > 0 ? 1 : 0} to {logs.length} of {logs.length} entries</p>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-400 rounded hover:text-white disabled:opacity-50" disabled>Prev</button>
                    <button className="px-3 py-1 bg-indigo-600 text-white rounded">1</button>
                    <button className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-400 rounded hover:text-white disabled:opacity-50" disabled>Next</button>
                </div>
            </div>

            {selectedLog && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">

                        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    Session Details
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${selectedLog.risk_level === 'Normal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        selectedLog.risk_level === 'Suspicious' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                        {selectedLog.risk_level}
                                    </span>
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Log ID: {selectedLog.id} • {new Date(selectedLog.login_time).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">User & Connection Overview</h4>
                                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                                            <div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
                                                <span className="text-slate-400 text-sm">Account</span>
                                                <span className="text-white font-medium">{selectedLog.username} <span className="text-slate-500 text-xs">({selectedLog.email})</span></span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
                                                <span className="text-slate-400 text-sm">IP Address</span>
                                                <span className="text-white font-mono text-sm">{selectedLog.ip_address}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
                                                <span className="text-slate-400 text-sm">Location</span>
                                                <span className="text-white text-sm">{selectedLog.location}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
                                                <span className="text-slate-400 text-sm">Authentication</span>
                                                <span className={`text-sm font-medium ${selectedLog.status.includes('Success') ? 'text-emerald-400' : 'text-red-400'}`}>{selectedLog.status}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 text-sm">Calculated Risk Score</span>
                                                <span className="text-white font-bold">{selectedLog.risk_score} / 100</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Raw User-Agent Header</h4>
                                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-indigo-300 break-all leading-relaxed">
                                            {selectedLog.device}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">7-Point Security Check</h4>
                                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">

                                        {[
                                            { name: 'Banned IP Address', label: 'IP Reputation Status', desc: 'Checks if IP belongs to a known malicious ISP', icon: Shield },
                                            { name: 'Different IP from Registration', label: 'IP Baseline Match', desc: 'Compares IP with original registration IP', icon: Server },
                                            { name: 'Different Location from Registration', label: 'Geographical Consistency', desc: 'Compares location with origin location', icon: MapPin },
                                            { name: 'Unrecognized Device/Browser', label: 'Browser Fingerprint', desc: 'Checks user-agent matching history', icon: Monitor },
                                            { name: 'OS/System Change', label: 'OS Integrity Match', desc: 'Verifies platform details remain consistent', icon: Monitor },
                                            { name: 'Multiple Failed Attempts', label: 'Rate Limit / Brute Force', desc: 'Detects >= 3 failed logins in 15 mins', icon: AlertTriangle },
                                            { name: 'Unusual Time', label: 'Time Anomaly (GMT+8)', desc: 'Detects logins during unusual hours (1AM-5AM)', icon: Clock }
                                        ].map((rule, idx) => {
                                            const isOk = getRuleStatus(selectedLog.rules_triggered, rule.name);
                                            const Icon = rule.icon;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${isOk ? 'hover:bg-slate-900/50' : 'bg-red-500/5 border border-red-500/10 mb-1 hover:bg-red-500/10'}`}
                                                    onClick={() => setExpandedRule(expandedRule === idx ? null : idx)}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`mt-1 ${isOk ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            {isOk ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center">
                                                                <h5 className={`text-sm font-semibold ${isOk ? 'text-slate-200' : 'text-red-400'}`}>{rule.label}</h5>
                                                                <span className={`text-xs font-bold ${isOk ? 'text-emerald-500' : 'text-red-400'}`}>{isOk ? 'OK' : 'FAILED'}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-0.5">{rule.desc}</p>
                                                        </div>
                                                    </div>

                                                    {expandedRule === idx && (
                                                        <div className="mt-3 ml-9 p-3 bg-slate-900/80 rounded-lg border border-slate-700/50 text-xs text-slate-300 animate-fade-in">
                                                            {rule.name === 'Different Location from Registration' && (
                                                                <div className="flex flex-col gap-1.5">
                                                                    <div><span className="text-slate-500 font-medium">Original Location:</span> {selectedLog.reg_location || 'Unknown'}</div>
                                                                    <div><span className="text-slate-500 font-medium">Current Attempt:</span> {selectedLog.location}</div>
                                                                </div>
                                                            )}
                                                            {rule.name === 'Different IP from Registration' && (
                                                                <div className="flex flex-col gap-1.5">
                                                                    <div><span className="text-slate-500 font-medium">Original IP:</span> <span className="font-mono">{selectedLog.reg_ip || 'Unknown'}</span></div>
                                                                    <div><span className="text-slate-500 font-medium">Current Attempt:</span> <span className="font-mono">{selectedLog.ip_address}</span></div>
                                                                </div>
                                                            )}
                                                            {rule.name === 'Unrecognized Device/Browser' && (
                                                                <div className="flex flex-col gap-1.5">
                                                                    <div><span className="text-slate-500 font-medium">Original Device:</span> <div className="break-all mt-1 p-1 bg-slate-950 rounded">{selectedLog.reg_device || 'Unknown'}</div></div>
                                                                    <div><span className="text-slate-500 font-medium">Current Attempt:</span> <div className="break-all mt-1 p-1 bg-slate-950 rounded">{selectedLog.device}</div></div>
                                                                </div>
                                                            )}
                                                            {rule.name === 'Banned IP Address' && (
                                                                <div>This IP address is matched against the administrative banlist.</div>
                                                            )}
                                                            {rule.name === 'Multiple Failed Attempts' && (
                                                                <div>Detected 3 or more failed login attempts within the last 15 minutes.</div>
                                                            )}
                                                            {rule.name === 'Unusual Time' && (
                                                                <div>Login attempted outside normal operating hours (1 AM - 5 AM local time).</div>
                                                            )}
                                                            {rule.name === 'OS/System Change' && (
                                                                <div>System integrity verification detected a potential change in the operating system structure.</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}