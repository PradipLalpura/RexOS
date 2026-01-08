// RexOS Habit Tracker

import { useState } from 'react';
import { useRex } from '../../store/RexContext';
import { formatDate, getDayName, formatTime } from '../../utils/storage';
import { calculateHabitRating } from '../../utils/ratings';
import './HabitTracker.css';

export default function HabitTracker() {
    const { state, dispatch } = useRex();
    const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

    const dayName = getDayName(new Date(selectedDate));
    const isToday = selectedDate === formatDate(new Date());
    const rating = calculateHabitRating(state, selectedDate);

    const habitRecord = state.habitRecords.find(r => r.date === selectedDate);

    const isHabitCompleted = (habitId: string): boolean => {
        return habitRecord?.logs.some(l => l.habitId === habitId && l.completed) || false;
    };

    const getCompletedTime = (habitId: string): string | null => {
        const log = habitRecord?.logs.find(l => l.habitId === habitId);
        return log?.completedAt || null;
    };

    const toggleHabit = (habitId: string) => {
        const currentlyCompleted = isHabitCompleted(habitId);

        dispatch({
            type: 'LOG_HABIT',
            payload: {
                date: selectedDate,
                log: {
                    habitId,
                    completed: !currentlyCompleted,
                    completedAt: !currentlyCompleted ? new Date().toISOString() : undefined,
                },
            },
        });
    };

    const navigateDays = (offset: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + offset);
        setSelectedDate(formatDate(date));
    };

    const completedCount = state.habits.filter(h => isHabitCompleted(h.id)).length;
    const progressPercent = state.habits.length > 0
        ? (completedCount / state.habits.length) * 100
        : 0;

    return (
        <div className="habit-tracker animate-fadeIn">
            <header className="tracker-header">
                <div>
                    <h1>Habit Tracker</h1>
                    <p className="tracker-subtitle">
                        {isToday ? 'Today' : dayName} - {new Date(selectedDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric'
                        })}
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

            {/* Progress Overview */}
            <div className={`habit-progress rating-${rating.type}`}>
                <div className="progress-stats">
                    <div className="progress-number">
                        <span className="completed">{completedCount}</span>
                        <span className="separator">/</span>
                        <span className="total">{state.habits.length}</span>
                    </div>
                    <p className="progress-label">Habits Completed</p>
                </div>

                <div className="progress-bar-container">
                    <div className="progress-bar large">
                        <div
                            className={`progress-fill progress-fill-${rating.type === 'excellent' ? 'success' : rating.type === 'good' ? 'primary' : rating.type === 'warning' ? 'warning' : 'danger'}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="progress-message">{rating.message}</p>
                </div>
            </div>

            {/* Habit List */}
            <div className="habit-list">
                {state.habits.map((habit) => {
                    const completed = isHabitCompleted(habit.id);
                    const completedAt = getCompletedTime(habit.id);

                    return (
                        <div
                            key={habit.id}
                            className={`habit-item ${completed ? 'completed' : ''}`}
                            onClick={() => toggleHabit(habit.id)}
                        >
                            <div className={`habit-checkbox ${completed ? 'checked' : ''}`}>
                                {completed && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>

                            <div className="habit-info">
                                <div className="habit-top">
                                    <span className="habit-icon">{habit.icon}</span>
                                    <span className="habit-name">{habit.name}</span>
                                </div>
                                <p className="habit-description">{habit.description}</p>
                            </div>

                            {completed && completedAt && (
                                <div className="habit-time">
                                    <span className="time-label">Completed at</span>
                                    <span className="time-value">
                                        {formatTime(new Date(completedAt))}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {state.habits.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h3 className="empty-state-title">No habits configured</h3>
                    <p className="empty-state-text">
                        Complete registration to set up your daily habits.
                    </p>
                </div>
            )}
        </div>
    );
}
