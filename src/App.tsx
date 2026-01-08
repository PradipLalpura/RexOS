// RexOS Main Application

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RexProvider, useRex } from './store/RexContext';
import Layout from './components/Layout';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import Workout from './pages/Workout';
import Diet from './pages/Diet';
import Analytics from './pages/Analytics';
import Report from './pages/Report';
import Notes from './pages/Notes';
import Profile from './pages/Profile';
import './styles/global.css';
import './styles/components.css';
import './components/Layout/Layout.css';
import './pages/Dashboard/Dashboard.css';
import './pages/Habits/HabitTracker.css';
import './pages/Workout/WorkoutTracker.css';
import './pages/Diet/DietTracker.css';
import './pages/Analytics/Analytics.css';
import './pages/Report/WeeklyReport.css';
import './pages/Notes/Notes.css';
import './pages/Profile/Profile.css';

function AppRoutes() {
  const { state } = useRex();

  // If not registered, show registration
  if (!state.isRegistered) {
    return (
      <Routes>
        <Route path="*" element={<Registration />} />
      </Routes>
    );
  }

  // Otherwise show main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/diet" element={<Diet />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/report" element={<Report />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <RexProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </RexProvider>
  );
}
