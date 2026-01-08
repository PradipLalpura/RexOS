// RexOS Dashboard - Main Hub

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRex } from '../../store/RexContext';
import { formatDate, getDayName } from '../../utils/storage';
import { getDailyOverallRating, calculateHabitRating, calculateWorkoutRating, calculateDietRating } from '../../utils/ratings';
import './Dashboard.css';

export default function Dashboard() {
    const { state } = useRex();
    const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

    const today = new Date();
    const dayName = getDayName(new Date(selectedDate));
    const isToday = selectedDate === formatDate(today);

    const overallRating = getDailyOverallRating(state, selectedDate);
    const habitRating = calculateHabitRating(state, selectedDate);
    const workoutRating = calculateWorkoutRating(state, selectedDate);
    const dietRating = calculateDietRating(state, selectedDate);

    // Calculate habit completion
    const habitRecord = state.habitRecords.find(r => r.date === selectedDate);
    const completedHabits = habitRecord?.logs.filter(l => l.completed).length || 0;
    const totalHabits = state.habits.length;

    // Get diet totals
    const dietLog = state.dietLogs.find(l => l.date === selectedDate);
    const dietTotals = dietLog?.meals.reduce(
        (acc, m) => ({
            calories: acc.calories + m.calories,
            protein: acc.protein + m.protein,
        }),
        { calories: 0, protein: 0 }
    ) || { calories: 0, protein: 0 };

    // Check workout completion
    const workoutLog = state.workoutLogs.find(l => l.date === selectedDate);
    const workoutCompleted = workoutLog && workoutLog.exercises.length > 0;

    const navigateDays = (offset: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + offset);
        setSelectedDate(formatDate(date));
    };

    return (
        <div className="dashboard animate-fadeIn">
            {/* Header */}
            <header className="dashboard-header">
                <div className="greeting">
                    <h1>
                        {isToday ? 'Today' : dayName}
                        <span className="date-display">
                            {new Date(selectedDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </span>
                    </h1>
                    <p className="greeting-sub">
                        {state.profile?.name ? `Execute, ${state.profile.name}.` : 'Execute.'}
                    </p>
                </div>

                <div className="date-nav">
                    <button className="btn btn-ghost btn-icon" onClick={() => navigateDays(-1)}>←</button>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setSelectedDate(formatDate(new Date()))}
                        disabled={isToday}
                    >
                        Today
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => navigateDays(1)}>→</button>
                </div>
            </header>

            {/* Overall Rating */}
            <div className={`overall-rating rating-${overallRating.type}`}>
                <div className="rating-score">
                    <span className="score-value">{Math.round(overallRating.score)}</span>
                    <span className="score-label">/ 100</span>
                </div>
                <p className="rating-message">{overallRating.message}</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid">
                {/* Habits Card */}
                <Link to="/habits" className="stat-card">
                    <div className="stat-header">
                        <span className="stat-icon">🎯</span>
                        <span className={`stat-badge badge-${habitRating.type}`}>
                            {habitRating.type === 'excellent' ? 'Perfect' :
                                habitRating.type === 'good' ? 'Good' :
                                    habitRating.type === 'warning' ? 'Needs Work' : 'Behind'}
                        </span>
                    </div>
                    <div className="stat-content">
                        <h3>Habits</h3>
                        <div className="stat-value">
                            <span className="big-number">{completedHabits}</span>
                            <span className="divider">/</span>
                            <span className="total">{totalHabits}</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className={`progress-fill progress-fill-${habitRating.type === 'excellent' ? 'success' : habitRating.type === 'good' ? 'primary' : habitRating.type === 'warning' ? 'warning' : 'danger'}`}
                                style={{ width: `${totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                    <span className="stat-action">Log habits →</span>
                </Link>

                {/* Workout Card */}
                <Link to="/workout" className="stat-card">
                    <div className="stat-header">
                        <span className="stat-icon">💪</span>
                        <span className={`stat-badge badge-${workoutRating.type}`}>
                            {workoutCompleted ? 'Completed' : 'Pending'}
                        </span>
                    </div>
                    <div className="stat-content">
                        <h3>Workout</h3>
                        <div className="stat-value">
                            {workoutCompleted ? (
                                <>
                                    <span className="big-number">{workoutLog?.exercises.length}</span>
                                    <span className="unit">exercises</span>
                                </>
                            ) : (
                                <span className="pending-text">Not started</span>
                            )}
                        </div>
                        <p className="stat-sub">{dayName}'s training</p>
                    </div>
                    <span className="stat-action">Log workout →</span>
                </Link>

                {/* Diet Card */}
                <Link to="/diet" className="stat-card">
                    <div className="stat-header">
                        <span className="stat-icon">🥗</span>
                        <span className={`stat-badge badge-${dietRating.type}`}>
                            {dietRating.type === 'excellent' ? 'On Track' :
                                dietRating.type === 'good' ? 'Close' :
                                    dietRating.type === 'warning' ? 'Behind' : 'Track It'}
                        </span>
                    </div>
                    <div className="stat-content">
                        <h3>Nutrition</h3>
                        <div className="stat-value">
                            <span className="big-number">{dietTotals.calories}</span>
                            <span className="unit">/ {state.dietTargets?.calories || 0} kcal</span>
                        </div>
                        <div className="stat-secondary">
                            <span>{dietTotals.protein}g protein</span>
                            <span>Target: {state.dietTargets?.protein || 0}g</span>
                        </div>
                    </div>
                    <span className="stat-action">Log meals →</span>
                </Link>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <Link to="/analytics" className="action-btn">
                    <span>📊</span> Analytics
                </Link>
                <Link to="/report" className="action-btn">
                    <span>📄</span> Weekly Report
                </Link>
                <Link to="/profile" className="action-btn">
                    <span>👤</span> Profile
                </Link>
            </div>
        </div>
    );
}
