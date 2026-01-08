// RexOS Registration - Main Container

import { useNavigate } from 'react-router-dom';
import { useRex } from '../../store/RexContext';
import ProfileStep from './ProfileStep';
import HabitStep from './HabitStep';
import WorkoutStep from './WorkoutStep';
import DietStep from './DietStep';
import './Registration.css';

const STEPS = [
    { number: 1, name: 'Profile' },
    { number: 2, name: 'Habits' },
    { number: 3, name: 'Workout' },
    { number: 4, name: 'Diet' },
];

export default function Registration() {
    const { state, dispatch } = useRex();
    const navigate = useNavigate();
    const currentStep = state.currentStep;

    const goToStep = (step: number) => {
        dispatch({ type: 'SET_STEP', payload: step });
    };

    const handleComplete = () => {
        navigate('/dashboard');
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <ProfileStep onNext={() => goToStep(2)} />;
            case 2:
                return <HabitStep onNext={() => goToStep(3)} onBack={() => goToStep(1)} />;
            case 3:
                return <WorkoutStep onNext={() => goToStep(4)} onBack={() => goToStep(2)} />;
            case 4:
                return <DietStep onComplete={handleComplete} onBack={() => goToStep(3)} />;
            default:
                return <ProfileStep onNext={() => goToStep(2)} />;
        }
    };

    return (
        <div className="registration-container">
            {/* Header */}
            <header className="registration-header">
                <div className="registration-logo">
                    <span className="gradient-text">REX</span>OS
                </div>
                <p className="registration-tagline">Rule your mind. Run your life. Execute daily.</p>
            </header>

            {/* Progress */}
            <div className="registration-progress">
                {STEPS.map((step) => (
                    <div
                        key={step.number}
                        className={`progress-step ${currentStep === step.number ? 'active' : ''
                            } ${currentStep > step.number ? 'completed' : ''}`}
                    >
                        <span className="progress-step-number">
                            {currentStep > step.number ? '✓' : step.number}
                        </span>
                        <span className="progress-step-name">{step.name}</span>
                    </div>
                ))}
            </div>

            {/* Content */}
            <main className="registration-content">
                {renderStep()}
            </main>
        </div>
    );
}
