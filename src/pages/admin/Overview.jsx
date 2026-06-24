import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { ShieldAlert, Users, Activity, ShieldCheck } from 'lucide-react';

export default function Overview({ logs = [] }) {

    const totalLogs = logs.length;
    const normalCount = logs.filter(l => l.risk_level === 'Normal').length;
    const suspiciousCount = logs.filter(l => l.risk_level === 'Suspicious').length;
    const highRiskCount = logs.filter(l => l.risk_level === 'High Risk').length;

    const riskData = [
        { name: 'Normal', value: normalCount, color: '#10b981' },
        { name: 'Suspicious', value: suspiciousCount, color: '#f59e0b' },
        { name: 'High Risk', value: highRiskCount, color: '#ef4444' },
    ];

    const timeData = useMemo(() => {
        const blocks = [
            { time: '00:00', normal: 0, suspicious: 0, highRisk: 0 },
            { time: '04:00', normal: 0, suspicious: 0, highRisk: 0 },
            { time: '08:00', normal: 0, suspicious: 0, highRisk: 0 },
            { time: '12:00', normal: 0, suspicious: 0, highRisk: 0 },
            { time: '16:00', normal: 0, suspicious: 0, highRisk: 0 },
            { time: '20:00', normal: 0, suspicious: 0, highRisk: 0 }
        ];

        logs.forEach(log => {
            const hour = new Date(log.login_time).getHours();
            let blockIndex = Math.floor(hour / 4);
            if (blockIndex > 5) blockIndex = 5;

            if (log.risk_level === 'Normal') blocks[blockIndex].normal++;
            else if (log.risk_level === 'Suspicious') blocks[blockIndex].suspicious++;
            else if (log.risk_level === 'High Risk') blocks[blockIndex].highRisk++;
        });

        return blocks;
    }, [logs]);

    const ruleData = useMemo(() => {
        const ruleCounts = {};
        logs.forEach(log => {
            try {
                const rules = JSON.parse(log.rules_triggered || '[]');
                rules.forEach(rule => {
                    ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
                });
            } catch (e) { }
        });

        return Object.keys(ruleCounts).map(rule => ({
            rule: rule, count: ruleCounts[rule]
        })).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [logs]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-400">Total Logins</h3>
                        <Activity className="w-5 h-5 text-indigo-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{totalLogs}</p>
                    <p className="text-xs text-emerald-400 mt-2 flex items-center">
                        Active Database Records
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-400">Normal Events</h3>
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{normalCount}</p>
                    <p className="text-xs text-slate-500 mt-2">Routine traffic</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-400">Suspicious</h3>
                        <Users className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{suspiciousCount}</p>
                    <p className="text-xs text-amber-400 mt-2 flex items-center">
                        Events to monitor
                    </p>
                </div>

                <div className="bg-slate-900 border border-red-900/50 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className="text-sm font-medium text-slate-400">High Risk</h3>
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-white relative z-10">{highRiskCount}</p>
                    <p className="text-xs text-red-400 mt-2 relative z-10 flex items-center">
                        Critical attention needed
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-base font-semibold text-white mb-6">Login Volume Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Line type="monotone" dataKey="normal" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="suspicious" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="highRisk" stroke="#ef4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-base font-semibold text-white mb-6">Risk Distribution</h3>
                    <div className="h-[300px] w-full flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie
                                    data={riskData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {riskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex gap-4 mt-4 w-full justify-center">
                            {riskData.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-xs text-slate-400">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-base font-semibold text-white mb-6">Common Rule Triggers</h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ruleData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                            <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <YAxis dataKey="rule" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={150} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem' }}
                                cursor={{ fill: '#1e293b' }}
                            />
                            <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}