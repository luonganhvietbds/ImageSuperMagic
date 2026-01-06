import { useState, useEffect } from 'react';
import {
    Key,
    Check,
    X,
    Eye,
    EyeOff,
    Loader2,
    AlertCircle,
    Trash2,
    Save
} from 'lucide-react';
import { useAppStore } from '../../state';
import { initializeGemini, isInitialized } from '../../services/ai.service';

export default function Settings() {
    const { apiKey, apiKeyValid, setApiKey, clearApiKey } = useAppStore();
    const [inputKey, setInputKey] = useState(apiKey || '');
    const [showKey, setShowKey] = useState(false);
    const [validating, setValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (apiKey) {
            setInputKey(apiKey);
        }
    }, [apiKey]);

    const handleValidateAndSave = async () => {
        if (!inputKey.trim()) {
            setError('Please enter an API key');
            return;
        }

        setValidating(true);
        setError(null);

        try {
            const isValid = await initializeGemini(inputKey.trim());

            if (isValid) {
                setApiKey(inputKey.trim(), true);
                setError(null);
            } else {
                setError('Invalid API key. Please check and try again.');
            }
        } catch (err) {
            setError('Failed to validate API key. Please try again.');
        } finally {
            setValidating(false);
        }
    };

    const handleClear = () => {
        setInputKey('');
        clearApiKey();
        setError(null);
    };

    return (
        <div className="settings-page fade-in">
            <div className="card" style={{ maxWidth: 600 }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <Key size={20} />
                        Gemini API Key
                    </h3>
                    {apiKeyValid && (
                        <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={14} /> Connected
                        </span>
                    )}
                </div>
                <div className="card-body">
                    {/* Info Box */}
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--spacing-md)',
                        marginBottom: 'var(--spacing-lg)',
                        fontSize: '14px'
                    }}>
                        <strong>BYOK Model:</strong> This app uses your own Gemini API key. Your key is stored locally in your browser and never sent to any server except Google's Gemini API.
                    </div>

                    {/* API Key Input */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 500,
                            marginBottom: 'var(--spacing-sm)',
                            color: 'var(--color-text-secondary)'
                        }}>
                            API Key
                        </label>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    className="input"
                                    value={inputKey}
                                    onChange={(e) => setInputKey(e.target.value)}
                                    placeholder="AIza..."
                                    style={{ paddingRight: 40 }}
                                />
                                <button
                                    className="btn btn-ghost btn-icon"
                                    style={{
                                        position: 'absolute',
                                        right: 4,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        padding: 6
                                    }}
                                    onClick={() => setShowKey(!showKey)}
                                    title={showKey ? 'Hide' : 'Show'}
                                >
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            color: 'var(--color-error)',
                            fontSize: '14px'
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleValidateAndSave}
                            disabled={validating || !inputKey.trim()}
                            style={{ flex: 1 }}
                        >
                            {validating ? (
                                <>
                                    <Loader2 size={16} className="spin" /> Validating...
                                </>
                            ) : (
                                <>
                                    <Save size={16} /> Save & Validate
                                </>
                            )}
                        </button>
                        {apiKey && (
                            <button className="btn btn-secondary" onClick={handleClear}>
                                <Trash2 size={16} /> Clear
                            </button>
                        )}
                    </div>

                    {/* Instructions */}
                    <div style={{ marginTop: 'var(--spacing-xl)', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>How to get an API key:</div>
                        <ol style={{ paddingLeft: 'var(--spacing-lg)', lineHeight: 1.8 }}>
                            <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-primary)' }}>Google AI Studio</a></li>
                            <li>Sign in with your Google account</li>
                            <li>Click "Create API Key"</li>
                            <li>Copy the key and paste it above</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Theme Settings */}
            <div className="card" style={{ maxWidth: 600, marginTop: 'var(--spacing-lg)' }}>
                <div className="card-header">
                    <h3 className="card-title">Preferences</h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 500 }}>Dark Theme</div>
                            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                Currently using dark theme (default)
                            </div>
                        </div>
                        <span className="badge badge-info">Active</span>
                    </div>
                </div>
            </div>

            {/* Storage Info */}
            <div className="card" style={{ maxWidth: 600, marginTop: 'var(--spacing-lg)' }}>
                <div className="card-header">
                    <h3 className="card-title">Storage</h3>
                </div>
                <div className="card-body">
                    <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            All data is stored locally in your browser using IndexedDB.
                        </div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                            • Jobs, batches, and assets are persisted across sessions
                            <br />
                            • Clearing browser data will remove all stored data
                            <br />
                            • No data is sent to external servers (except Gemini API calls)
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
        </div>
    );
}
