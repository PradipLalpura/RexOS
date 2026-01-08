// RexOS Weekly Report with PDF Export

import { useState, useRef, useMemo } from 'react';
import { useRex } from '../../store/RexContext';
import { formatDate, getWeekDates, getDayName } from '../../utils/storage';
import {
    calculateHabitRating,
    calculateWorkoutRating,
    calculateDietRating,
    getDailyOverallRating,
    getWeeklyConsistency,
} from '../../utils/ratings';
import { exportPDF } from '../../utils/pdfExport';
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
import './WeeklyReport.css';

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

export default function WeeklyReport() {
    const { state } = useRex();
    const reportRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const today = new Date();
    const weekDates = getWeekDates(today);
    const weekStart = new Date(weekDates[0]);
    const weekEnd = new Date(weekDates[6]);

    // Calculate weekly stats
    const weeklyStats = useMemo(() => {
        const habitData = weekDates.map(date => {
            const record = state.habitRecords.find(r => r.date === date);
            const completed = record?.logs.filter(l => l.completed).length || 0;
            return { date, completed, total: state.habits.length };
        });

        const workoutData = weekDates.map(date => {
            const log = state.workoutLogs.find(l => l.date === date);
            const planVolume = log?.exercises.reduce((acc, e) =>
                acc + e.sets.reduce((setAcc, s) => setAcc + s.reps * s.weight, 0), 0
            ) || 0;
            const additionalVolume = (log?.additionalExercises || []).reduce((acc, e) =>
                acc + e.sets * e.reps * e.weight, 0
            );
            const volume = planVolume + additionalVolume;
            return { date, log, volume };
        });

        const dietData = weekDates.map(date => {
            const log = state.dietLogs.find(l => l.date === date);
            const totals = log?.meals.reduce(
                (acc, m) => ({
                    calories: acc.calories + m.calories,
                    protein: acc.protein + m.protein,
                    carbs: acc.carbs + m.carbs,
                    fat: acc.fat + m.fat,
                }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
            ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
            return { date, log, ...totals };
        });

        return { habitData, workoutData, dietData };
    }, [weekDates, state]);

    const consistency = getWeeklyConsistency(state, weekDates);

    const getOverallVerdict = (): string => {
        if (consistency >= 90) return 'EXCEPTIONAL WEEK. You executed at an elite level. Maintain this dominance.';
        if (consistency >= 75) return 'STRONG WEEK. Solid execution across the board. Push for perfection next week.';
        if (consistency >= 50) return 'AVERAGE WEEK. Room for significant improvement. Recommit to the process.';
        return 'BELOW STANDARD. This is not who you are. Reset and dominate next week.';
    };

    // Chart configurations
    const chartLabels = weekDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#64748b' },
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#64748b' },
            },
        },
    };

    const habitChartData = {
        labels: chartLabels,
        datasets: [{
            label: 'Habit Completion %',
            data: weeklyStats.habitData.map(d => d.total > 0 ? (d.completed / d.total) * 100 : 0),
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.2)',
            fill: true,
            tension: 0.4,
        }],
    };

    const workoutConsistencyData = {
        labels: chartLabels,
        datasets: [{
            label: 'Completed',
            data: weeklyStats.workoutData.map(d => d.log && d.log.exercises.length > 0 ? 100 : 0),
            backgroundColor: weeklyStats.workoutData.map(d =>
                d.log && d.log.exercises.length > 0 ? '#22c55e' : 'rgba(239, 68, 68, 0.3)'
            ),
            borderRadius: 4,
        }],
    };

    const workoutIntensityData = {
        labels: chartLabels,
        datasets: [{
            label: 'Volume (kg)',
            data: weeklyStats.workoutData.map(d => d.volume),
            backgroundColor: '#8b5cf6',
            borderRadius: 4,
        }],
    };

    const nutritionChartData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Calories',
                data: weeklyStats.dietData.map(d => d.calories),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: false,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Protein (g)',
                data: weeklyStats.dietData.map(d => d.protein),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: false,
                tension: 0.4,
                yAxisID: 'y1',
            },
            {
                label: 'Carbs (g)',
                data: weeklyStats.dietData.map(d => d.carbs),
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: false,
                tension: 0.4,
                yAxisID: 'y1',
            },
            {
                label: 'Fat (g)',
                data: weeklyStats.dietData.map(d => d.fat),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: false,
                tension: 0.4,
                yAxisID: 'y1',
            },
        ],
    };

    const nutritionChartOptions = {
        ...chartOptions,
        plugins: {
            legend: {
                display: true,
                labels: { color: '#94a3b8', boxWidth: 12, padding: 8 },
            },
        },
        scales: {
            ...chartOptions.scales,
            y: {
                ...chartOptions.scales.y,
                position: 'left' as const,
                title: { display: true, text: 'Calories', color: '#64748b' },
            },
            y1: {
                ...chartOptions.scales.y,
                position: 'right' as const,
                title: { display: true, text: 'Grams', color: '#64748b' },
                grid: { drawOnChartArea: false },
            },
        },
    };

    const handleDownloadPDF = async () => {
        setIsGenerating(true);
        try {
            const element = reportRef.current;
            if (!element) return;

            await exportPDF({
                element,
                filename: `RexOS_Weekly_Report_${formatDate(weekStart)}.pdf`,
            });
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="weekly-report animate-fadeIn">
            <header className="report-header">
                <div>
                    <h1>Weekly Report</h1>
                    <p className="report-subtitle">
                        {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                >
                    {isGenerating ? 'Generating...' : '📄 Download PDF'}
                </button>
            </header>

            {/* Report Content */}
            <div className="report-content" ref={reportRef}>
                {/* Section 1: Overall Verdict */}
                <section className="report-section verdict-section">
                    <h2>📊 The Week's Report</h2>
                    <div className="verdict-card">
                        <div className="consistency-score">
                            <span className="score-value">{Math.round(consistency)}%</span>
                            <span className="score-label">Consistency Score</span>
                        </div>
                        <p className="verdict-message">{getOverallVerdict()}</p>
                    </div>
                </section>

                {/* Section 2: Habits */}
                <section className="report-section">
                    <h2>🎯 Habits</h2>
                    <div className="section-content">
                        <div className="habit-week-grid">
                            {weeklyStats.habitData.map(({ date, completed, total }) => {
                                const dayName = getDayName(new Date(date));
                                const percentage = total > 0 ? (completed / total) * 100 : 0;
                                return (
                                    <div key={date} className="habit-day">
                                        <span className="day-name">{dayName.slice(0, 3)}</span>
                                        <div className={`day-status ${percentage === 100 ? 'complete' : percentage > 0 ? 'partial' : 'empty'}`}>
                                            {completed}/{total}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Habit Consistency Graph */}
                        <div className="report-chart-container">
                            <h4>Weekly Habit Consistency</h4>
                            <div className="report-chart-wrapper">
                                <Line data={habitChartData} options={chartOptions} />
                            </div>
                        </div>

                        <div className="habit-overview">
                            <h4>Habit Overview</h4>
                            {state.habits.map(habit => {
                                const daysCompleted = weekDates.filter(date => {
                                    const record = state.habitRecords.find(r => r.date === date);
                                    return record?.logs.some(l => l.habitId === habit.id && l.completed);
                                }).length;

                                return (
                                    <div key={habit.id} className="habit-row">
                                        <span className="habit-name">{habit.icon} {habit.name}</span>
                                        <span className="habit-score">{daysCompleted}/7 days</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Section 3: Workout */}
                <section className="report-section">
                    <h2>💪 Workout</h2>
                    <div className="section-content">
                        <div className="volume-summary">
                            <span className="volume-value">
                                {weeklyStats.workoutData.reduce((acc, d) => acc + d.volume, 0).toLocaleString()}
                            </span>
                            <span className="volume-label">Total Weekly Volume (kg)</span>
                        </div>

                        <div className="workout-breakdown">
                            {weeklyStats.workoutData.map(({ date, log, volume }) => {
                                const dayName = getDayName(new Date(date));
                                // Get workout name from plan
                                const workoutPlan = state.workoutPlan;
                                const planType = workoutPlan?.type || 'gym';
                                const activePlan = planType === 'both' ? (log?.planType || 'gym') : planType;
                                const planExercises = activePlan === 'gym' ? workoutPlan?.gym : workoutPlan?.home;
                                const dayPlan = planExercises?.find(d => d.day === dayName);
                                const workoutName = dayPlan?.workoutName || '';

                                return (
                                    <div key={date} className="workout-day">
                                        <div className="workout-day-header">
                                            <span className="day-name">
                                                {dayName}
                                                {workoutName && <span className="workout-label"> - {workoutName}</span>}
                                            </span>
                                            <span className="day-volume">{volume.toLocaleString()} kg</span>
                                        </div>
                                        {log && log.exercises.length > 0 ? (
                                            <div className="exercise-list">
                                                {log.exercises.map(e => (
                                                    <div key={e.exerciseId} className="exercise-summary">
                                                        <span className="exercise-name">{e.exerciseName}</span>
                                                        <span className="exercise-sets">
                                                            {e.sets.map(s => `${s.reps}×${s.weight}kg`).join(', ')}
                                                        </span>
                                                    </div>
                                                ))}
                                                {/* Additional Exercises */}
                                                {log.additionalExercises && log.additionalExercises.length > 0 && (
                                                    <>
                                                        <div className="additional-label">+ Additional:</div>
                                                        {log.additionalExercises.map(e => (
                                                            <div key={e.id} className="exercise-summary additional">
                                                                <span className="exercise-name">{e.name}</span>
                                                                <span className="exercise-sets">
                                                                    {e.sets}×{e.reps}×{e.weight}kg
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="rest-indicator">Rest day</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Workout Consistency Graph */}
                        <div className="report-chart-container">
                            <h4>Weekly Workout Consistency</h4>
                            <div className="report-chart-wrapper">
                                <Bar data={workoutConsistencyData} options={chartOptions} />
                            </div>
                        </div>

                        {/* Workout Intensity Graph */}
                        <div className="report-chart-container">
                            <h4>Weekly Workout Intensity</h4>
                            <div className="report-chart-wrapper">
                                <Bar data={workoutIntensityData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Diet */}
                <section className="report-section">
                    <h2>🥗 Diet</h2>
                    <div className="section-content">
                        <div className="diet-totals">
                            <div className="diet-total">
                                <span className="total-value">
                                    {Math.round(weeklyStats.dietData.reduce((acc, d) => acc + d.calories, 0) / 7)}
                                </span>
                                <span className="total-label">Avg Calories</span>
                            </div>
                            <div className="diet-total">
                                <span className="total-value">
                                    {Math.round(weeklyStats.dietData.reduce((acc, d) => acc + d.protein, 0) / 7)}g
                                </span>
                                <span className="total-label">Avg Protein</span>
                            </div>
                            <div className="diet-total">
                                <span className="total-value">
                                    {Math.round(weeklyStats.dietData.reduce((acc, d) => acc + d.carbs, 0) / 7)}g
                                </span>
                                <span className="total-label">Avg Carbs</span>
                            </div>
                            <div className="diet-total">
                                <span className="total-value">
                                    {Math.round(weeklyStats.dietData.reduce((acc, d) => acc + d.fat, 0) / 7)}g
                                </span>
                                <span className="total-label">Avg Fat</span>
                            </div>
                        </div>

                        <div className="diet-daily">
                            {weeklyStats.dietData.map(({ date, calories, protein }) => {
                                const dayName = getDayName(new Date(date));
                                return (
                                    <div key={date} className="diet-day">
                                        <span className="day-name">{dayName.slice(0, 3)}</span>
                                        <span className="day-calories">{calories} kcal</span>
                                        <span className="day-protein">{protein}g protein</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Weekly Nutrition Graph */}
                        <div className="report-chart-container">
                            <h4>Weekly Nutrition</h4>
                            <div className="report-chart-wrapper report-chart-wrapper-lg">
                                <Line data={nutritionChartData} options={nutritionChartOptions} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 5: Daily Breakdown */}
                <section className="report-section daily-breakdown">
                    <h2>📅 Daily Breakdown</h2>
                    <div className="section-content">
                        {weekDates.map(date => {
                            const dayName = getDayName(new Date(date));
                            const overall = getDailyOverallRating(state, date);
                            const habitRating = calculateHabitRating(state, date);
                            const workoutRating = calculateWorkoutRating(state, date);
                            const dietRating = calculateDietRating(state, date);

                            return (
                                <div key={date} className={`daily-card rating-${overall.type}`}>
                                    <div className="daily-header">
                                        <h4>{dayName}</h4>
                                        <span className="daily-date">
                                            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className={`daily-score score-${overall.type}`}>
                                            {Math.round(overall.score)}%
                                        </span>
                                    </div>
                                    <div className="daily-ratings">
                                        <div className="rating-item">
                                            <span className="rating-label">Habits</span>
                                            <span className={`rating-value ${habitRating.type}`}>{Math.round(habitRating.score)}%</span>
                                        </div>
                                        <div className="rating-item">
                                            <span className="rating-label">Workout</span>
                                            <span className={`rating-value ${workoutRating.type}`}>{Math.round(workoutRating.score)}%</span>
                                        </div>
                                        <div className="rating-item">
                                            <span className="rating-label">Diet</span>
                                            <span className={`rating-value ${dietRating.type}`}>{Math.round(dietRating.score)}%</span>
                                        </div>
                                    </div>
                                    {/* Daily Note Preview */}
                                    {(() => {
                                        const note = state.notes.find(n => n.date === date);
                                        if (note && note.content.trim()) {
                                            return (
                                                <div className="daily-note-preview">
                                                    <span className="note-icon">📝</span>
                                                    <span className="note-text">
                                                        {note.content.slice(0, 100)}{note.content.length > 100 ? '...' : ''}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Section 6: Notes / Reflections */}
                <section className="report-section">
                    <h2>📝 Notes & Reflections</h2>
                    <div className="section-content">
                        {weekDates.filter(date => {
                            const note = state.notes.find(n => n.date === date);
                            return note && note.content.trim();
                        }).length === 0 ? (
                            <p className="no-notes-message">No notes recorded this week.</p>
                        ) : (
                            <div className="notes-breakdown">
                                {weekDates.map(date => {
                                    const note = state.notes.find(n => n.date === date);
                                    if (!note || !note.content.trim()) return null;

                                    const dayName = getDayName(new Date(date));
                                    return (
                                        <div key={date} className="note-entry">
                                            <div className="note-entry-header">
                                                <span className="note-day">{dayName}</span>
                                                <span className="note-date">
                                                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="note-content">{note.content}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Section 7: AI Progress Review (Optional) */}
                <section className="report-section ai-review-section">
                    <h2>🤖 AI Progress Review (Optional)</h2>
                    <div className="section-content">
                        <div className="ai-review-intro">
                            <p>
                                Want deeper insights? You can upload this weekly report to any AI assistant
                                (ChatGPT, Claude, Gemini, etc.) for personalized analysis and recommendations.
                            </p>
                            <p className="ai-review-tip">
                                💡 <strong>Tip:</strong> Download this report as PDF and share it with your preferred AI,
                                or copy the prompt below to guide the analysis.
                            </p>
                        </div>

                        <div className="ai-prompt-box">
                            <div className="ai-prompt-header">
                                <span>📋 Ready-to-Use Prompt</span>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => {
                                        const prompt = `Analyze my weekly performance report covering habits, workouts, and diet.
Identify strengths, weaknesses, consistency issues, and areas of improvement.
Give clear, actionable advice for the next week focused on discipline,
progression, recovery, and nutrition.`;
                                        navigator.clipboard.writeText(prompt);
                                        alert('Prompt copied to clipboard!');
                                    }}
                                >
                                    Copy
                                </button>
                            </div>
                            <div className="ai-prompt-content">
                                <code>
                                    Analyze my weekly performance report covering habits, workouts, and diet.
                                    Identify strengths, weaknesses, consistency issues, and areas of improvement.
                                    Give clear, actionable advice for the next week focused on discipline,
                                    progression, recovery, and nutrition.
                                </code>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <div className="report-footer">
                    <div className="logo">
                        <span className="gradient-text">REX</span>OS
                    </div>
                    <p>Rule your mind. Run your life. Execute daily.</p>
                </div>
            </div>
        </div>
    );
}
