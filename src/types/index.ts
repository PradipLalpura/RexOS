// RexOS Type Definitions

export interface UserProfile {
  name: string;
  weight: number;
  height: number;
  measurements?: BodyMeasurements;
  createdAt: string;
}

export interface BodyMeasurements {
  biceps?: number;
  chest?: number;
  waist?: number;
  abs?: number;
  thighs?: number;
  calves?: number;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface HabitLog {
  habitId: string;
  completed: boolean;
  completedAt?: string;
}

export interface DailyHabitRecord {
  date: string;
  logs: HabitLog[];
}

export type WorkoutPlanType = 'gym' | 'home' | 'both';

export interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: number;
}

export interface DayWorkout {
  day: string;
  workoutName: string; // e.g., "Push", "Pull", "Legs"
  exercises: Exercise[];
}

export interface WorkoutPlan {
  type: WorkoutPlanType;
  gym?: DayWorkout[];
  home?: DayWorkout[];
}

export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weight: number;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: ExerciseSet[];
}

export interface AdditionalExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface WorkoutLog {
  date: string;
  planType: 'gym' | 'home';
  exercises: ExerciseLog[];
  additionalExercises?: AdditionalExercise[]; // Today-only additional exercises
  completedAt?: string;
}

export interface DietTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  id: string;
  name: string;
  weight: number; // grams
}

export interface Meal {
  id: string;
  mealName: string; // "Breakfast", "Lunch", "Dinner", "Snack", or custom
  foodItems: FoodItem[]; // Multiple food items
  quantity: number; // Total quantity (for backward compatibility)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

export interface DailyDietLog {
  date: string;
  meals: Meal[];
}

export interface DailyNote {
  date: string;
  content: string;
  updatedAt: string;
}

export interface RexState {
  isRegistered: boolean;
  currentStep: number;
  profile: UserProfile | null;
  habits: Habit[];
  workoutPlan: WorkoutPlan | null;
  dietTargets: DietTargets | null;
  habitRecords: DailyHabitRecord[];
  workoutLogs: WorkoutLog[];
  dietLogs: DailyDietLog[];
  notes: DailyNote[];
}

export type RexAction =
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'SET_HABITS'; payload: Habit[] }
  | { type: 'SET_WORKOUT_PLAN'; payload: WorkoutPlan }
  | { type: 'SET_DIET_TARGETS'; payload: DietTargets }
  | { type: 'COMPLETE_REGISTRATION' }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'LOG_HABIT'; payload: { date: string; log: HabitLog } }
  | { type: 'LOG_WORKOUT'; payload: WorkoutLog }
  | { type: 'UPDATE_WORKOUT_LOG'; payload: WorkoutLog }
  | { type: 'ADD_ADDITIONAL_EXERCISE'; payload: { date: string; exercise: AdditionalExercise } }
  | { type: 'REMOVE_ADDITIONAL_EXERCISE'; payload: { date: string; exerciseId: string } }
  | { type: 'LOG_MEAL'; payload: { date: string; meal: Meal } }
  | { type: 'DELETE_MEAL'; payload: { date: string; mealId: string } }
  | { type: 'LOG_NOTE'; payload: DailyNote }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'LOAD_STATE'; payload: RexState }
  | { type: 'RESET' };
