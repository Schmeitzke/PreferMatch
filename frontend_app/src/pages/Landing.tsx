import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Alert, Label } from '../components/UI';
import api from '../api';

const Landing = () => {
    const [projectCode, setProjectCode] = useState('');
    const [studentId, setStudentId] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleStudentIdChange = (e: ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (!val.startsWith('i')) {
            val = val === '' ? 'i' : 'i' + val.replace(/\D/g, '');
        } else {
            val = 'i' + val.substring(1).replace(/\D/g, '');
        }
        setStudentId(val);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (!projectCode || studentId.length < 2) return;

        try {
            await api.get(`/api/students/validate/${projectCode}/${studentId}`);
            localStorage.setItem('student_project', projectCode);
            localStorage.setItem('student_id', studentId);
            navigate('/student/preference');
        } catch (err: unknown) {
            const error = err as { response?: { status?: number; data?: { detail?: string } } };
            if (error.response?.status === 409) {
                setError('This student ID has already submitted preferences for this project.');
            } else if (error.response?.status === 400) {
                setError(error.response.data?.detail || 'Project is not active or has been closed.');
            } else {
                setError('Invalid project code. Please check and try again.');
            }
        }
    };

    return (
        <div className="auth-wrapper">
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <Button variant="secondary" onClick={() => navigate('/admin/login')}>
                    Admin Login
                </Button>
            </div>

            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">PreferMatch</h1>
                    <p className="auth-subtitle">
                        Enter your project code and student ID to continue.
                    </p>
                </div>

                <Card className="card-content">
                    {error && <Alert variant="error" className="form-group">{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <Label htmlFor="projectCode">Project Code</Label>
                            <Input
                                id="projectCode"
                                value={projectCode}
                                onChange={(e) => setProjectCode(e.target.value)}
                                placeholder="e.g. PRJ-2026"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <Label htmlFor="studentId">Student ID</Label>
                            <Input
                                id="studentId"
                                value={studentId}
                                onChange={handleStudentIdChange}
                                placeholder="i123456"
                                onFocus={() => !studentId && setStudentId('i')}
                            />
                        </div>

                        <Button type="submit" size="lg" style={{ width: '100%', marginTop: '0.5rem' }}>
                            Enter Project
                        </Button>
                    </form>
                </Card>

                <p className="copyright">
                    &copy; 2026{' '}
                    <a
                        href="https://schmeitzdegroenailabs.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Schmeitz De Groen AI Labs
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Landing;
