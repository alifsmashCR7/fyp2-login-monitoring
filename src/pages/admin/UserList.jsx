// src/pages/admin/UserList.jsx
import React, { useState, useEffect } from 'react';
import { Shield, ShieldOff, MapPin, Monitor, Server, Lock, Unlock } from 'lucide-react';

export default function UserList() {
    const [users, setUsers] = useState([]);

    const fetchUsers = () => {
        fetch('http://localhost:5000/api/admin/users')
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleLock = async (username, isLocked) => {
        const endpoint = isLocked ? 'unlock-user' : 'lock-user';
        try {
            await fetch(`http://localhost:5000/api/admin/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            fetchUsers();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-10rem)] relative animate-fade-in">
            <div className="p-6 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-white">User Management</h2>
                <p className="text-sm text-slate-500 mt-1">Manage all registered users, their original locations, and access status.</p>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 shadow-sm z-10">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Original IP</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Original Location</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Original Device</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-white">{user.username}</div>
                                    <div className="text-xs text-slate-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-400 font-mono text-xs">{user.reg_ip}</td>
                                <td className="px-6 py-4 text-sm text-slate-400">{user.reg_location}</td>
                                <td className="px-6 py-4 text-sm text-slate-300 max-w-[150px] truncate" title={user.reg_device}>{user.reg_device}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${user.is_locked === 1 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>
                                        {user.is_locked === 1 ? 'Locked' : 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => toggleLock(user.username, user.is_locked === 1)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${user.is_locked === 1
                                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                            }`}
                                    >
                                        {user.is_locked === 1 ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                        {user.is_locked === 1 ? 'Unlock' : 'Lock'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        No users retrieved.
                    </div>
                )}
            </div>
        </div>
    );
}