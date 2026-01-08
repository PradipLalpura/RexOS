// RexOS Registration - Diet Step

import { useState } from 'react';
import { useRex } from '../../store/RexContext';
import type { DietTargets } from '../../types';
import './Registration.css';

interface DietStepProps {
    onComplete: () => void;
    onBack: () => void;
}

export default function DietStep({ onComplete, onBack }: DietStepProps) {
    const { state, dispatch } = useRex();
    const [calories, setCalories] = useState(state.dietTargets?.calories?.toString() || '2000');
    const [protein, setProtein] = useState(state.dietTargets?.protein?.toString() || '150');
    const [carbs, setCarbs] = useState(state.dietTargets?.carbs?.toString() || '200');
    const [fat, setFat] = useState(state.dietTargets?.fat?.toString() || '70');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        const caloriesNum = parseInt(calories);
        if (!calories || isNaN(caloriesNum) || caloriesNum < 1000 || caloriesNum > 5000) {
            newErrors.calories = 'Enter valid calories (1000-5000)';
        }

        const proteinNum = parseInt(protein);
        if (!protein || isNaN(proteinNum) || proteinNum < 50 || proteinNum > 400) {
            newErrors.protein = 'Enter valid protein (50-400g)';
        }

        const carbsNum = parseInt(carbs);
        if (!carbs || isNaN(carbsNum) || carbsNum < 0 || carbsNum > 600) {
            newErrors.carbs = 'Enter valid carbs (0-600g)';
        }

        const fatNum = parseInt(fat);
        if (!fat || isNaN(fatNum) || fatNum < 20 || fatNum > 200) {
            newErrors.fat = 'Enter valid fat (20-200g)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const dietTargets: DietTargets = {
            calories: parseInt(calories),
            protein: parseInt(protein),
            carbs: parseInt(carbs),
            fat: parseInt(fat),
        };

        dispatch({ type: 'SET_DIET_TARGETS', payload: dietTargets });
        dispatch({ type: 'COMPLETE_REGISTRATION' });
        onComplete();
    };

    // Calculate macro percentages
    const totalMacroCalories = (parseInt(protein) || 0) * 4 + (parseInt(carbs) || 0) * 4 + (parseInt(fat) || 0) * 9;
    const targetCalories = parseInt(calories) || 2000;
    const proteinPercent = Math.round(((parseInt(protein) || 0) * 4 / totalMacroCalories) * 100) || 0;
    const carbsPercent = Math.round(((parseInt(carbs) || 0) * 4 / totalMacroCalories) * 100) || 0;
    const fatPercent = Math.round(((parseInt(fat) || 0) * 9 / totalMacroCalories) * 100) || 0;

    return (
        <div className="registration-step animate-fadeIn">
            <div className="step-header">
                <span className="step-number">04</span>
                <h1 className="step-title">NUTRITION TARGETS</h1>
                <p className="step-subtitle">Fuel your machine. Define your daily nutrition goals.</p>
            </div>

            <form onSubmit={handleSubmit} className="registration-form">
                {/* Calories */}
                <div className="input-group">
                    <label className="input-label" htmlFor="calories">Daily Calories</label>
                    <div className="input-with-suffix">
                        <input
                            id="calories"
                            type="number"
                            className={`input ${errors.calories ? 'input-error' : ''}`}
                            placeholder="2000"
                            value={calories}
                            onChange={(e) => setCalories(e.target.value)}
                        />
                        <span className="input-suffix">kcal</span>
                    </div>
                    {errors.calories && <span className="error-text">{errors.calories}</span>}
                </div>

                {/* Macros */}
                <div className="macros-grid">
                    <div className="input-group">
                        <label className="input-label" htmlFor="protein">
                            Protein
                            <span className="macro-percent">{proteinPercent}%</span>
                        </label>
                        <div className="input-with-suffix">
                            <input
                                id="protein"
                                type="number"
                                className={`input ${errors.protein ? 'input-error' : ''}`}
                                placeholder="150"
                                value={protein}
                                onChange={(e) => setProtein(e.target.value)}
                            />
                            <span className="input-suffix">g</span>
                        </div>
                        {errors.protein && <span className="error-text">{errors.protein}</span>}
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="carbs">
                            Carbs
                            <span className="macro-percent">{carbsPercent}%</span>
                        </label>
                        <div className="input-with-suffix">
                            <input
                                id="carbs"
                                type="number"
                                className={`input ${errors.carbs ? 'input-error' : ''}`}
                                placeholder="200"
                                value={carbs}
                                onChange={(e) => setCarbs(e.target.value)}
                            />
                            <span className="input-suffix">g</span>
                        </div>
                        {errors.carbs && <span className="error-text">{errors.carbs}</span>}
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="fat">
                            Fat
                            <span className="macro-percent">{fatPercent}%</span>
                        </label>
                        <div className="input-with-suffix">
                            <input
                                id="fat"
                                type="number"
                                className={`input ${errors.fat ? 'input-error' : ''}`}
                                placeholder="70"
                                value={fat}
                                onChange={(e) => setFat(e.target.value)}
                            />
                            <span className="input-suffix">g</span>
                        </div>
                        {errors.fat && <span className="error-text">{errors.fat}</span>}
                    </div>
                </div>

                {/* Macro Distribution Preview */}
                <div className="macro-preview">
                    <h4>Macro Distribution</h4>
                    <div className="macro-bar">
                        <div className="macro-segment protein" style={{ width: `${proteinPercent}%` }}>
                            {proteinPercent > 10 && `P ${proteinPercent}%`}
                        </div>
                        <div className="macro-segment carbs" style={{ width: `${carbsPercent}%` }}>
                            {carbsPercent > 10 && `C ${carbsPercent}%`}
                        </div>
                        <div className="macro-segment fat" style={{ width: `${fatPercent}%` }}>
                            {fatPercent > 10 && `F ${fatPercent}%`}
                        </div>
                    </div>
                    <div className="macro-legend">
                        <span className="legend-item"><span className="dot protein"></span> Protein</span>
                        <span className="legend-item"><span className="dot carbs"></span> Carbs</span>
                        <span className="legend-item"><span className="dot fat"></span> Fat</span>
                    </div>
                    <p className="macro-total">
                        Total from macros: {totalMacroCalories} kcal
                        {Math.abs(totalMacroCalories - targetCalories) > 100 && (
                            <span className="macro-warning"> (Adjust to match target)</span>
                        )}
                    </p>
                </div>

                <div className="step-actions">
                    <button type="button" className="btn btn-secondary" onClick={onBack}>
                        ← BACK
                    </button>
                    <button type="submit" className="btn btn-primary btn-lg complete-btn">
                        🚀 START REXOS
                    </button>
                </div>
            </form>
        </div>
    );
}
