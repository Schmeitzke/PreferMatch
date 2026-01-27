import { useEffect, useState, type FormEvent, type ChangeEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Label, Alert } from '../components/UI';
import api from '../api';
import { LogOut, FolderOpen, User, Save, Lock } from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
    activeTab: 'projects' | 'account';
}

const AdminLayout = ({ children, activeTab }: AdminLayoutProps) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">PreferMatch</div>
                <nav className="sidebar-nav">
                    <div
                        className={`sidebar-item ${activeTab === 'projects' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/dashboard')}
                    >
                        <FolderOpen size={18} />
                        Projects
                    </div>
                    <div
                        className={`sidebar-item ${activeTab === 'account' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/account')}
                    >
                        <User size={18} />
                        Account
                    </div>
                </nav>
                <Button
                    variant="secondary"
                    onClick={handleLogout}
                    style={{ justifyContent: 'flex-start', marginTop: 'auto' }}
                >
                    <LogOut size={16} />
                    Logout
                </Button>
            </aside>
            <main className="dashboard-main">{children}</main>
        </div>
    );
};

interface ProfileData {
    name: string;
    sirname: string;
    department: string;
    email: string;
}

const AccountSettings = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData>({
        name: '',
        sirname: '',
        department: '',
        email: ''
    });
    const [profileMessage, setProfileMessage] = useState('');
    const [profileError, setProfileError] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);

    useEffect(() => {
        api.get('/api/admin/me')
            .then((res) => setProfile(res.data))
            .catch(() => navigate('/admin/login'));
    }, [navigate]);

    const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleProfileSave = async (e: FormEvent) => {
        e.preventDefault();
        setProfileMessage('');
        setProfileError('');
        setProfileSaving(true);

        try {
            await api.put('/api/admin/me', profile);
            setProfileMessage('Profile updated successfully.');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } } };
            setProfileError(error.response?.data?.detail || 'Failed to update profile.');
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault();
        setPasswordMessage('');
        setPasswordError('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters.');
            return;
        }

        setPasswordSaving(true);

        try {
            await api.put('/api/admin/me/password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            setPasswordMessage('Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } } };
            setPasswordError(error.response?.data?.detail || 'Failed to change password.');
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <AdminLayout activeTab="account">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Account Settings</h1>
                    <p className="page-subtitle">Manage your profile information and security settings.</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '640px' }}>
                <Card className="card-content">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={20} />
                        Profile Information
                    </h2>

                    {profileMessage && <Alert variant="success" className="form-group">{profileMessage}</Alert>}
                    {profileError && <Alert variant="error" className="form-group">{profileError}</Alert>}

                    <form onSubmit={handleProfileSave}>
                        <div className="form-row form-row-2 form-group">
                            <div>
                                <Label htmlFor="name">First Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="sirname">Last Name</Label>
                                <Input
                                    id="sirname"
                                    name="sirname"
                                    value={profile.sirname}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                name="department"
                                value={profile.department}
                                onChange={handleProfileChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={profile.email}
                                onChange={handleProfileChange}
                                required
                            />
                        </div>

                        <Button type="submit" disabled={profileSaving} style={{ marginTop: '0.5rem' }}>
                            <Save size={16} />
                            {profileSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </Card>

                <Card className="card-content">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lock size={20} />
                        Change Password
                    </h2>

                    {passwordMessage && <Alert variant="success" className="form-group">{passwordMessage}</Alert>}
                    {passwordError && <Alert variant="error" className="form-group">{passwordError}</Alert>}

                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimum 8 characters"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" disabled={passwordSaving} style={{ marginTop: '0.5rem' }}>
                            <Lock size={16} />
                            {passwordSaving ? 'Changing...' : 'Change Password'}
                        </Button>
                    </form>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default AccountSettings;
