// RexOS Workout Tracker

import { useState } from 'react';
import { useRex } from '../../store/RexContext';
import { formatDate, getDayName, generateId } from '../../utils/storage';
import { calculateWorkoutRating } from '../../utils/ratings';
import type { Exercise, ExerciseLog, ExerciseSet, WorkoutLog, AdditionalExercise } from '../../types';
import './WorkoutTracker.css';

export default function WorkoutTracker() {
    const { state, dispatch } = useRex();
    const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
    const [activePlanType, setActivePlanType] = useState<'gym' | 'home'>('gym');
    const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
    const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);

    const dayName = getDayName(new Date(selectedDate));
    const isToday = selectedDate === formatDate(new Date());
    const rating = calculateWorkoutRating(state, selectedDate);

    // Get workout plan for the day
    const workoutPlan = state.workoutPlan;
    const planType = workoutPlan?.type || 'gym';

    const getDayExercises = (): Exercise[] => {
        if (!workoutPlan) return [];

        const activePlan = planType === 'both' ? activePlanType : planType;
        const planExercises = activePlan === 'gym' ? workoutPlan.gym : workoutPlan.home;
        const dayPlan = planExercises?.find(d => d.day === dayName);

        return dayPlan?.exercises || [];
    };

    const getWorkoutName = (): string => {
        if (!workoutPlan) return '';

        const activePlan = planType === 'both' ? activePlanType : planType;
        const planExercises = activePlan === 'gym' ? workoutPlan.gym : workoutPlan.home;
        const dayPlan = planExercises?.find(d => d.day === dayName);

        return dayPlan?.workoutName || '';
    };

    const exercises = getDayExercises();
    const workoutName = getWorkoutName();

    // Get or initialize workout log
    const getWorkoutLog = (): WorkoutLog => {
        const existing = state.workoutLogs.find(l => l.date === selectedDate);
        if (existing) return existing;

        return {
            date: selectedDate,
            planType: planType === 'both' ? activePlanType : (planType as 'gym' | 'home'),
            exercises: [],
            additionalExercises: [],
        };
    };

    const workoutLog = getWorkoutLog();
    const additionalExercises = workoutLog.additionalExercises || [];

    const getExerciseLog = (exerciseId: string): ExerciseLog | undefined => {
        return workoutLog.exercises.find(e => e.exerciseId === exerciseId);
    };

    const addSet = (exercise: Exercise) => {
        const existingLog = getExerciseLog(exercise.id);
        const newSetNumber = existingLog ? existingLog.sets.length + 1 : 1;
        const lastSet = existingLog?.sets[existingLog.sets.length - 1];

        const newSet: ExerciseSet = {
            setNumber: newSetNumber,
            reps: lastSet?.reps || exercise.targetReps,
            weight: lastSet?.weight || 0,
        };

        let updatedLog: WorkoutLog;

        if (existingLog) {
            updatedLog = {
                ...workoutLog,
                exercises: workoutLog.exercises.map(e =>
                    e.exerciseId === exercise.id
                        ? { ...e, sets: [...e.sets, newSet] }
                        : e
                ),
            };
        } else {
            const newExerciseLog: ExerciseLog = {
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                sets: [newSet],
            };
            updatedLog = {
                ...workoutLog,
                planType: planType === 'both' ? activePlanType : (planType as 'gym' | 'home'),
                exercises: [...workoutLog.exercises, newExerciseLog],
            };
        }

        if (state.workoutLogs.some(l => l.date === selectedDate)) {
            dispatch({ type: 'UPDATE_WORKOUT_LOG', payload: updatedLog });
        } else {
            dispatch({ type: 'LOG_WORKOUT', payload: updatedLog });
        }

        setExpandedExercise(exercise.id);
    };

    const updateSet = (exerciseId: string, setNumber: number, field: 'reps' | 'weight', value: number) => {
        const updatedLog: WorkoutLog = {
            ...workoutLog,
            exercises: workoutLog.exercises.map(e =>
                e.exerciseId === exerciseId
                    ? {
                        ...e,
                        sets: e.sets.map(s =>
                            s.setNumber === setNumber ? { ...s, [field]: value } : s
                        ),
                    }
                    : e
            ),
        };

        dispatch({ type: 'UPDATE_WORKOUT_LOG', payload: updatedLog });
    };

    const removeSet = (exerciseId: string, setNumber: number) => {
        const updatedLog: WorkoutLog = {
            ...workoutLog,
            exercises: workoutLog.exercises.map(e =>
                e.exerciseId === exerciseId
                    ? {
                        ...e,
                        sets: e.sets
                            .filter(s => s.setNumber !== setNumber)
                            .map((s, i) => ({ ...s, setNumber: i + 1 })),
                    }
                    : e
            ).filter(e => e.sets.length > 0),
        };

        dispatch({ type: 'UPDATE_WORKOUT_LOG', payload: updatedLog });
    };

    const handleAddAdditionalExercise = (exercise: Omit<AdditionalExercise, 'id'>) => {
        const newExercise: AdditionalExercise = {
            ...exercise,
            id: generateId(),
        };
        dispatch({ type: 'ADD_ADDITIONAL_EXERCISE', payload: { date: selectedDate, exercise: newExercise } });
        setShowAddExerciseModal(false);
    };

    const handleRemoveAdditionalExercise = (exerciseId: string) => {
        dispatch({ type: 'REMOVE_ADDITIONAL_EXERCISE', payload: { date: selectedDate, exerciseId } });
    };

    const navigateDays = (offset: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + offset);
        setSelectedDate(formatDate(date));
    };

    // Calculate total volume (including additional exercises)
    const planVolume = workoutLog.exercises.reduce((acc, e) => {
        return acc + e.sets.reduce((setAcc, s) => setAcc + s.reps * s.weight, 0);
    }, 0);

    const additionalVolume = additionalExercises.reduce((acc, e) => {
        return acc + e.sets * e.reps * e.weight;
    }, 0);

    const totalVolume = planVolume + additionalVolume;

    const completedExercises = workoutLog.exercises.filter(e => e.sets.length > 0).length;
    const totalExercises = exercises.length;

    return (
        <div className="workout-tracker animate-fadeIn">
            <header className="tracker-header">
                <div>
                    <h1>Workout{workoutName && <span className="workout-name-badge">{workoutName}</span>}</h1>
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

            {/* Plan Type Selector (if both) */}
            {planType === 'both' && (
                <div className="plan-type-tabs">
                    <button
                        className={`plan-tab ${activePlanType === 'gym' ? 'active' : ''}`}
                        onClick={() => setActivePlanType('gym')}
                    >
                        🏋️ Gym Workout
                    </button>
                    <button
                        className={`plan-tab ${activePlanType === 'home' ? 'active' : ''}`}
                        onClick={() => setActivePlanType('home')}
                    >
                        🏠 Home Workout
                    </button>
                </div>
            )}

            {/* Progress Overview */}
            <div className={`workout-progress rating-${rating.type}`}>
                <div className="progress-stats-row">
                    <div className="progress-stat">
                        <span className="stat-number">{completedExercises}</span>
                        <span className="stat-divider">/</span>
                        <span className="stat-total">{totalExercises}</span>
                        <span className="stat-label">Exercises</span>
                    </div>

                    <div className="progress-stat">
                        <span className="stat-number">{totalVolume.toLocaleString()}</span>
                        <span className="stat-unit">kg</span>
                        <span className="stat-label">Total Volume</span>
                    </div>
                </div>

                <p className="progress-message">{rating.message}</p>
            </div>

            {/* Exercise List */}
            <div className="exercise-list">
                {exercises.length === 0 ? (
                    <div className="rest-day">
                        <div className="rest-icon">🧘</div>
                        <h3>Rest Day</h3>
                        <p>No exercises scheduled for {dayName}. Recovery is part of the process.</p>
                    </div>
                ) : (
                    exercises.map((exercise) => {
                        const log = getExerciseLog(exercise.id);
                        const isExpanded = expandedExercise === exercise.id;
                        const setsCompleted = log?.sets.length || 0;

                        return (
                            <div key={exercise.id} className={`exercise-card ${setsCompleted > 0 ? 'has-sets' : ''}`}>
                                <div
                                    className="exercise-header"
                                    onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                                >
                                    <div className="exercise-info">
                                        <h3 className="exercise-name">{exercise.name}</h3>
                                        <p className="exercise-target">
                                            Target: {exercise.targetSets} sets × {exercise.targetReps} reps
                                        </p>
                                    </div>

                                    <div className="exercise-status">
                                        <span className={`sets-badge ${setsCompleted >= exercise.targetSets ? 'complete' : ''}`}>
                                            {setsCompleted}/{exercise.targetSets} sets
                                        </span>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={(e) => { e.stopPropagation(); addSet(exercise); }}
                                        >
                                            + Set
                                        </button>
                                    </div>
                                </div>

                                {log && log.sets.length > 0 && (
                                    <div className={`sets-container ${isExpanded ? 'expanded' : ''}`}>
                                        <div className="sets-list">
                                            {log.sets.map((set) => (
                                                <div key={set.setNumber} className="set-row">
                                                    <span className="set-number">Set {set.setNumber}</span>

                                                    <div className="set-input">
                                                        <input
                                                            type="number"
                                                            className="input input-sm"
                                                            value={set.reps}
                                                            onChange={(e) => updateSet(exercise.id, set.setNumber, 'reps', parseInt(e.target.value) || 0)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            min="0"
                                                        />
                                                        <span className="input-label">reps</span>
                                                    </div>

                                                    <span className="set-at">@</span>

                                                    <div className="set-input">
                                                        <input
                                                            type="number"
                                                            className="input input-sm"
                                                            value={set.weight}
                                                            onChange={(e) => updateSet(exercise.id, set.setNumber, 'weight', parseFloat(e.target.value) || 0)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            min="0"
                                                            step="0.5"
                                                        />
                                                        <span className="input-label">kg</span>
                                                    </div>

                                                    <button
                                                        className="btn btn-ghost btn-icon remove-set"
                                                        onClick={(e) => { e.stopPropagation(); removeSet(exercise.id, set.setNumber); }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Additional Exercises Section */}
            <div className="additional-exercises-section">
                <div className="section-header">
                    <h2>Additional Exercises (Today Only)</h2>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowAddExerciseModal(true)}
                    >
                        + Add Exercise
                    </button>
                </div>
                <p className="section-note">These exercises are stored only for this day and won't appear on future days.</p>

                {additionalExercises.length === 0 ? (
                    <div className="empty-additional">
                        <p>No additional exercises logged for this day.</p>
                    </div>
                ) : (
                    <div className="additional-exercises-list">
                        {additionalExercises.map((exercise) => (
                            <div key={exercise.id} className="additional-exercise-card">
                                <div className="additional-exercise-info">
                                    <h4>{exercise.name}</h4>
                                    <p>{exercise.sets} sets × {exercise.reps} reps @ {exercise.weight}kg</p>
                                    <span className="volume-badge">
                                        Volume: {(exercise.sets * exercise.reps * exercise.weight).toLocaleString()}kg
                                    </span>
                                </div>
                                <button
                                    className="btn btn-ghost btn-icon"
                                    onClick={() => handleRemoveAdditionalExercise(exercise.id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Additional Exercise Modal */}
            {showAddExerciseModal && (
                <AddExerciseModal
                    onClose={() => setShowAddExerciseModal(false)}
                    onSave={handleAddAdditionalExercise}
                />
            )}
        </div>
    );
}

interface AddExerciseModalProps {
    onClose: () => void;
    onSave: (exercise: Omit<AdditionalExercise, 'id'>) => void;
}

function AddExerciseModal({ onClose, onSave }: AddExerciseModalProps) {
    const [name, setName] = useState('');
    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) newErrors.name = 'Required';
        if (!sets || parseInt(sets) <= 0) newErrors.sets = 'Required';
        if (!reps || parseInt(reps) <= 0) newErrors.reps = 'Required';
        if (!weight || parseFloat(weight) < 0) newErrors.weight = 'Required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        onSave({
            name: name.trim(),
            sets: parseInt(sets),
            reps: parseInt(reps),
            weight: parseFloat(weight),
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Add Additional Exercise</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="input-group">
                        <label className="input-label">Exercise Name</label>
                        <input
                            type="text"
                            className={`input ${errors.name ? 'input-error' : ''}`}
                            placeholder="e.g., Dumbbell Curls"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="input-row-3">
                        <div className="input-group">
                            <label className="input-label">Sets</label>
                            <input
                                type="number"
                                className={`input ${errors.sets ? 'input-error' : ''}`}
                                placeholder="3"
                                value={sets}
                                onChange={(e) => setSets(e.target.value)}
                                min="1"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Reps</label>
                            <input
                                type="number"
                                className={`input ${errors.reps ? 'input-error' : ''}`}
                                placeholder="12"
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                min="1"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Weight (kg)</label>
                            <input
                                type="number"
                                className={`input ${errors.weight ? 'input-error' : ''}`}
                                placeholder="20"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                min="0"
                                step="0.5"
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Add Exercise
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
