import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge } from '../components/UI';
import api from '../api';
import { LogOut, Plus, Edit, StopCircle, Clipboard, Check, FolderOpen, Trash2, HelpCircle, User, Share2 } from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
    activeTab?: 'projects' | 'account';
}

const AdminLayout = ({ children, activeTab = 'projects' }: AdminLayoutProps) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.post('/api/admin/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        }
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

interface Project {
    id: number;
    title: string;
    unique_code: string;
    is_active: boolean;
    is_closed: boolean;
    archived: boolean;
    submission_count: number;
    total_capacity: number;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        api.get('/api/projects/')
            .then((res) => setProjects(res.data))
            .catch(() => navigate('/admin/login'));
    }, [navigate]);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleShare = (project: Project) => {
        const msg = `Please fill in your preferences for ${project.title}.\nCode: ${project.unique_code}\nLink: ${window.location.origin}/`;
        navigator.clipboard.writeText(msg);
        alert('Share message copied to clipboard!');
    };


    const handleCloseForm = async (projectId: number) => {
        if (!confirm('Are you sure you want to close this form? Students will no longer be able to submit.')) return;
        await api.put(`/api/projects/${projectId}/close`);
        location.reload();
    };

    const handleDelete = async (projectId: number) => {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone and all student submissions will be lost.')) return;
        await api.delete(`/api/projects/${projectId}`);
        setProjects(projects.filter(p => p.id !== projectId));
    };

    const getStatusBadge = (project: Project) => {
        if (project.is_closed) {
            return <Badge variant="error">Closed</Badge>;
        }
        if (project.is_active) {
            return <Badge variant="success">Live</Badge>;
        }
        return <Badge variant="warning">Draft</Badge>;
    };

    return (
        <AdminLayout activeTab="projects">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Your Projects</h1>
                    <p className="page-subtitle">Manage and track all your group assignment forms.</p>
                </div>
                <Button onClick={() => navigate('/admin/project/new')}>
                    <Plus size={16} />
                    New Project
                </Button>
            </div>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
                {projects.length === 0 ? (
                    <div className="empty-state">
                        <FolderOpen className="empty-state-icon" />
                        <p className="empty-state-title">No projects yet</p>
                        <p className="empty-state-text">Create your first project to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                                            Code
                                            <span
                                                title="This is the project code students need to enter to access the preference form"
                                                style={{ cursor: 'help', color: 'var(--muted-foreground)' }}
                                            >
                                                <HelpCircle size={14} />
                                            </span>
                                        </span>
                                    </th>
                                    <th>Submissions</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((p) => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 500 }}>{p.title}</td>
                                        <td>
                                            <span
                                                className="code-badge"
                                                onClick={() => handleCopy(p.unique_code)}
                                                title="Click to copy"
                                            >
                                                {p.unique_code}
                                                {copiedCode === p.unique_code ? (
                                                    <Check size={12} style={{ color: 'var(--success)' }} />
                                                ) : (
                                                    <Clipboard size={12} />
                                                )}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                                                {p.submission_count} / {p.total_capacity}
                                            </span>
                                        </td>
                                        <td>{getStatusBadge(p)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {!p.is_closed && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (p.submission_count > 0) return;
                                                            navigate(`/admin/project/edit/${p.id}`);
                                                        }}
                                                        title={p.submission_count > 0 ? "Cannot edit: Submissions exist" : "Edit"}
                                                        style={p.submission_count > 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                                    >
                                                        <Edit size={14} />
                                                    </Button>
                                                )}
                                                {p.is_active && !p.is_closed && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleShare(p)}
                                                        title="Share"
                                                    >
                                                        <Share2 size={14} />
                                                    </Button>
                                                )}
                                                {p.is_active && !p.is_closed && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleCloseForm(p.id)}
                                                        title="Close Form"
                                                    >
                                                        <StopCircle size={14} />
                                                    </Button>
                                                )}
                                                {p.is_closed && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => navigate(`/admin/project/results/${p.id}`)}
                                                    >
                                                        Results
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(p.id)}
                                                    title="Delete Project"
                                                    style={{ color: 'var(--muted-foreground)' }}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </AdminLayout>
    );
};

export default AdminDashboard;
