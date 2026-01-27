import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Label, Alert } from '../components/UI';
import api from '../api';

interface FormData {
    name: string;
    sirname: string;
    department: string;
    email: string;
    register_code: string;
    password: string;
    retry_password: string;
}

const AdminRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        name: '',
        sirname: '',
        department: '',
        email: '',
        register_code: '',
        password: '',
        retry_password: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.retry_password) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        try {
            await api.post('/api/admin/register', formData);
            navigate('/admin/login');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } } };
            setError(error.response?.data?.detail || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="auth-wrapper" style={{ padding: '3rem 1rem' }}>
            <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                <Button variant="secondary" onClick={() => navigate('/admin/login')}>
                    Back to Login
                </Button>
            </div>

            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Create Admin Account</h1>
                    <p className="auth-subtitle">
                        Register to start managing group assignments.
                    </p>
                </div>

                <Card className="card-content">
                    {error && <Alert variant="error" className="form-group">{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-row form-row-2 form-group">
                            <div>
                                <Label htmlFor="name">First Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="John"
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="sirname">Last Name</Label>
                                <Input
                                    id="sirname"
                                    name="sirname"
                                    placeholder="Doe"
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <Label htmlFor="department">Department / Faculty</Label>
                            <Input
                                id="department"
                                name="department"
                                placeholder="Computer Science"
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <Label htmlFor="email">University Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="john.doe@maastrichtuniversity.nl"
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-divider" />

                        <div className="form-group">
                            <Label htmlFor="register_code">Registration Code</Label>
                            <Input
                                id="register_code"
                                name="register_code"
                                placeholder="Enter registration code"
                                onChange={handleChange}
                                required
                                style={{ borderStyle: 'dashed' }}
                            />
                            <p className="form-hint">Code provided by system administrator.</p>
                        </div>

                        <div className="form-group">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Minimum 8 characters"
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <Label htmlFor="retry_password">Confirm Password</Label>
                            <Input
                                id="retry_password"
                                name="retry_password"
                                type="password"
                                placeholder="Re-enter your password"
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Button type="submit" size="lg" style={{ width: '100%', marginTop: '0.5rem' }}>
                            Create Account
                        </Button>
                    </form>

                    <div className="auth-footer">
                        <span>Already have an account? </span>
                        <span className="auth-link" onClick={() => navigate('/admin/login')}>
                            Sign in
                        </span>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminRegister;
