import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/UI';
import api from '../api';

interface Option {
    id: number;
    title: string;
}

const StudentConfirm = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const options: Option[] = state?.options || [];
    const code = localStorage.getItem('student_project');
    const sid = localStorage.getItem('student_id');

    const handleConfirm = async () => {
        try {
            await api.post('/api/students/submit', {
                project_code: code,
                student_id: sid,
                preferences: options.map((o, i) => ({ option_id: o.id, rank: i + 1 }))
            });
            alert('Preferences submitted successfully!');
            navigate('/');
        } catch {
            alert('Failed to submit. Please check your connection or if the project is closed.');
        }
    };

    if (options.length === 0) {
        navigate('/');
        return null;
    }

    return (
        <div className="confirm-wrapper">
            <div className="confirm-header">
                <h1 className="confirm-title">Confirm Your Preferences</h1>
                <p className="confirm-subtitle">
                    Please review your ranked list. #1 is your most desired choice.
                </p>
            </div>

            <Card className="confirm-list" style={{ padding: 0 }}>
                {options.map((opt, i) => (
                    <div key={opt.id} className="confirm-item">
                        <div className="confirm-item-rank">{i + 1}</div>
                        <span className="confirm-item-title">{opt.title}</span>
                    </div>
                ))}
            </Card>

            <div className="confirm-actions">
                <Button variant="secondary" size="lg" onClick={() => window.history.back()}>
                    Go Back
                </Button>
                <Button size="lg" onClick={handleConfirm}>
                    Confirm & Submit
                </Button>
            </div>
        </div>
    );
};

export default StudentConfirm;
