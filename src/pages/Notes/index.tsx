// RexOS Notes / Journaling

import { useState, useEffect, useCallback } from 'react';
import { useRex } from '../../store/RexContext';
import { formatDate, getDayName } from '../../utils/storage';
import './Notes.css';

export default function Notes() {
    const { state, dispatch } = useRex();
    const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const dayName = getDayName(new Date(selectedDate));
    const isToday = selectedDate === formatDate(new Date());

    // Load existing note for selected date
    useEffect(() => {
        const existingNote = state.notes.find(n => n.date === selectedDate);
        setContent(existingNote?.content || '');
        setLastSaved(existingNote ? new Date(existingNote.updatedAt) : null);
    }, [selectedDate, state.notes]);

    // Auto-save with debounce
    const saveNote = useCallback((noteContent: string) => {
        if (!noteContent.trim() && !state.notes.find(n => n.date === selectedDate)) {
            // Don't save empty notes for new days
            return;
        }

        setIsSaving(true);
        dispatch({
            type: 'LOG_NOTE',
            payload: {
                date: selectedDate,
                content: noteContent,
                updatedAt: new Date().toISOString(),
            },
        });

        setTimeout(() => {
            setIsSaving(false);
            setLastSaved(new Date());
        }, 300);
    }, [dispatch, selectedDate, state.notes]);

    // Debounced save on content change
    useEffect(() => {
        const timer = setTimeout(() => {
            saveNote(content);
        }, 1000);

        return () => clearTimeout(timer);
    }, [content, saveNote]);

    const navigateDays = (offset: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + offset);
        setSelectedDate(formatDate(date));
    };

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const characterCount = content.length;

    // Get notes count for stats
    const totalNotesCount = state.notes.filter(n => n.content.trim()).length;

    return (
        <div className="notes-page animate-fadeIn">
            <header className="tracker-header">
                <div>
                    <h1>📝 Notes</h1>
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
                </div>
            </header>

            {/* Stats Card */}
            <div className="notes-stats">
                <div className="stat-item">
                    <span className="stat-value">{totalNotesCount}</span>
                    <span className="stat-label">Total Entries</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{wordCount}</span>
                    <span className="stat-label">Words Today</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{characterCount}</span>
                    <span className="stat-label">Characters</span>
                </div>
            </div>

            {/* Note Editor */}
            <div className="note-editor-container">
                <div className="editor-header">
                    <h2>Daily Reflection</h2>
                    <div className="save-status">
                        {isSaving ? (
                            <span className="saving">Saving...</span>
                        ) : lastSaved ? (
                            <span className="saved">
                                ✓ Saved at {lastSaved.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        ) : null}
                    </div>
                </div>

                <textarea
                    className="note-textarea"
                    placeholder="What's on your mind today? Record your thoughts, reflections, learnings, and observations..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onBlur={() => saveNote(content)}
                />

                <div className="editor-footer">
                    <div className="prompts">
                        <span className="prompts-label">Writing prompts:</span>
                        <div className="prompts-list">
                            <button
                                className="prompt-chip"
                                onClick={() => setContent(c => c + (c ? '\n\n' : '') + '🎯 Today I accomplished: ')}
                            >
                                Accomplishments
                            </button>
                            <button
                                className="prompt-chip"
                                onClick={() => setContent(c => c + (c ? '\n\n' : '') + '💡 Key insight: ')}
                            >
                                Insights
                            </button>
                            <button
                                className="prompt-chip"
                                onClick={() => setContent(c => c + (c ? '\n\n' : '') + '🔄 Tomorrow I will: ')}
                            >
                                Tomorrow
                            </button>
                            <button
                                className="prompt-chip"
                                onClick={() => setContent(c => c + (c ? '\n\n' : '') + '🙏 Grateful for: ')}
                            >
                                Gratitude
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Notes Preview */}
            <div className="recent-notes">
                <h3>Recent Entries</h3>
                <div className="notes-list">
                    {state.notes
                        .filter(n => n.content.trim() && n.date !== selectedDate)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5)
                        .map(note => (
                            <div
                                key={note.date}
                                className="note-preview"
                                onClick={() => setSelectedDate(note.date)}
                            >
                                <div className="preview-header">
                                    <span className="preview-date">
                                        {getDayName(new Date(note.date))}, {new Date(note.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    <span className="preview-words">
                                        {note.content.trim().split(/\s+/).length} words
                                    </span>
                                </div>
                                <p className="preview-content">
                                    {note.content.slice(0, 150)}{note.content.length > 150 ? '...' : ''}
                                </p>
                            </div>
                        ))}

                    {state.notes.filter(n => n.content.trim() && n.date !== selectedDate).length === 0 && (
                        <div className="no-notes">
                            <p>No previous entries yet. Start writing to build your journal!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
