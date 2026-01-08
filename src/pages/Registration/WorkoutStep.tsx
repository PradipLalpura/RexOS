// RexOS Registration - Workout Step

import { useState } from 'react';
import { useRex } from '../../store/RexContext';
import type { WorkoutPlan, WorkoutPlanType, DayWorkout } from '../../types';
import { generateId } from '../../utils/storage';
import './Registration.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EXAMPLE_EXERCISES: Record<string, { name: string; sets: number; reps: number }[]> = {
    Monday: [
        { name: 'Bench Press', sets: 4, reps: 10 },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 12 },
        { name: 'Cable Flyes', sets: 3, reps: 15 },
    ],
    Wednesday: [
        { name: 'Squats', sets: 4, reps: 8 },
        { name: 'Leg Press', sets: 3, reps: 12 },
        { name: 'Lunges', sets: 3, reps: 10 },
    ],
};

const WORKOUT_NAME_SUGGESTIONS = ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Full Body', 'Chest', 'Back', 'Arms', 'Core'];

interface WorkoutStepProps {
    onNext: () => void;
    onBack: () => void;
}

interface ExerciseInput {
    id: string;
    name: string;
    targetSets: string;
    targetReps: string;
}

interface DayExercises {
    [day: string]: ExerciseInput[];
}

interface DayWorkoutNames {
    [day: string]: string;
}

