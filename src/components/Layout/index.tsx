// RexOS Layout Component

import { Outlet, NavLink } from 'react-router-dom';
import { useRex } from '../../store/RexContext';
import './Layout.css';

const NAV_ITEMS = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/habits', icon: '🎯', label: 'Habits' },
    { path: '/workout', icon: '💪', label: 'Workout' },
    { path: '/diet', icon: '🥗', label: 'Diet' },
    { path: '/notes', icon: '📝', label: 'Notes' },
    { path: '/analytics', icon: '📊', label: 'Analytics' },
    { path: '/report', icon: '📄', label: 'Report' },
    { path: '/profile', icon: '👤', label: 'Profile' },
];

export default function Layout() {
    const { state } = useRex();

    return (
        <div className="app-layout">
            {/* Top Bar */}
            <header className="app-header">
                <NavLink to="/dashboard" className="logo">
                    <span className="gradient-text">REX</span>OS
                </NavLink>

                <nav className="desktop-nav">
                    {NAV_ITEMS.slice(0, 5).map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="header-actions">
                    <NavLink to="/profile" className="profile-btn">
                        <span className="profile-avatar">
                            {state.profile?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                    </NavLink>
                </div>
            </header>

            {/* Main Content */}
            <main className="app-main">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-nav">
                {NAV_ITEMS.slice(0, 5).map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
