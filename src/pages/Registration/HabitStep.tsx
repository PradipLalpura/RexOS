// RexOS Registration - Habit Step

import { useState } from 'react';
import { useRex } from '../../store/RexContext';
import type { Habit } from '../../types';
import { generateId } from '../../utils/storage';
import './Registration.css';

const PRESET_HABITS = [
    { name: 'Sleep 7-8 Hours', icon: '🌙', suggested: 'Quality sleep for recovery and mental clarity' },
    { name: 'Drink Water', icon: '💧', suggested: 'Stay hydrated - minimum 2-3 liters daily' },
    { name: 'Reading', icon: '📖', suggested: 'Read for at least 30 minutes daily' },
    { name: 'Meditation', icon: '🧘', suggested: 'Practice mindfulness for 10-20 minutes' },
    { name: 'Workout', icon: '💪', suggested: 'Complete your daily training session' },
    { name: 'Journaling', icon: '📝', suggested: 'Reflect on your day and set intentions' },
    { name: 'Cold Shower', icon: '🥶', suggested: 'Start or end your day with cold exposure' },
    { name: 'No Social Media', icon: '📵', suggested: 'Limit mindless scrolling' },
    { name: 'Walk 10k Steps', icon: '🚶', suggested: 'Stay active throughout the day' },
    { name: 'Healthy Eating', icon: '🥗', suggested: 'Follow your nutrition plan strictly' },
];

const CUSTOM_ICONS = ['⭐', '🎯', '🔥', '💎', '🚀', '⚡', '🌟', '✨'];

interface HabitStepProps {
    onNext: () => void;
    onBack: () => void;
}

export default function HabitStep({ onNext, onBack }: HabitStepProps) {
    const { state, dispatch } = useRex();
    const [selectedHabits, setSelectedHabits] = useState<Map<string, { name: string; icon: string; description: string; isCustom?: boolean }>>(
        () => {
            const map = new Map();
            state.habits.forEach(h => map.set(h.name, { name: h.name, icon: h.icon, description: h.description }));
            return map;
        }
    );
    const [error, setError] = useState('');

    // Custom habit state
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [customIcon, setCustomIcon] = useState('⭐');

    const toggleHabit = (preset: typeof PRESET_HABITS[0]) => {
        const newSelected = new Map(selectedHabits);
        if (newSelected.has(preset.name)) {
            newSelected.delete(preset.name);
        } else {
            newSelected.set(preset.name, {
                name: preset.name,
                icon: preset.icon,
                description: preset.suggested,
            });
        }
        setSelectedHabits(newSelected);
        setError('');
    };

    const updateDescription = (name: string, description: string) => {
        const newSelected = new Map(selectedHabits);
        const habit = newSelected.get(name);
        if (habit) {
            newSelected.set(name, { ...habit, description });
            setSelectedHabits(newSelected);
        }
    };

    const addCustomHabit = () => {
        if (!customName.trim()) {
            setError('Enter a name for your custom habit');
            return;
        }
        if (!customDescription.trim()) {
            setError('Enter a description for your custom habit');
            return;
        }
        if (selectedHabits.has(customName.trim())) {
            setError('A habit with this name already exists');
            return;
        }

        const newSelected = new Map(selectedHabits);
        newSelected.set(customName.trim(), {
            name: customName.trim(),
            icon: customIcon,
            description: customDescription.trim(),
            isCustom: true,
        });
        setSelectedHabits(newSelected);

        // Reset form
        setCustomName('');
        setCustomDescription('');
        setCustomIcon('⭐');
        setShowCustomForm(false);
        setError('');
    };

    const removeHabit = (name: string) => {
        const newSelected = new Map(selectedHabits);
        newSelected.delete(name);
        setSelectedHabits(newSelected);
    };

    const handleSubmit = () => {
        if (selectedHabits.size === 0) {
            setError('Select at least one habit to track');
            return;
        }

        const missingDescriptions = Array.from(selectedHabits.values()).filter(h => !h.description.trim());
        if (missingDescriptions.length > 0) {
            setError('Add descriptions to all selected habits');
            return;
        }

        const habits: Habit[] = Array.from(selectedHabits.values()).map(h => ({
            id: generateId(),
            name: h.name,
            icon: h.icon,
            description: h.description,
        }));

        dispatch({ type: 'SET_HABITS', payload: habits });
        onNext();
    };

    return (
        <div className="registration-step animate-fadeIn">
            <div className="step-header">
                <span className="step-number">02</span>
                <h1 className="step-title">DAILY HABITS</h1>
                <p className="step-subtitle">Select the habits you commit to tracking every single day.</p>
            </div>

            <div className="habit-grid">
                {PRESET_HABITS.map((preset) => {
                    const isSelected = selectedHabits.has(preset.name);
                    return (
                        <div
                            key={preset.name}
                            className={`habit-card ${isSelected ? 'habit-card-selected' : ''}`}
                            onClick={() => toggleHabit(preset)}
                        >
                            <div className="habit-card-header">
                                <span className="habit-icon">{preset.icon}</span>
                                <span className="habit-name">{preset.name}</span>
                                <div className={`habit-checkbox ${isSelected ? 'checked' : ''}`}>
                                    {isSelected && '✓'}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Create Custom Habit Card */}
                <div
                    className={`habit-card habit-card-custom ${showCustomForm ? 'habit-card-selected' : ''}`}
                    onClick={() => !showCustomForm && setShowCustomForm(true)}
                >
                    <div className="habit-card-header">
                        <span className="habit-icon">➕</span>
                        <span className="habit-name">Create Custom</span>
                    </div>
                </div>
            </div>

            {/* Custom Habit Form */}
            {showCustomForm && (
                <div className="custom-habit-form">
                    <h3 className="config-title">Create Custom Habit</h3>

                    <div className="input-group">
                        <label className="input-label">Habit Name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g., Learn a Language"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Select Icon</label>
                        <div className="icon-selector">
                            {CUSTOM_ICONS.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    className={`icon-btn ${customIcon === icon ? 'selected' : ''}`}
                                    onClick={() => setCustomIcon(icon)}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Description</label>
                        <textarea
                            className="input textarea"
                            placeholder="Describe your commitment..."
                            value={customDescription}
                            onChange={(e) => setCustomDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="custom-habit-actions">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setShowCustomForm(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={addCustomHabit}
                        >
                            Add Habit
                        </button>
                    </div>
                </div>
            )}

            {selectedHabits.size > 0 && (
                <div className="selected-habits-config">
                    <h3 className="config-title">Configure Your Habits</h3>
                    <p className="config-subtitle">Add a personal description for each habit</p>

                    {Array.from(selectedHabits.entries()).map(([name, habit]) => (
                        <div key={name} className="habit-config-item">
                            <div className="habit-config-header">
                                <span className="habit-icon">{habit.icon}</span>
                                <span className="habit-name">{name}</span>
                                {habit.isCustom && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-icon remove-habit-btn"
                                        onClick={() => removeHabit(name)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <textarea
                                className="input textarea"
                                placeholder="Describe your commitment... (e.g., 'Read 30 pages every morning')"
                                value={habit.description}
                                onChange={(e) => updateDescription(name, e.target.value)}
                                rows={2}
                            />
                        </div>
                    ))}
                </div>
            )}

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
