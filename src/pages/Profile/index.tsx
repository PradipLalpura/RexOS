// RexOS Profile Page

import { useState } from 'react';
import { useRex } from '../../store/RexContext';
import type { BodyMeasurements } from '../../types';
import './Profile.css';

export default function Profile() {
    const { state, dispatch } = useRex();
    const profile = state.profile;

    const [isEditing, setIsEditing] = useState(false);
    const [weight, setWeight] = useState(profile?.weight?.toString() || '');
    const [height, setHeight] = useState(profile?.height?.toString() || '');
    const [measurements, setMeasurements] = useState<Partial<BodyMeasurements>>(
        profile?.measurements || {}
    );

    if (!profile) {
        return (
            <div className="profile">
                <div className="empty-state">
                    <div className="empty-state-icon">👤</div>
                    <h3 className="empty-state-title">No Profile</h3>
                    <p className="empty-state-text">Complete registration to set up your profile.</p>
                </div>
            </div>
        );
    }

    const calculateBMI = (): number => {
        const w = parseFloat(weight) || profile.weight;
        const h = (parseFloat(height) || profile.height) / 100; // convert cm to m
        if (w && h) {
            return Math.round((w / (h * h)) * 10) / 10;
        }
        return 0;
    };

    const getBMICategory = (bmi: number): { label: string; color: string } => {
        if (bmi < 18.5) return { label: 'Underweight', color: 'var(--color-warning)' };
        if (bmi < 25) return { label: 'Normal', color: 'var(--color-success)' };
        if (bmi < 30) return { label: 'Overweight', color: 'var(--color-warning)' };
        return { label: 'Obese', color: 'var(--color-danger)' };
    };

    const bmi = calculateBMI();
    const bmiCategory = getBMICategory(bmi);

    const handleSave = () => {
        dispatch({
            type: 'UPDATE_PROFILE',
            payload: {
                weight: parseFloat(weight) || profile.weight,
                height: parseFloat(height) || profile.height,
                measurements: {
                    ...measurements,
                    updatedAt: new Date().toISOString(),
                } as BodyMeasurements,
            },
        });
        setIsEditing(false);
    };

    const updateMeasurement = (key: keyof BodyMeasurements, value: string) => {
        setMeasurements(prev => ({
            ...prev,
            [key]: value ? parseFloat(value) : undefined,
        }));
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to reset RexOS? All data will be deleted.')) {
            dispatch({ type: 'RESET' });
            window.location.href = '/';
        }
    };

    return (
        <div className="profile animate-fadeIn">
            <header className="profile-header">
                <h1>Profile</h1>
                {!isEditing ? (
                    <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </button>
                ) : (
                    <div className="edit-actions">
                        <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSave}>
                            Save Changes
                        </button>
                    </div>
                )}
            </header>

            {/* User Info Card */}
            <div className="profile-card">
                <div className="user-avatar">
                    <span>{profile.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="user-info">
                    <h2>{profile.name}</h2>
                    <p className="member-since">
                        Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {/* Weight */}
                <div className="stat-card">
                    <span className="stat-icon">⚖️</span>
                    <div className="stat-content">
                        <span className="stat-label">Weight</span>
                        {isEditing ? (
                            <div className="stat-input">
                                <input
                                    type="number"
                                    className="input"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    step="0.1"
                                />
                                <span className="stat-unit">kg</span>
                            </div>
                        ) : (
                            <span className="stat-value">{profile.weight} kg</span>
                        )}
                    </div>
                </div>

                {/* Height */}
                <div className="stat-card">
                    <span className="stat-icon">📏</span>
                    <div className="stat-content">
                        <span className="stat-label">Height</span>
                        {isEditing ? (
                            <div className="stat-input">
                                <input
                                    type="number"
                                    className="input"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                />
                                <span className="stat-unit">cm</span>
                            </div>
                        ) : (
                            <span className="stat-value">{profile.height} cm</span>
                        )}
                    </div>
                </div>

                {/* BMI */}
                <div className="stat-card bmi-card">
                    <span className="stat-icon">📊</span>
                    <div className="stat-content">
                        <span className="stat-label">BMI</span>
                        <span className="stat-value" style={{ color: bmiCategory.color }}>
                            {bmi}
                        </span>
                        <span className="stat-category" style={{ color: bmiCategory.color }}>
                            {bmiCategory.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Body Measurements */}
            <div className="measurements-section">
                <h3>Body Measurements</h3>
                <p className="section-subtitle">Track your progress over time</p>

                <div className="measurements-grid">
                    {[
                        { key: 'biceps', label: 'Biceps', icon: '💪' },
                        { key: 'chest', label: 'Chest', icon: '🫁' },
                        { key: 'waist', label: 'Waist', icon: '⭕' },
                        { key: 'abs', label: 'Abs', icon: '🔥' },
                        { key: 'thighs', label: 'Thighs', icon: '🦵' },
                        { key: 'calves', label: 'Calves', icon: '🦶' },
                    ].map(({ key, label, icon }) => (
                        <div key={key} className="measurement-item">
                            <span className="measurement-icon">{icon}</span>
                            <span className="measurement-label">{label}</span>
                            {isEditing ? (
                                <div className="measurement-input">
                                    <input
                                        type="number"
                                        className="input input-sm"
                                        value={measurements[key as keyof BodyMeasurements] || ''}
                                        onChange={(e) => updateMeasurement(key as keyof BodyMeasurements, e.target.value)}
                                        placeholder="--"
                                        step="0.1"
                                    />
                                    <span className="measurement-unit">cm</span>
                                </div>
                            ) : (
                                <span className="measurement-value">
                                    {measurements[key as keyof BodyMeasurements]
                                        ? `${measurements[key as keyof BodyMeasurements]} cm`
                                        : '--'}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {measurements.updatedAt && (
                    <p className="last-updated">
                        Last updated: {new Date(measurements.updatedAt).toLocaleDateString()}
                    </p>
                )}
            </div>

            {/* Diet Targets */}
            <div className="targets-section">
                <h3>Daily Nutrition Targets</h3>
                <div className="targets-grid">
                    <div className="target-item">
                        <span className="target-label">Calories</span>
                        <span className="target-value">{state.dietTargets?.calories || 0} kcal</span>
                    </div>
                    <div className="target-item">
                        <span className="target-label">Protein</span>
                        <span className="target-value">{state.dietTargets?.protein || 0}g</span>
                    </div>
                    <div className="target-item">
                        <span className="target-label">Carbs</span>
                        <span className="target-value">{state.dietTargets?.carbs || 0}g</span>
                    </div>
                    <div className="target-item">
                        <span className="target-label">Fat</span>
                        <span className="target-value">{state.dietTargets?.fat || 0}g</span>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p>Once you reset, all data will be permanently deleted.</p>
                <button className="btn btn-danger" onClick={handleReset}>
                    Reset RexOS
                </button>
            </div>
        </div>
    );
}
