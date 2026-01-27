import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../components/UI';
import api from '../api';
import { GripVertical } from 'lucide-react';

interface Option {
    id: number;
    title: string;
    description: string;
    requirements?: string;
    supervisors?: string;
}

interface SortableItemProps {
    id: number;
    title: string;
    index: number;
    onClick: () => void;
}

const SortableItem = ({ id, title, index, onClick }: SortableItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`preference-item ${isDragging ? 'dragging' : ''}`}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                <span className="preference-item-rank">{index + 1}</span>
                <span className="preference-item-title">{title}</span>
            </div>
            <GripVertical size={14} className="preference-item-handle" />
        </div>
    );
};

const StudentPreference = () => {
    const navigate = useNavigate();
    const [options, setOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectTitle, setProjectTitle] = useState('');

    useEffect(() => {
        const code = localStorage.getItem('student_project');
        const sid = localStorage.getItem('student_id');
        if (!code || !sid) {
            navigate('/');
            return;
        }

        api.get(`/api/students/options/${code}`)
            .then((res) => {
                setProjectTitle(res.data.title);
                setOptions(res.data.options);
                setLoading(false);
            })
            .catch(() => navigate('/'));
    }, [navigate]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setOptions((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const scrollToOption = (id: number) => {
        const el = document.getElementById(`option-${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = () => {
        navigate('/student/confirm', { state: { options } });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                Loading...
            </div>
        );
    }

    return (
        <div className="preference-layout">
            <header className="preference-header">
                <div className="preference-header-brand">
                    <div className="preference-header-logo">G</div>
                    <span className="preference-header-title">{projectTitle}</span>
                    <span className="preference-header-separator">|</span>
                    <span className="preference-header-subtitle">Rank Your Preferences</span>
                </div>
                <Button onClick={handleSubmit}>Submit Preferences</Button>
            </header>

            <div className="preference-body">
                <aside className="preference-sidebar">
                    <div className="preference-sidebar-label">Highest Preference</div>
                    <div className="preference-sidebar-list">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={options.map((o) => o.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {options.map((opt, i) => (
                                    <SortableItem
                                        key={opt.id}
                                        id={opt.id}
                                        title={opt.title}
                                        index={i}
                                        onClick={() => scrollToOption(opt.id)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                    <div className="preference-sidebar-label">Lowest Preference</div>
                </aside>

                <main className="preference-main">
                    <div className="preference-content">
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            Project Options
                        </h1>
                        <p style={{ color: 'var(--muted-foreground)', marginBottom: '2.5rem', fontSize: '1.0625rem' }}>
                            Review each option carefully. Drag and drop the items on the left to rank your preferences.
                        </p>

                        {options.map((opt) => (
                            <div key={opt.id} id={`option-${opt.id}`} className="preference-option">
                                <h3 className="preference-option-title">{opt.title}</h3>

                                {opt.supervisors && (
                                    <div className="preference-option-meta">
                                        Supervisors: {opt.supervisors}
                                    </div>
                                )}

                                <div className="preference-option-section">
                                    <div className="preference-option-label">Description</div>
                                    <p className="preference-option-text">{opt.description}</p>
                                </div>

                                {opt.requirements && (
                                    <div className="preference-option-box">
                                        <div className="preference-option-label">Requirements</div>
                                        <p className="preference-option-text" style={{ fontSize: '0.875rem' }}>
                                            {opt.requirements}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentPreference;
