// RexOS State Management

import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
    RexState,
    RexAction,
    DailyHabitRecord,
    DailyDietLog,
} from '../types';
import { saveState, loadState } from '../utils/storage';

const initialState: RexState = {
    isRegistered: false,
    currentStep: 1,
    profile: null,
    habits: [],
    workoutPlan: null,
    dietTargets: null,
    habitRecords: [],
    workoutLogs: [],
    dietLogs: [],
    notes: [],
};

function rexReducer(state: RexState, action: RexAction): RexState {
    switch (action.type) {
        case 'SET_PROFILE':
            return { ...state, profile: action.payload };

        case 'SET_HABITS':
            return { ...state, habits: action.payload };

        case 'SET_WORKOUT_PLAN':
            return { ...state, workoutPlan: action.payload };

        case 'SET_DIET_TARGETS':
            return { ...state, dietTargets: action.payload };

        case 'SET_STEP':
            return { ...state, currentStep: action.payload };

        case 'COMPLETE_REGISTRATION':
            return { ...state, isRegistered: true };

        case 'LOG_HABIT': {
            const { date, log } = action.payload;
            const existingRecord = state.habitRecords.find(r => r.date === date);

            if (existingRecord) {
                const updatedLogs = existingRecord.logs.some(l => l.habitId === log.habitId)
                    ? existingRecord.logs.map(l => l.habitId === log.habitId ? log : l)
                    : [...existingRecord.logs, log];

                return {
                    ...state,
                    habitRecords: state.habitRecords.map(r =>
                        r.date === date ? { ...r, logs: updatedLogs } : r
                    ),
                };
            } else {
                const newRecord: DailyHabitRecord = { date, logs: [log] };
                return {
                    ...state,
                    habitRecords: [...state.habitRecords, newRecord],
                };
            }
        }

        case 'LOG_WORKOUT': {
            const existingIndex = state.workoutLogs.findIndex(
                l => l.date === action.payload.date
            );

            if (existingIndex >= 0) {
                const updated = [...state.workoutLogs];
                updated[existingIndex] = action.payload;
                return { ...state, workoutLogs: updated };
            }

            return {
                ...state,
                workoutLogs: [...state.workoutLogs, action.payload],
            };
        }

        case 'UPDATE_WORKOUT_LOG': {
            return {
                ...state,
                workoutLogs: state.workoutLogs.map(log =>
                    log.date === action.payload.date ? action.payload : log
                ),
            };
        }

        case 'LOG_MEAL': {
            const { date, meal } = action.payload;
            const existingLog = state.dietLogs.find(l => l.date === date);

            if (existingLog) {
                return {
                    ...state,
                    dietLogs: state.dietLogs.map(l =>
                        l.date === date ? { ...l, meals: [...l.meals, meal] } : l
                    ),
                };
            } else {
                const newLog: DailyDietLog = { date, meals: [meal] };
                return {
                    ...state,
                    dietLogs: [...state.dietLogs, newLog],
                };
            }
        }

        case 'DELETE_MEAL': {
            const { date, mealId } = action.payload;
            return {
                ...state,
                dietLogs: state.dietLogs.map(l =>
                    l.date === date
                        ? { ...l, meals: l.meals.filter(m => m.id !== mealId) }
                        : l
                ),
            };
        }

        case 'UPDATE_PROFILE':
            return {
                ...state,
                profile: state.profile ? { ...state.profile, ...action.payload } : null,
            };

        case 'ADD_ADDITIONAL_EXERCISE': {
            const { date, exercise } = action.payload;
            const existingLog = state.workoutLogs.find(l => l.date === date);

            if (existingLog) {
                const additionalExercises = existingLog.additionalExercises || [];
                return {
                    ...state,
                    workoutLogs: state.workoutLogs.map(l =>
                        l.date === date
                            ? { ...l, additionalExercises: [...additionalExercises, exercise] }
                            : l
                    ),
                };
            } else {
                // Create new workout log with just the additional exercise
                return {
                    ...state,
                    workoutLogs: [
                        ...state.workoutLogs,
                        {
                            date,
                            planType: 'gym',
                            exercises: [],
                            additionalExercises: [exercise],
                        },
                    ],
                };
            }
        }

        case 'REMOVE_ADDITIONAL_EXERCISE': {
            const { date, exerciseId } = action.payload;
            return {
                ...state,
                workoutLogs: state.workoutLogs.map(l =>
                    l.date === date
                        ? {
                            ...l,
                            additionalExercises: (l.additionalExercises || []).filter(
                                e => e.id !== exerciseId
                            ),
                        }
                        : l
                ),
            };
        }

        case 'LOG_NOTE': {
            const note = action.payload;
            const existingNote = state.notes.find(n => n.date === note.date);

            if (existingNote) {
                return {
                    ...state,
                    notes: state.notes.map(n =>
                        n.date === note.date ? note : n
                    ),
                };
            } else {
                return {
                    ...state,
                    notes: [...state.notes, note],
                };
            }
        }

        case 'LOAD_STATE':
            return action.payload;

        case 'RESET':
            return initialState;

        default:
            return state;
    }
}

interface RexContextType {
    state: RexState;
    dispatch: React.Dispatch<RexAction>;
}

const RexContext = createContext<RexContextType | undefined>(undefined);

interface RexProviderProps {
    children: ReactNode;
}

export function RexProvider({ children }: RexProviderProps) {
    const [state, dispatch] = useReducer(rexReducer, initialState);

    // Load state from localStorage on mount
    useEffect(() => {
        const savedState = loadState();
        if (savedState) {
            dispatch({ type: 'LOAD_STATE', payload: savedState });
        }
    }, []);

    // Save state to localStorage on changes
    useEffect(() => {
        saveState(state);
    }, [state]);

    return (
        <RexContext.Provider value={{ state, dispatch }}>
            {children}
        </RexContext.Provider>
    );
}

export function useRex(): RexContextType {
    const context = useContext(RexContext);
    if (!context) {
        throw new Error('useRex must be used within a RexProvider');
    }
    return context;
}

export function useProfile() {
    const { state } = useRex();
    return state.profile;
}

export function useHabits() {
    const { state } = useRex();
    return state.habits;
}

export function useWorkoutPlan() {
    const { state } = useRex();
    return state.workoutPlan;
}

export function useDietTargets() {
    const { state } = useRex();
    return state.dietTargets;
}
