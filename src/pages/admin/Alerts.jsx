// src/pages/admin/Alerts.jsx
import React, { useState, useMemo } from 'react';
import { AlertOctagon, AlertTriangle, ShieldOff, MapPin, Monitor, Clock, XCircle, ArrowLeft, Activity, XOctagon, CheckCircle2 } from 'lucide-react';

export default function Alerts({ logs = [], fetchLogs }) {
    const [selectedAlert, setSelectedAlert] = useState(null);

    const handleResolveAlert = async (logId) => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/resolve-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logId })
            });
            if (res.ok) {
                if (selectedAlert && selectedAlert.id === logId) {
                    setSelectedAlert(null);
                }
                if (fetchLogs) fetchLogs();
            }
        } catch (e) {
            alert("Network error connecting to backend.");
        }
    };

    const handleLockAccount = async (username, logId) => {
        if (!window.confirm(`Are you sure you want to lock the account for ${username}? They will not be able to log in.`)) return;

        try {
            const res = await fetch('http://localhost:5000/api/admin/lock-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            if (res.ok) {
                if (logId) {
                    await fetch('http://localhost:5000/api/admin/resolve-alert', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ logId })
                    });
                }
                alert(`Account for ${username} has been successfully locked and alert dismissed.`);
                if (selectedAlert && selectedAlert.id === logId) {
                    setSelectedAlert(null);
                }
                if (fetchLogs) fetchLogs();
            } else {
                alert("Failed to lock account.");
            }
        } catch (e) {
            alert("Network error connecting to backend.");
        }
    };

    const alertsData = useMemo(() => {
        return logs
            .filter(log => log.risk_level === 'High Risk' || log.risk_level === 'Suspicious')
            .map(log => {
                let rules = [];
                try {
                    rules = JSON.parse(log.rules_triggered || '[]');
                } catch (e) { }

                const timeline = [];
                const logTime = new Date(log.login_time).toLocaleString();

                timeline.push({
                    time: logTime,
                    event: log.status.includes('Success') ? 'Successful Login Attempt' : 'Failed Login Attempt',
                    detail: `Authentication request recorded with status: ${log.status}.`,
                    ip: log.ip_address,
                    location: log.location,
                    device: log.device,
                    type: log.status.includes('Success') ? 'success' : 'error'
                });

                rules.forEach(rule => {
                    timeline.push({
                        time: logTime,
                        event: 'Anomaly Detected',
                        detail: `Rule Triggered: ${rule}`,
                        type: rule.includes('Failed') || rule.includes('Banned') ? 'error' : 'warning'
                    });
                });

                timeline.push({
                    time: logTime,
                    event: 'System Risk Assessment',
                    detail: `Final calculated risk score: ${log.risk_score}/100. Categorized as ${log.risk_level}.`,
                    type: 'alert'
                });

                return {
                    id: log.id,
                    user: log.username,
                    email: log.email,
                    type: log.risk_level,
                    score: log.risk_score,
                    time: logTime,
                    rulesTriggered: rules,
                    ip: log.ip_address,
                    device: log.device,
                    location: log.location,
                    status: 'Pending Review',
                    timeline: timeline
                };
            });
    }, [logs]);

    if (selectedAlert) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedAlert(null)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Alerts
                </button>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-800">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg mt-1 ${selectedAlert.type === 'High Risk' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                {selectedAlert.type === 'High Risk' ? <AlertOctagon className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{selectedAlert.user}</h2>
                                <p className="text-sm text-slate-500">{selectedAlert.email}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`text-sm font-bold px-2.5 py-1 rounded-md ${selectedAlert.type === 'High Risk' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                        }`}>
                                        Risk Score: {selectedAlert.score}/100
                                    </span>
                                    <span className="text-sm text-slate-500">{selectedAlert.status}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleLockAccount(selectedAlert.user, selectedAlert.id)}
                                className="bg-slate-950 border border-red-900/50 hover:bg-red-900/20 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                Lock Account
                            </button>
                            <button
                                onClick={() => handleResolveAlert(selectedAlert.id)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Resolve Alert
                            </button>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-white mb-6">Incident Timeline</h3>
                        <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 pb-4">
                            {selectedAlert.timeline.map((item, idx) => (
                                <div key={idx} className="relative pl-8">
                                    <div className={`absolute -left-[17px] top-1 rounded-full p-1.5 border-4 border-slate-900 ${item.type === 'error' ? 'bg-red-500 text-white' :
                                        item.type === 'success' ? 'bg-emerald-500 text-white' :
                                            item.type === 'warning' ? 'bg-amber-500 text-white' :
                                                'bg-indigo-500 text-white'
                                        }`}>
                                        {item.type === 'error' && <XOctagon className="w-4 h-4" />}
                                        {item.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                                        {item.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                                        {item.type === 'alert' && <Activity className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">{item.time}</span>
                                        <h4 className="text-base font-semibold text-white mt-3">{item.event}</h4>
                                        <p className="text-sm text-slate-400 mt-1">{item.detail}</p>
                                        {item.ip && item.location && (
                                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-slate-950/50 inline-flex px-3 py-2 rounded-lg border border-slate-800/50">
                                                <span className="flex items-center gap-1.5"><ShieldOff className="w-3.5 h-3.5" /> {item.ip}</span>
                                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {item.location}</span>
                                            </div>
                                        )}
                                        {item.device && (
                                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 bg-slate-950/50 inline-flex px-3 py-2 rounded-lg border border-slate-800/50">
                                                <span className="flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> {item.device}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (alertsData.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Security Alerts</h2>
                    <p className="text-sm text-slate-500 mt-1">Review and manage flagged login events based on risk scoring.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                    <ShieldOff className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No active alerts</h3>
                    <p className="text-slate-500">The system has not detected any suspicious or high-risk logins.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Security Alerts</h2>
                    <p className="text-sm text-slate-500 mt-1">Review and manage flagged login events based on risk scoring.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Mark All as Read
                    </button>
                </div>
            </div>

            <div className="grid gap-4 animate-fade-in">
                {alertsData.map((alert) => (
                    <div
                        key={alert.id}
                        className={`border rounded-xl p-6 ${alert.type === 'High Risk'
                            ? 'bg-red-500/5 border-red-500/20'
                            : 'bg-amber-500/5 border-amber-500/20'
                            }`}
                    >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg mt-1 ${alert.type === 'High Risk' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                    {alert.type === 'High Risk' ? <AlertOctagon className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-white">{alert.user}</h3>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${alert.type === 'High Risk' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            Score: {alert.score}
                                        </span>
                                        <span className="text-xs text-slate-500">{alert.time}</span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <ShieldOff className="w-4 h-4 text-slate-500" />
                                            IP: <span className="font-mono text-slate-300">{alert.ip}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <MapPin className="w-4 h-4 text-slate-500" />
                                            Location Anomaly
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <Monitor className="w-4 h-4 text-slate-500 truncate max-w-[200px]" title={alert.device} />
                                            Device Trigger
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <Clock className="w-4 h-4 text-slate-500" />
                                            Time Anomaly
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Rules Triggered</p>
                                        <div className="flex flex-wrap gap-2">
                                            {alert.rulesTriggered.map((rule, idx) => (
                                                <span key={idx} className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-md">
                                                    {rule}
                                                </span>
                                            ))}
                                            {alert.rulesTriggered.length === 0 && (
                                                <span className="text-xs text-slate-500">Manual review recommended</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 min-w-[140px]">
                                {alert.status === 'Pending Review' ? (
                                    <>
                                        <button
                                            onClick={() => setSelectedAlert(alert)}
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Investigate
                                        </button>
                                        <button
                                            onClick={() => handleLockAccount(alert.user, alert.id)}
                                            className="w-full bg-slate-900 border border-red-900/50 hover:bg-red-900/20 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Lock Account
                                        </button>
                                        <button
                                            onClick={() => handleResolveAlert(alert.id)}
                                            className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-full text-center px-4 py-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium">
                                        Resolved
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}