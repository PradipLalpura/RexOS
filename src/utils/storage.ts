// RexOS Storage Utilities

import type { RexState } from '../types';

const STORAGE_KEY = 'rexos_data';

export const saveState = (state: RexState): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save state:', error);
    }
};

export const loadState = (): RexState | null => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Failed to load state:', error);
    }
    return null;
};

export const clearState = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear state:', error);
    }
};

export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

export const getDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export const getWeekDates = (date: Date): string[] => {
    const dates: string[] = [];
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(formatDate(d));
    }

    return dates;
};
