// RexOS Registration - Profile Step

import { useState } from 'react';
import { useRex } from '../../store/RexContext';
import type { UserProfile } from '../../types';
import './Registration.css';

interface ProfileStepProps {
    onNext: () => void;
}

export default function ProfileStep({ onNext }: ProfileStepProps) {
    const { state, dispatch } = useRex();
    const [name, setName] = useState(state.profile?.name || '');
    const [weight, setWeight] = useState(state.profile?.weight?.toString() || '');
    const [height, setHeight] = useState(state.profile?.height?.toString() || '');
    const [errors, setErrors] = useState<{ name?: string; weight?: string; height?: string }>({});

    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        const weightNum = parseFloat(weight);
        if (!weight || isNaN(weightNum) || weightNum < 20 || weightNum > 300) {
            newErrors.weight = 'Enter valid weight (20-300 kg)';
        }

        const heightNum = parseFloat(height);
        if (!height || isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
            newErrors.height = 'Enter valid height (100-250 cm)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const profile: UserProfile = {
            name: name.trim(),
            weight: parseFloat(weight),
            height: parseFloat(height),
            createdAt: new Date().toISOString(),
        };

        dispatch({ type: 'SET_PROFILE', payload: profile });
        onNext();
    };

    return (
        <div className="registration-step animate-fadeIn">
            <div className="step-header">
                <span className="step-number">01</span>
                <h1 className="step-title">WHO ARE YOU?</h1>
                <p className="step-subtitle">Your identity. Your data. Your mission.</p>
            </div>

            <form onSubmit={handleSubmit} className="registration-form">
                <div className="input-group">
                    <label className="input-label" htmlFor="name">Your Name</label>
                    <input
                        id="name"
                        type="text"
                        className={`input ${errors.name ? 'input-error' : ''}`}
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="input-row">
                    <div className="input-group">
                        <label className="input-label" htmlFor="weight">Weight (kg)</label>
                        <input
                            id="weight"
                            type="number"
                            className={`input ${errors.weight ? 'input-error' : ''}`}
                            placeholder="75"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            step="0.1"
                        />
                        {errors.weight && <span className="error-text">{errors.weight}</span>}
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="height">Height (cm)</label>
                        <input
                            id="height"
                            type="number"
                            className={`input ${errors.height ? 'input-error' : ''}`}
                            placeholder="175"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                        />
                        {errors.height && <span className="error-text">{errors.height}</span>}
                    </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg submit-btn">
                    CONTINUE →
                </button>
            </form>
        </div>
    );
}
