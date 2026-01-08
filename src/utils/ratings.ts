// RexOS Rule-Based Ratings Engine

import type { RexState } from '../types';

export interface Rating {
    score: number;
    message: string;
    type: 'excellent' | 'good' | 'warning' | 'danger';
}

export const calculateHabitRating = (
    state: RexState,
    date: string
): Rating => {
    const record = state.habitRecords.find(r => r.date === date);
    const totalHabits = state.habits.length;

    if (!record || totalHabits === 0) {
        return { score: 0, message: 'No habits tracked yet.', type: 'warning' };
    }

    const completed = record.logs.filter(l => l.completed).length;
    const percentage = (completed / totalHabits) * 100;

    if (percentage === 100) {
        return { score: 100, message: 'PERFECT! All habits crushed. Stay aggressive.', type: 'excellent' };
    } else if (percentage >= 80) {
        return { score: percentage, message: 'Doing great. Push for 100% tomorrow.', type: 'good' };
    } else if (percentage >= 50) {
        return { score: percentage, message: 'Needs improvement. Discipline requires consistency.', type: 'warning' };
    } else {
        return { score: percentage, message: 'Unacceptable. Reset. Execute harder tomorrow.', type: 'danger' };
    }
};

export const calculateWorkoutRating = (
    state: RexState,
    date: string
): Rating => {
    const log = state.workoutLogs.find(l => l.date === date);

    if (!log || !state.workoutPlan) {
        return { score: 0, message: 'No workout logged.', type: 'warning' };
    }

    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const planExercises = state.workoutPlan.type === 'both'
        ? (log.planType === 'gym'
            ? state.workoutPlan.gym?.find(d => d.day === dayName)?.exercises
            : state.workoutPlan.home?.find(d => d.day === dayName)?.exercises)
        : (state.workoutPlan.type === 'gym'
            ? state.workoutPlan.gym?.find(d => d.day === dayName)?.exercises
            : state.workoutPlan.home?.find(d => d.day === dayName)?.exercises);

    if (!planExercises || planExercises.length === 0) {
        return { score: 100, message: 'Rest day. Recovery is part of the process.', type: 'good' };
    }

    const completedExercises = log.exercises.filter(e => e.sets.length > 0).length;
    const percentage = (completedExercises / planExercises.length) * 100;

    // Calculate intensity based on volume
    let totalVolume = 0;
    log.exercises.forEach(e => {
        e.sets.forEach(s => {
            totalVolume += s.reps * s.weight;
        });
    });

    if (percentage === 100) {
        return { score: 100, message: `EXECUTED! Total volume: ${totalVolume.toLocaleString()}kg. Beast mode.`, type: 'excellent' };
    } else if (percentage >= 75) {
        return { score: percentage, message: `Solid session. Volume: ${totalVolume.toLocaleString()}kg. Finish stronger next time.`, type: 'good' };
    } else if (percentage >= 50) {
        return { score: percentage, message: 'Half-effort gets half-results. Complete the workout.', type: 'warning' };
    } else {
        return { score: percentage, message: 'Workout incomplete. No excuses. Execute fully.', type: 'danger' };
    }
};

export const calculateDietRating = (
    state: RexState,
    date: string
): Rating => {
    const log = state.dietLogs.find(l => l.date === date);
    const targets = state.dietTargets;

    if (!targets) {
        return { score: 0, message: 'Set your diet targets first.', type: 'warning' };
    }

    if (!log || log.meals.length === 0) {
        return { score: 0, message: 'No meals logged. Track your nutrition.', type: 'danger' };
    }

    const totals = log.meals.reduce(
        (acc, meal) => ({
            calories: acc.calories + meal.calories,
            protein: acc.protein + meal.protein,
            carbs: acc.carbs + meal.carbs,
            fat: acc.fat + meal.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const proteinPercentage = Math.min((totals.protein / targets.protein) * 100, 100);
    const calorieDeviation = Math.abs(totals.calories - targets.calories) / targets.calories * 100;

    const score = (proteinPercentage * 0.5) + (Math.max(0, 100 - calorieDeviation) * 0.5);

    if (proteinPercentage >= 90 && calorieDeviation <= 10) {
        return { score, message: `Nutrition on point. ${totals.protein}g protein. Excellent execution.`, type: 'excellent' };
    } else if (proteinPercentage >= 80) {
        return { score, message: `${totals.protein}g protein. Close to target. Stay consistent.`, type: 'good' };
    } else if (proteinPercentage >= 60) {
        return { score, message: 'Diet needs work. Prioritize protein intake.', type: 'warning' };
    } else {
        return { score, message: 'Nutrition failure. Fuel your body properly.', type: 'danger' };
    }
};

export const getDailyOverallRating = (
    state: RexState,
    date: string
): Rating => {
    const habitRating = calculateHabitRating(state, date);
    const workoutRating = calculateWorkoutRating(state, date);
    const dietRating = calculateDietRating(state, date);

    const avgScore = (habitRating.score + workoutRating.score + dietRating.score) / 3;

    if (avgScore >= 90) {
        return { score: avgScore, message: 'DOMINANT DAY. This is who you are. Stay aggressive.', type: 'excellent' };
    } else if (avgScore >= 75) {
        return { score: avgScore, message: 'Solid execution. Room for improvement. Push harder.', type: 'good' };
    } else if (avgScore >= 50) {
        return { score: avgScore, message: 'Mediocre performance. You are capable of more.', type: 'warning' };
    } else {
        return { score: avgScore, message: 'Unacceptable. Tomorrow is a new battle. Win it.', type: 'danger' };
    }
};

export const getWeeklyConsistency = (
    state: RexState,
    dates: string[]
): number => {
    let completedDays = 0;

    dates.forEach(date => {
        const habitRecord = state.habitRecords.find(r => r.date === date);
        const workoutLog = state.workoutLogs.find(l => l.date === date);

        if (habitRecord && habitRecord.logs.some(l => l.completed)) {
            completedDays += 0.5;
        }
        if (workoutLog && workoutLog.exercises.length > 0) {
            completedDays += 0.5;
        }
    });

    return (completedDays / dates.length) * 100;
};