export default function WorkoutStep({ onNext, onBack }: WorkoutStepProps) {
    const { state, dispatch } = useRex();
    const [planType, setPlanType] = useState<WorkoutPlanType>(state.workoutPlan?.type || 'gym');
    const [activeDay, setActiveDay] = useState('Monday');
    const [activePlanTab, setActivePlanTab] = useState<'gym' | 'home'>('gym');

    // Initialize exercises from existing state or empty
    const initExercises = (type: 'gym' | 'home'): DayExercises => {
        const plan = state.workoutPlan;
        const exercises: DayExercises = {};
        DAYS.forEach(day => {
            const existing = type === 'gym'
                ? plan?.gym?.find(d => d.day === day)
                : plan?.home?.find(d => d.day === day);
            exercises[day] = existing?.exercises.map(e => ({
                id: e.id,
                name: e.name,
                targetSets: e.targetSets.toString(),
                targetReps: e.targetReps.toString(),
            })) || [];
        });
        return exercises;
    };

    // Initialize workout names from existing state or empty
    const initWorkoutNames = (type: 'gym' | 'home'): DayWorkoutNames => {
        const plan = state.workoutPlan;
        const names: DayWorkoutNames = {};
        DAYS.forEach(day => {
            const existing = type === 'gym'
                ? plan?.gym?.find(d => d.day === day)
                : plan?.home?.find(d => d.day === day);
            names[day] = existing?.workoutName || '';
        });
        return names;
    };

    const [gymExercises, setGymExercises] = useState<DayExercises>(initExercises('gym'));
    const [homeExercises, setHomeExercises] = useState<DayExercises>(initExercises('home'));
    const [gymWorkoutNames, setGymWorkoutNames] = useState<DayWorkoutNames>(initWorkoutNames('gym'));
    const [homeWorkoutNames, setHomeWorkoutNames] = useState<DayWorkoutNames>(initWorkoutNames('home'));
    const [showExample, setShowExample] = useState(false);
    const [error, setError] = useState('');

    const currentExercises = activePlanTab === 'gym' ? gymExercises : homeExercises;
    const setCurrentExercises = activePlanTab === 'gym' ? setGymExercises : setHomeExercises;
    const currentWorkoutNames = activePlanTab === 'gym' ? gymWorkoutNames : homeWorkoutNames;
    const setCurrentWorkoutNames = activePlanTab === 'gym' ? setGymWorkoutNames : setHomeWorkoutNames;

    const addExercise = () => {
        const newExercise: ExerciseInput = {
            id: generateId(),
            name: '',
            targetSets: '3',
            targetReps: '10',
        };
        setCurrentExercises(prev => ({
            ...prev,
            [activeDay]: [...prev[activeDay], newExercise],
        }));
    };

    const updateExercise = (id: string, field: keyof ExerciseInput, value: string) => {
        setCurrentExercises(prev => ({
            ...prev,
            [activeDay]: prev[activeDay].map(e =>
                e.id === id ? { ...e, [field]: value } : e
            ),
        }));
    };

    const removeExercise = (id: string) => {
        setCurrentExercises(prev => ({
            ...prev,
            [activeDay]: prev[activeDay].filter(e => e.id !== id),
        }));
    };

    const updateWorkoutName = (day: string, name: string) => {
        setCurrentWorkoutNames(prev => ({
            ...prev,
            [day]: name,
        }));
    };

    const convertToDayWorkouts = (exercises: DayExercises, workoutNames: DayWorkoutNames): DayWorkout[] => {
        return DAYS.map(day => ({
            day,
            workoutName: workoutNames[day] || '',
            exercises: exercises[day]
                .filter(e => e.name.trim())
                .map(e => ({
                    id: e.id,
                    name: e.name.trim(),
                    targetSets: parseInt(e.targetSets) || 3,
                    targetReps: parseInt(e.targetReps) || 10,
                })),
        }));
    };

    const handleSubmit = () => {
        const hasGymExercises = Object.values(gymExercises).some(d => d.some(e => e.name.trim()));
        const hasHomeExercises = Object.values(homeExercises).some(d => d.some(e => e.name.trim()));

        if (planType === 'gym' && !hasGymExercises) {
            setError('Add at least one exercise to your gym plan');
            return;
        }
        if (planType === 'home' && !hasHomeExercises) {
            setError('Add at least one exercise to your home plan');
            return;
        }
        if (planType === 'both' && (!hasGymExercises || !hasHomeExercises)) {
            setError('Add exercises to both gym and home plans');
            return;
        }

        // Validate workout names for days with exercises
        const validateWorkoutNames = (exercises: DayExercises, names: DayWorkoutNames): string | null => {
            for (const day of DAYS) {
                if (exercises[day].some(e => e.name.trim()) && !names[day].trim()) {
                    return `${day} has exercises but no workout name`;
                }
            }
            return null;
        };

        if (planType === 'gym' || planType === 'both') {
            const gymError = validateWorkoutNames(gymExercises, gymWorkoutNames);
            if (gymError) {
                setError(`Gym plan: ${gymError}`);
                return;
            }
        }
        if (planType === 'home' || planType === 'both') {
            const homeError = validateWorkoutNames(homeExercises, homeWorkoutNames);
            if (homeError) {
                setError(`Home plan: ${homeError}`);
                return;
            }
        }

        const workoutPlan: WorkoutPlan = {
            type: planType,
            gym: (planType === 'gym' || planType === 'both') ? convertToDayWorkouts(gymExercises, gymWorkoutNames) : undefined,
            home: (planType === 'home' || planType === 'both') ? convertToDayWorkouts(homeExercises, homeWorkoutNames) : undefined,
        };

        dispatch({ type: 'SET_WORKOUT_PLAN', payload: workoutPlan });
        onNext();
    };

    return (
        <div className="registration-step animate-fadeIn">
            <div className="step-header">
                <span className="step-number">03</span>
                <h1 className="step-title">WORKOUT PLAN</h1>
                <p className="step-subtitle">Build your weekly training schedule. No excuses.</p>
            </div>

            {/* Plan Type Selection */}
            <div className="plan-type-selector">
                <button
                    className={`plan-type-btn ${planType === 'gym' ? 'active' : ''}`}
                    onClick={() => { setPlanType('gym'); setActivePlanTab('gym'); }}
                >
                    🏋️ GYM
                </button>
                <button
                    className={`plan-type-btn ${planType === 'home' ? 'active' : ''}`}
                    onClick={() => { setPlanType('home'); setActivePlanTab('home'); }}
                >
                    🏠 HOME
                </button>
                <button
                    className={`plan-type-btn ${planType === 'both' ? 'active' : ''}`}
                    onClick={() => setPlanType('both')}
                >
                    🔄 BOTH
                </button>
            </div>

            {/* Plan Tabs for Both */}
            {planType === 'both' && (
                <div className="tabs plan-tabs">
                    <button
                        className={`tab ${activePlanTab === 'gym' ? 'active' : ''}`}
                        onClick={() => setActivePlanTab('gym')}
                    >
                        🏋️ Gym Plan
                    </button>
                    <button
                        className={`tab ${activePlanTab === 'home' ? 'active' : ''}`}
                        onClick={() => setActivePlanTab('home')}
                    >
                        🏠 Home Plan
                    </button>
                </div>
            )}

            {/* Day Selector */}
            <div className="day-selector">
                {DAYS.map(day => {
                    const exercises = currentExercises[day] || [];
                    const hasExercises = exercises.some(e => e.name.trim());
                    const workoutName = currentWorkoutNames[day];
                    return (
                        <button
                            key={day}
                            className={`day-btn ${activeDay === day ? 'active' : ''} ${hasExercises ? 'has-exercises' : ''}`}
                            onClick={() => setActiveDay(day)}
                            title={workoutName || undefined}
                        >
                            {day.slice(0, 3)}
                            {hasExercises && <span className="exercise-count">{exercises.filter(e => e.name.trim()).length}</span>}
                        </button>
                    );
                })}
            </div>

            {/* Example Toggle */}
            <button className="btn btn-ghost example-toggle" onClick={() => setShowExample(!showExample)}>
                {showExample ? 'Hide Example' : 'Show Example Structure'} 📋
            </button>

            {showExample && (
                <div className="example-workout">
                    <h4>Example Workout Structure</h4>
                    {Object.entries(EXAMPLE_EXERCISES).map(([day, exercises]) => (
                        <div key={day} className="example-day">
                            <strong>{day} - Push</strong>
                            {exercises.map((e, i) => (
                                <div key={i} className="example-exercise">
                                    {e.name} - {e.sets} sets × {e.reps} reps
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Exercise List */}
            <div className="exercise-list">
                <div className="exercise-list-header">
                    <h3>{activeDay} - {activePlanTab === 'gym' ? 'Gym' : 'Home'}</h3>
                    <button className="btn btn-primary btn-sm" onClick={addExercise}>
                        + ADD EXERCISE
                    </button>
                </div>

                {/* Workout Name Field */}
                <div className="workout-name-field">
                    <div className="input-group">
                        <label className="input-label">Workout Name *</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g., Push, Pull, Legs"
                            value={currentWorkoutNames[activeDay] || ''}
                            onChange={(e) => updateWorkoutName(activeDay, e.target.value)}
                        />
                        <div className="workout-name-suggestions">
                            {WORKOUT_NAME_SUGGESTIONS.map(suggestion => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    className={`suggestion-btn ${currentWorkoutNames[activeDay] === suggestion ? 'active' : ''}`}
                                    onClick={() => updateWorkoutName(activeDay, suggestion)}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {currentExercises[activeDay]?.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🏃</div>
                        <p className="empty-state-title">Rest day or no exercises yet</p>
                        <p className="empty-state-text">Add exercises or leave empty for a rest day</p>
                    </div>
                ) : (
                    currentExercises[activeDay].map((exercise, index) => (
                        <div key={exercise.id} className="exercise-input-card">
                            <div className="exercise-number">{index + 1}</div>
                            <div className="exercise-inputs">
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Exercise name (e.g., Bench Press)"
                                    value={exercise.name}
                                    onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                                />
                                <div className="exercise-numbers">
                                    <div className="input-group">
                                        <label className="input-label">Sets</label>
                                        <input
                                            type="number"
                                            className="input input-sm"
                                            value={exercise.targetSets}
                                            onChange={(e) => updateExercise(exercise.id, 'targetSets', e.target.value)}
                                            min="1"
                                            max="10"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Reps</label>
                                        <input
                                            type="number"
                                            className="input input-sm"
                                            value={exercise.targetReps}
                                            onChange={(e) => updateExercise(exercise.id, 'targetReps', e.target.value)}
                                            min="1"
                                            max="50"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                className="btn btn-ghost btn-icon remove-btn"
                                onClick={() => removeExercise(exercise.id)}
                            >
                                ✕
                            </button>
                        </div>
                    ))
                )}
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="step-actions">
                <button type="button" className="btn btn-secondary" onClick={onBack}>
                    ← BACK
                </button>
                <button type="button" className="btn btn-primary btn-lg" onClick={handleSubmit}>
                    CONTINUE →
                </button>
            </div>
        </div>
    );
}
