// RexOS Diet Tracker

import { useState } from 'react';
import { useRex } from '../../store/RexContext';
import { formatDate, formatTime, generateId, getDayName } from '../../utils/storage';
import { calculateDietRating } from '../../utils/ratings';
import type { Meal, FoodItem } from '../../types';
import './DietTracker.css';

const MEAL_PRESETS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];

export default function DietTracker() {
    const { state, dispatch } = useRex();
    const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
    const [showAddModal, setShowAddModal] = useState(false);

    const dayName = getDayName(new Date(selectedDate));
    const isToday = selectedDate === formatDate(new Date());
    const rating = calculateDietRating(state, selectedDate);
    const targets = state.dietTargets;

    const dietLog = state.dietLogs.find(l => l.date === selectedDate);
    const meals = dietLog?.meals || [];

    const totals = meals.reduce(
        (acc, m) => ({
            calories: acc.calories + m.calories,
            protein: acc.protein + m.protein,
            carbs: acc.carbs + m.carbs,
            fat: acc.fat + m.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const navigateDays = (offset: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + offset);
        setSelectedDate(formatDate(date));
    };

    const handleAddMeal = (meal: Omit<Meal, 'id'>) => {
        const newMeal: Meal = {
            ...meal,
            id: generateId(),
        };
        dispatch({ type: 'LOG_MEAL', payload: { date: selectedDate, meal: newMeal } });
        setShowAddModal(false);
    };

    const handleDeleteMeal = (mealId: string) => {
        dispatch({ type: 'DELETE_MEAL', payload: { date: selectedDate, mealId } });
    };

    const getProgress = (current: number, target: number) => {
        if (target === 0) return 0;
        return Math.min((current / target) * 100, 100);
    };

    // Helper to display food items
    const formatFoodItems = (foodItems: FoodItem[]) => {
        if (!foodItems || foodItems.length === 0) return 'No items';
        return foodItems.map(item => `${item.name} (${item.weight}g)`).join(', ');
    };

    return (
        <div className="diet-tracker animate-fadeIn">
            <header className="tracker-header">
                <div>
                    <h1>Nutrition</h1>
                    <p className="tracker-subtitle">
                        {isToday ? 'Today' : dayName} - {new Date(selectedDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>

                <div className="header-actions">
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

                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        + Add Meal
                    </button>
                </div>
            </header>

            {/* Nutrition Overview */}
            <div className={`nutrition-overview rating-${rating.type}`}>
                <div className="macro-cards">
                    {/* Calories */}
                    <div className="macro-card calories">
                        <div className="macro-header">
                            <span className="macro-icon">🔥</span>
                            <span className="macro-name">Calories</span>
                        </div>
                        <div className="macro-value">
                            <span className="current">{totals.calories}</span>
                            <span className="target">/ {targets?.calories || 0}</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill progress-fill-warning"
                                style={{ width: `${getProgress(totals.calories, targets?.calories || 1)}%` }}
                            />
                        </div>
                    </div>

                    {/* Protein */}
                    <div className="macro-card protein">
                        <div className="macro-header">
                            <span className="macro-icon">💪</span>
                            <span className="macro-name">Protein</span>
                        </div>
                        <div className="macro-value">
                            <span className="current">{totals.protein}g</span>
                            <span className="target">/ {targets?.protein || 0}g</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${getProgress(totals.protein, targets?.protein || 1)}%`,
                                    background: '#ef4444'
                                }}
                            />
                        </div>
                    </div>

                    {/* Carbs */}
                    <div className="macro-card carbs">
                        <div className="macro-header">
                            <span className="macro-icon">🍞</span>
                            <span className="macro-name">Carbs</span>
                        </div>
                        <div className="macro-value">
                            <span className="current">{totals.carbs}g</span>
                            <span className="target">/ {targets?.carbs || 0}g</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${getProgress(totals.carbs, targets?.carbs || 1)}%`,
                                    background: '#f59e0b'
                                }}
                            />
                        </div>
                    </div>

                    {/* Fat */}
                    <div className="macro-card fat">
                        <div className="macro-header">
                            <span className="macro-icon">🥑</span>
                            <span className="macro-name">Fat</span>
                        </div>
                        <div className="macro-value">
                            <span className="current">{totals.fat}g</span>
                            <span className="target">/ {targets?.fat || 0}g</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${getProgress(totals.fat, targets?.fat || 1)}%`,
                                    background: '#22c55e'
                                }}
                            />
                        </div>
                    </div>
                </div>

                <p className="rating-message">{rating.message}</p>
            </div>

            {/* Meals List */}
            <div className="meals-section">
                <h2>Meals ({meals.length})</h2>

                {meals.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🍽️</div>
                        <h3 className="empty-state-title">No meals logged</h3>
                        <p className="empty-state-text">Track your nutrition to hit your targets.</p>
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            + Add First Meal
                        </button>
                    </div>
                ) : (
                    <div className="meals-list">
                        {meals.map((meal) => (
                            <div key={meal.id} className="meal-card">
                                <div className="meal-header">
                                    <div className="meal-info">
                                        <h3 className="meal-name">{meal.mealName}</h3>
                                        <p className="meal-items">{formatFoodItems(meal.foodItems)}</p>
                                        <p className="meal-time">{meal.time} • {meal.quantity}g total</p>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => handleDeleteMeal(meal.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <div className="meal-macros">
                                    <span className="meal-macro cal">{meal.calories} kcal</span>
                                    <span className="meal-macro pro">{meal.protein}g P</span>
                                    <span className="meal-macro carb">{meal.carbs}g C</span>
                                    <span className="meal-macro fat">{meal.fat}g F</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Meal Modal */}
            {showAddModal && (
                <MealModal
                    onClose={() => setShowAddModal(false)}
                    onSave={handleAddMeal}
                />
            )}
        </div>
    );
}

interface MealModalProps {
    onClose: () => void;
    onSave: (meal: Omit<Meal, 'id'>) => void;
}

function MealModal({ onClose, onSave }: MealModalProps) {
    const [step, setStep] = useState<'name' | 'items'>('name');
    const [mealName, setMealName] = useState('');
    const [customMealName, setCustomMealName] = useState('');
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [currentItem, setCurrentItem] = useState({ name: '', weight: '' });
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [time, setTime] = useState(formatTime(new Date()));
    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedMealName = mealName === 'custom' ? customMealName : mealName;

    const handleSelectPreset = (name: string) => {
        setMealName(name);
        setStep('items');
    };

    const handleCustomName = () => {
        if (!customMealName.trim()) {
            setErrors({ customMealName: 'Required' });
            return;
        }
        setMealName('custom');
        setStep('items');
    };

    const addFoodItem = () => {
        if (!currentItem.name.trim()) return;
        const weight = parseInt(currentItem.weight) || 0;
        const newItem: FoodItem = {
            id: generateId(),
            name: currentItem.name.trim(),
            weight,
        };
        setFoodItems([...foodItems, newItem]);
        setCurrentItem({ name: '', weight: '' });
    };

    const removeFoodItem = (id: string) => {
        setFoodItems(foodItems.filter(item => item.id !== id));
    };

    const totalWeight = foodItems.reduce((acc, item) => acc + item.weight, 0);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!selectedMealName.trim()) newErrors.mealName = 'Required';
        if (foodItems.length === 0) newErrors.foodItems = 'Add at least one item';
        if (!calories || parseInt(calories) < 0) newErrors.calories = 'Required';
        if (!protein || parseInt(protein) < 0) newErrors.protein = 'Required';
        if (!carbs || parseInt(carbs) < 0) newErrors.carbs = 'Required';
        if (!fat || parseInt(fat) < 0) newErrors.fat = 'Required';
        if (!time) newErrors.time = 'Required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        onSave({
            mealName: selectedMealName,
            foodItems,
            quantity: totalWeight,
            calories: parseInt(calories),
            protein: parseInt(protein),
            carbs: parseInt(carbs),
            fat: parseInt(fat),
            time,
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {step === 'name' ? 'Select Meal Type' : `${selectedMealName} - Add Items`}
                    </h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                {step === 'name' ? (
                    <div className="modal-body">
                        <div className="meal-presets">
                            {MEAL_PRESETS.map(preset => (
                                <button
                                    key={preset}
                                    className="btn btn-preset"
                                    onClick={() => handleSelectPreset(preset)}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>

                        <div className="custom-meal-input">
                            <input
                                type="text"
                                className={`input ${errors.customMealName ? 'input-error' : ''}`}
                                placeholder="Or enter custom meal name..."
                                value={customMealName}
                                onChange={(e) => setCustomMealName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCustomName()}
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={handleCustomName}
                                disabled={!customMealName.trim()}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="modal-body">
                        {/* Food Items Section */}
                        <div className="food-items-section">
                            <h4>Food Items {errors.foodItems && <span className="error-text">({errors.foodItems})</span>}</h4>

                            <div className="add-item-row">
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Item name (e.g., Chicken breast)"
                                    value={currentItem.name}
                                    onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                                />
                                <input
                                    type="number"
                                    className="input input-small"
                                    placeholder="Weight (g)"
                                    value={currentItem.weight}
                                    onChange={(e) => setCurrentItem({ ...currentItem, weight: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={addFoodItem}
                                    disabled={!currentItem.name.trim()}
                                >
                                    + Add
                                </button>
                            </div>

                            {foodItems.length > 0 && (
                                <div className="food-items-list">
                                    {foodItems.map(item => (
                                        <div key={item.id} className="food-item-tag">
                                            <span>{item.name} ({item.weight}g)</span>
                                            <button
                                                type="button"
                                                className="remove-item"
                                                onClick={() => removeFoodItem(item.id)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <div className="total-weight">Total: {totalWeight}g</div>
                                </div>
                            )}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Time</label>
                            <input
                                type="time"
                                className={`input ${errors.time ? 'input-error' : ''}`}
                                value={time.split(' ')[0]}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>

                        <div className="macro-inputs">
                            <div className="input-group">
                                <label className="input-label">Calories</label>
                                <input
                                    type="number"
                                    className={`input ${errors.calories ? 'input-error' : ''}`}
                                    placeholder="500"
                                    value={calories}
                                    onChange={(e) => setCalories(e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Protein (g)</label>
                                <input
                                    type="number"
                                    className={`input ${errors.protein ? 'input-error' : ''}`}
                                    placeholder="40"
                                    value={protein}
                                    onChange={(e) => setProtein(e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Carbs (g)</label>
                                <input
                                    type="number"
                                    className={`input ${errors.carbs ? 'input-error' : ''}`}
                                    placeholder="50"
                                    value={carbs}
                                    onChange={(e) => setCarbs(e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Fat (g)</label>
                                <input
                                    type="number"
                                    className={`input ${errors.fat ? 'input-error' : ''}`}
                                    placeholder="15"
                                    value={fat}
                                    onChange={(e) => setFat(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-ghost" onClick={() => setStep('name')}>
                                ← Back
                            </button>
                            <div className="footer-actions">
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Meal
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
