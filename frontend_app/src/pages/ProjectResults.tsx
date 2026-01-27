import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Badge } from '../components/UI';
import api from '../api';
import { Download, BarChart3 } from 'lucide-react';

interface ProjectResult {
    student_number: string;
    assigned_option_title: string;
    assigned_option_id: number;
}

const ProjectResults = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [results, setResults] = useState<ProjectResult[]>([]);
    const [loading, setLoading] = useState(false);

    const handleCalculate = async () => {
        setLoading(true);
        try {
            await api.post(`/api/projects/${id}/calculate`);
            const res = await api.get(`/api/projects/${id}/results`);
            setResults(res.data);
        } catch {
            alert('Failed to calculate results.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            setLoading(true);
            api.post(`/api/projects/${id}/calculate`)
                .then(() => api.get(`/api/projects/${id}/results`))
                .then((res) => setResults(res.data))
                .catch(() => alert('Failed to calculate results.'))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleDownload = () => {
        const dataStr =
            'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', `results_${id}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="results-wrapper">
            <div className="results-header">
                <Button variant="secondary" onClick={() => navigate('/admin/dashboard')}>
                    Back
                </Button>
                <div className="results-title-group">
                    <h1 className="results-title">Project Results</h1>
                    {results.length > 0 && <Badge variant="success">Calculated</Badge>}
                </div>
                {results.length > 0 ? (
                    <Button onClick={handleDownload}>
                        <Download size={16} />
                        Download JSON
                    </Button>
                ) : (
                    <Button onClick={handleCalculate} disabled={loading}>
                        {loading ? 'Calculating...' : 'Recalculate Results'}
                    </Button>
                )}
            </div>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
                {results.length === 0 ? (
                    <div className="empty-state">
                        <BarChart3 className="empty-state-icon" />
                        <p className="empty-state-title">No results calculated yet</p>
                        <p className="empty-state-text">
                            Run the optimization algorithm to assign students to projects.
                        </p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Assigned Option</th>
                                    <th>Option ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={i}>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                                            {r.student_number}
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{r.assigned_option_title}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                            {r.assigned_option_id}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ProjectResults;
