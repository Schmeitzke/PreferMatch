import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Label } from '../components/UI';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);
            navigate('/admin/dashboard');
        } catch {
            setError('Invalid email or password. Please try again.');
        }
    };

    return (
        <div className="auth-wrapper">
            <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                <Button variant="secondary" onClick={() => navigate('/')}>
                    Back to Home
                </Button>
            </div>

            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Admin Portal</h1>
                    <p className="auth-subtitle">
                        Sign in to manage projects and students.
                    </p>
                </div>

                <Card className="card-content">
                    {error && (
                        <div className="alert alert-error form-group">{error}</div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your.email@maastrichtuniversity.nl"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" size="lg" style={{ width: '100%', marginTop: '0.5rem' }}>
                            Sign In
                        </Button>
                    </form>

                    <div className="auth-footer">
                        <span>Don't have an account? </span>
                        <span className="auth-link" onClick={() => navigate('/admin/register')}>
                            Create one
                        </span>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminLogin;
