import { Routes, Route, Navigate } from 'react-router-dom'
import Auth from './pages/Auth'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import Debug from './pages/admin/Debug'

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/auth" />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/debug" element={<Debug />} />
        </Routes>
    )
}