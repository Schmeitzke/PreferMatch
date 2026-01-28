import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Badge } from '../components/UI';
import api from '../api';
import { ArrowLeft, Trash2, Edit, Save, X } from 'lucide-react';

interface Preference {
    option_id: number;
    rank: number;
}

interface Student {
    id: number;
    student_number: string;
    preferences: Preference[];
}

interface Project {
    id: number;
    title: string;
    options: { id: number; title: string; capacity: number }[];
}

const ProjectSubmissions = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [project, setProject] = useState<Project | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ student_number: string; preferences: Preference[] } | null>(null);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = () => {
        api.get(`/api/projects/${id}`)
            .then(res => setProject(res.data))
            .catch(err => console.error(err));

        api.get(`/api/projects/${id}/students`)
            .then(res => setStudents(res.data))
            .catch(err => console.error(err));
    };

    const handleDelete = async (studentId: number) => {
        if (!confirm('Are you sure you want to delete this submission?')) return;
        try {
            await api.delete(`/api/projects/${id}/students/${studentId}`);
            setStudents(students.filter(s => s.id !== studentId));
        } catch (error) {
            alert('Failed to delete student.');
        }
    };

    const startEdit = (student: Student) => {
        setEditingId(student.id);
        const sortedPrefs = [...student.preferences].sort((a, b) => a.rank - b.rank);
        setEditForm({
            student_number: student.student_number,
            preferences: sortedPrefs
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(null);
    };

    const handleSave = async () => {
        if (!editForm || !editingId) return;
        try {
            await api.put(`/api/projects/${id}/students/${editingId}`, editForm);
            setEditingId(null);
            setEditForm(null);
            fetchData();
        } catch (error) {
            alert('Failed to update student.');
        }
    };

    const updatePreference = (index: number, optionId: string) => {
        if (!editForm || !project) return;
        const newPrefs = [...editForm.preferences];
        let oid = parseInt(optionId);
        if (isNaN(oid)) oid = 0;

        // Cap the value
        const maxOptions = project.options.length;
        if (oid > maxOptions) oid = maxOptions;
        if (oid < 1) oid = 1;

        newPrefs[index] = { ...newPrefs[index], option_id: oid };
        setEditForm({ ...editForm, preferences: newPrefs });
    };



    return (
        <div className="dashboard-layout" style={{ display: 'block', padding: '2rem' }}>
            <div className="page-header">
                <div>
                    <Button variant="secondary" onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: '1rem' }}>
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Button>
                    <h1 className="page-title">
                        Submissions for {project?.title}
                    </h1>
                    <p className="page-subtitle">View and manage student preferences.</p>
                </div>
            </div>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Preferences (Rank: Option ID)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id}>
                                    <td>
                                        {editingId === student.id ? (
                                            <input
                                                className="input"
                                                value={editForm?.student_number}
                                                onChange={e => setEditForm(prev => prev ? { ...prev, student_number: e.target.value } : null)}
                                            />
                                        ) : (
                                            <span style={{ fontFamily: 'var(--font-mono)' }}>{student.student_number}</span>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === student.id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {editForm?.preferences.map((pref, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ width: '2rem', fontSize: '0.875rem' }}>#{pref.rank}</span>
                                                        <input
                                                            className="input"
                                                            type="number"
                                                            min={1}
                                                            max={project?.options.length || 999}
                                                            value={pref.option_id}
                                                            onChange={e => updatePreference(idx, e.target.value)}
                                                            style={{ width: '80px' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {student.preferences.sort((a, b) => a.rank - b.rank).map(p => (
                                                    <Badge key={p.option_id} variant="secondary">
                                                        #{p.rank}: {p.option_id}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === student.id ? (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Button size="sm" onClick={handleSave} variant="success" title="Save Changes">
                                                    <Save size={14} />
                                                </Button>
                                                <Button size="sm" variant="secondary" onClick={cancelEdit} title="Cancel Editing">
                                                    <X size={14} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Button variant="secondary" size="sm" onClick={() => startEdit(student)}>
                                                    <Edit size={14} />
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(student.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ProjectSubmissions;
