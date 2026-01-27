import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Card, Label, Textarea } from '../components/UI';
import api from '../api';
import { Trash2, Plus, Share2 } from 'lucide-react';

interface Option {
    title: string;
    description: string;
    requirements: string;
    supervisors: string;
    capacity: string;
}

const ProjectEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [options, setOptions] = useState<Option[]>([
        { title: '', description: '', requirements: '', supervisors: '', capacity: '50' }
    ]);
    const [isFinalised, setIsFinalised] = useState(false);
    const [uniqueCode, setUniqueCode] = useState('');
    const [submissionCount, setSubmissionCount] = useState(0);

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [pendingFinalise, setPendingFinalise] = useState<boolean | null>(null);

    useEffect(() => {
        // Verify authentication immediately
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/admin/login');
            return;
        }

        if (id) {
            api.get(`/api/projects/${id}`).then((res) => {
                setTitle(res.data.title);
                setOptions(res.data.options.map((o: { title: string; description: string; requirements: string; supervisors: string; capacity: number }) => ({
                    ...o,
                    capacity: String(o.capacity)
                })));
                setIsFinalised(res.data.is_active);
                setUniqueCode(res.data.unique_code);
                setSubmissionCount(res.data.submission_count || 0);
            }).catch((err) => {
                if (err.response && err.response.status === 401) {
                    navigate('/admin/login');
                }
            });
        }
    }, [id, navigate]);

    const handleAddOption = () => {
        setOptions([
            ...options,
            { title: '', description: '', requirements: '', supervisors: '', capacity: '50' }
        ]);
    };

    const handleOptionChange = (idx: number, field: keyof Option, value: string) => {
        const newOpts = [...options];
        newOpts[idx] = { ...newOpts[idx], [field]: value };
        setOptions(newOpts);
    };

    const handleDeleteOption = (idx: number) => {
        setOptions(options.filter((_, i) => i !== idx));
    };

    const handleSave = async (finalise = false) => {
        if (!title) {
            alert('Title is required.');
            return;
        }

        const validOptions = options.filter((o) => o.title.trim() !== '');
        if (validOptions.length === 0) {
            alert('Add at least one option with a title.');
            return;
        }

        const payload = {
            title,
            options: validOptions.map(o => ({
                ...o,
                capacity: parseInt(o.capacity) || 50
            }))
        };

        try {
            let projectId = id;

            if (id) {
                await api.put(`/api/projects/${id}`, payload);
            } else {
                const res = await api.post('/api/projects/', payload);
                projectId = res.data.id;
            }

            if (finalise && projectId) {
                await api.put(`/api/projects/${projectId}/finalise`);
            }

            // Success - if we were pending a retry, clear it
            setPendingFinalise(null);
            setShowLoginModal(false);
            setLoginPassword('');

            navigate('/admin/dashboard');
        } catch (err: any) {
            console.error('Save error:', err);
            if (err.response && err.response.status === 401) {
                // Session expired - show modal
                setPendingFinalise(finalise);
                setShowLoginModal(true);
            } else {
                alert('Error saving project. Please try again.');
            }
        }
    };

    const handleRelogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');

        try {
            const formData = new FormData();
            formData.append('username', loginEmail);
            formData.append('password', loginPassword);
            const res = await api.post('/api/admin/login', formData);
            localStorage.setItem('token', res.data.access_token);

            // Retry the save
            if (pendingFinalise !== null) {
                handleSave(pendingFinalise);
            } else {
                setShowLoginModal(false);
            }
        } catch {
            setLoginError('Invalid email or password.');
        }
    };

    const handleShare = () => {
        const msg = `Please fill in your preferences for ${title}.\nCode: ${uniqueCode}\nLink: ${window.location.origin}/`;
        navigator.clipboard.writeText(msg);
        alert('Share message copied to clipboard!');
    };

    return (
        <div className="editor-wrapper">
            <div className="editor-header">
                <Button variant="secondary" onClick={() => navigate('/admin/dashboard')}>
                    Back
                </Button>
                <h1 className="editor-title">{id ? 'Edit Project' : 'New Project'}</h1>
                <div className="editor-actions">
                    {submissionCount > 0 && (
                        <span style={{ color: 'var(--destructive)', fontSize: '0.875rem', fontWeight: 500, marginRight: '1rem' }}>
                            Cannot edit: {submissionCount} submission(s)
                        </span>
                    )}
                    <Button variant="secondary" onClick={() => handleSave(false)} disabled={submissionCount > 0}>
                        Save Draft
                    </Button>
                    <Button onClick={() => handleSave(true)} disabled={submissionCount > 0}>Finalise</Button>
                    {isFinalised && (
                        <Button variant="secondary" size="icon" onClick={handleShare} title="Share">
                            <Share2 size={16} />
                        </Button>
                    )}
                </div>
            </div>

            <div className="editor-section">
                <Card className="card-content">
                    <Label htmlFor="projectTitle">Project Title</Label>
                    <Input
                        id="projectTitle"
                        value={title}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                        placeholder="e.g. Computer Science Group Project 2026"
                        style={{ fontSize: '1rem', fontWeight: 500 }}
                    />
                    <p className="form-hint">This title will be visible to all students.</p>
                </Card>
            </div>

            <div className="editor-section">
                <div className="editor-section-header">
                    <h3 className="editor-section-title">Project Options</h3>
                    <span className="editor-section-count">{options.length} option(s)</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {options.map((opt, i) => (
                        <Card key={i} className="card-content editor-option-card">
                            {options.length > 1 && (
                                <button
                                    className="editor-option-delete"
                                    onClick={() => handleDeleteOption(i)}
                                    title="Delete Option"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}

                            <div style={{ paddingRight: '2rem' }}>
                                <div className="form-group">
                                    <Label htmlFor={`opt-title-${i}`}>Option Title</Label>
                                    <Input
                                        id={`opt-title-${i}`}
                                        value={opt.title}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            handleOptionChange(i, 'title', e.target.value)
                                        }
                                        placeholder={`Option ${i + 1}`}
                                        style={{ fontWeight: 500 }}
                                    />
                                </div>

                                <div className="form-group">
                                    <Label htmlFor={`opt-desc-${i}`}>Description</Label>
                                    <Textarea
                                        id={`opt-desc-${i}`}
                                        value={opt.description}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                            handleOptionChange(i, 'description', e.target.value)
                                        }
                                        placeholder="Describe the project scope, goals, and expected outcomes..."
                                        style={{ minHeight: '120px' }}
                                    />
                                </div>

                                <div className="form-row form-row-2 form-group">
                                    <div>
                                        <Label htmlFor={`opt-req-${i}`} hint="Optional">
                                            Requirements
                                        </Label>
                                        <Input
                                            id={`opt-req-${i}`}
                                            value={opt.requirements}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                handleOptionChange(i, 'requirements', e.target.value)
                                            }
                                            placeholder="e.g. Python, Statistics"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`opt-sup-${i}`} hint="Optional">
                                            Supervisors
                                        </Label>
                                        <Input
                                            id={`opt-sup-${i}`}
                                            value={opt.supervisors}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                handleOptionChange(i, 'supervisors', e.target.value)
                                            }
                                            placeholder="e.g. Dr. Smith"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <Label htmlFor={`opt-cap-${i}`}>Max. Capacity</Label>
                                    <Input
                                        id={`opt-cap-${i}`}
                                        type="text"
                                        inputMode="numeric"
                                        value={opt.capacity}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            handleOptionChange(i, 'capacity', val);
                                        }}
                                        onBlur={() => {
                                            if (!opt.capacity) {
                                                handleOptionChange(i, 'capacity', '50');
                                            }
                                        }}
                                        placeholder="50"
                                        style={{ maxWidth: '10rem' }}
                                    />
                                    <p className="form-hint">Maximum students that can be assigned to this option.</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                <Button variant="outline" onClick={handleAddOption} className="editor-add-option">
                    <Plus size={16} />
                    Add Option
                </Button>
            </div>

            {showLoginModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <Card className="card-content" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <h3 className="auth-title" style={{ fontSize: '1.25rem' }}>Session Expired</h3>
                            <p className="auth-subtitle">Please sign in again to save your work.</p>
                        </div>

                        {loginError && (
                            <div className="alert alert-error form-group">{loginError}</div>
                        )}

                        <form onSubmit={handleRelogin}>
                            <div className="form-group">
                                <Label htmlFor="relogin-email">Email</Label>
                                <Input
                                    id="relogin-email"
                                    type="email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <Label htmlFor="relogin-password">Password</Label>
                                <Input
                                    id="relogin-password"
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <Button type="button" variant="secondary" onClick={() => setShowLoginModal(false)} style={{ flex: 1 }}>
                                    Cancel
                                </Button>
                                <Button type="submit" style={{ flex: 1 }}>
                                    Sign In & Save
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ProjectEditor;
