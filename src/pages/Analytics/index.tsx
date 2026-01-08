// RexOS Analytics Dashboard

import { useState, useMemo } from 'react';
import { useRex } from '../../store/RexContext';
import { formatDate } from '../../utils/storage';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './Analytics.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

type TimeFilter = 'day' | 'week' | 'month' | '6months' | 'year';

export default function Analytics() {
    const { state } = useRex();
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
    const [activeTab, setActiveTab] = useState<'habits' | 'workout' | 'diet'>('habits');

    const getDates = (): string[] => {
        const dates: string[] = [];
        const today = new Date();
        let daysCount = 7;

        switch (timeFilter) {
            case 'day': daysCount = 1; break;
            case 'week': daysCount = 7; break;
            case 'month': daysCount = 30; break;
            case '6months': daysCount = 180; break;
            case 'year': daysCount = 365; break;
        }

        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dates.push(formatDate(d));
        }

        return dates;
    };

    const dates = getDates();

    const getLabels = (): string[] => {
        if (timeFilter === 'day') {
            return ['Today'];
        }
        return dates.map(d => {
            const date = new Date(d);
            if (timeFilter === 'week') {
                return date.toLocaleDateString('en-US', { weekday: 'short' });
            } else if (timeFilter === 'month') {
                return date.getDate().toString();
            } else {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        });
    };

    // Habit Data
    const habitData = useMemo(() => {
        const totalHabits = state.habits.length;
        if (totalHabits === 0) return [];

        return dates.map(date => {
            const record = state.habitRecords.find(r => r.date === date);
            const completed = record?.logs.filter(l => l.completed).length || 0;
            return (completed / totalHabits) * 100;
        });
    }, [dates, state.habits, state.habitRecords]);

    // Workout Data
    const workoutData = useMemo(() => {
        return dates.map(date => {
            const log = state.workoutLogs.find(l => l.date === date);
            if (!log) return 0;
            // Calculate total volume
            return log.exercises.reduce((acc, e) => {
                return acc + e.sets.reduce((setAcc, s) => setAcc + s.reps * s.weight, 0);
            }, 0);
        });
    }, [dates, state.workoutLogs]);

    // Diet Data
    const dietData = useMemo(() => {
        return {
            calories: dates.map(date => {
                const log = state.dietLogs.find(l => l.date === date);
                return log?.meals.reduce((acc, m) => acc + m.calories, 0) || 0;
            }),
            protein: dates.map(date => {
                const log = state.dietLogs.find(l => l.date === date);
                return log?.meals.reduce((acc, m) => acc + m.protein, 0) || 0;
            }),
        };
    }, [dates, state.dietLogs]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#64748b',
                },
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#64748b',
                },
            },
        },
    };

    const habitChartData = {
        labels: getLabels(),
        datasets: [
            {
                label: 'Habit Completion %',
                data: habitData,
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const workoutChartData = {
        labels: getLabels(),
        datasets: [
            {
                label: 'Volume (kg)',
                data: workoutData,
                backgroundColor: '#22c55e',
                borderRadius: 4,
            },
        ],
    };

    const dietChartData = {
        labels: getLabels(),
        datasets: [
            {
                label: 'Calories',
                data: dietData.calories,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Protein (g)',
                data: dietData.protein,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y1',
            },
        ],
    };

    const dietChartOptions = {
        ...chartOptions,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#94a3b8',
                },
            },
        },
        scales: {
            ...chartOptions.scales,
            y: {
                ...chartOptions.scales.y,
                position: 'left' as const,
            },
            y1: {
                ...chartOptions.scales.y,
                position: 'right' as const,
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
    };

    // Calculate stats
    const avgHabitCompletion = habitData.length > 0
        ? Math.round(habitData.reduce((a, b) => a + b, 0) / habitData.length)
        : 0;

    const totalVolume = workoutData.reduce((a, b) => a + b, 0);
    const avgCalories = dietData.calories.length > 0
        ? Math.round(dietData.calories.reduce((a, b) => a + b, 0) / dietData.calories.filter(c => c > 0).length) || 0
        : 0;

    return (
        <div className="analytics animate-fadeIn">
            <header className="analytics-header">
                <h1>Analytics</h1>

                <div className="time-filter">
                    {(['day', 'week', 'month', '6months', 'year'] as TimeFilter[]).map(filter => (
                        <button
                            key={filter}
                            className={`filter-btn ${timeFilter === filter ? 'active' : ''}`}
                            onClick={() => setTimeFilter(filter)}
                        >
                            {filter === '6months' ? '6M' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>
            </header>

            {/* Stats Overview */}
            <div className="stats-overview">
                <div className="overview-stat">
                    <span className="overview-value">{avgHabitCompletion}%</span>
                    <span className="overview-label">Avg Habit Completion</span>
                </div>
                <div className="overview-stat">
                    <span className="overview-value">{totalVolume.toLocaleString()}</span>
                    <span className="overview-label">Total Volume (kg)</span>
                </div>
                <div className="overview-stat">
                    <span className="overview-value">{avgCalories}</span>
                    <span className="overview-label">Avg Daily Calories</span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="analytics-tabs">
                <button
                    className={`analytics-tab ${activeTab === 'habits' ? 'active' : ''}`}
                    onClick={() => setActiveTab('habits')}
                >
                    🎯 Habits
                </button>
                <button
                    className={`analytics-tab ${activeTab === 'workout' ? 'active' : ''}`}
                    onClick={() => setActiveTab('workout')}
                >
                    💪 Workout
                </button>
                <button
                    className={`analytics-tab ${activeTab === 'diet' ? 'active' : ''}`}
                    onClick={() => setActiveTab('diet')}
                >
                    🥗 Diet
                </button>
            </div>

            {/* Charts */}
            <div className="chart-container">
                {activeTab === 'habits' && (
                    <div className="chart-card">
                        <h3>Habit Consistency</h3>
                        <p className="chart-subtitle">Daily completion rate over time</p>
                        <div className="chart-wrapper">
                            <Line data={habitChartData} options={chartOptions} />
                        </div>
                    </div>
                )}

                {activeTab === 'workout' && (
                    <div className="chart-card">
                        <h3>Workout Intensity</h3>
                        <p className="chart-subtitle">Training volume (weight × reps)</p>
                        <div className="chart-wrapper">
                            <Bar data={workoutChartData} options={chartOptions} />
                        </div>
                    </div>
                )}

                {activeTab === 'diet' && (
                    <div className="chart-card">
                        <h3>Nutrition Tracking</h3>
                        <p className="chart-subtitle">Calories and protein intake</p>
                        <div className="chart-wrapper">
                            <Line data={dietChartData} options={dietChartOptions} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
