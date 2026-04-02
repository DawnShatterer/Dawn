import React, { useState } from 'react';
import { Card, Button, Form, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, Plus, Send } from 'lucide-react';
import { getCourseAnnouncements, createAnnouncement } from '../api/announcementService';

const CourseAnnouncements = ({ courseId, isOwner, userRole }) => {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const { data: announcements, isLoading } = useQuery({
        queryKey: ['announcements', courseId],
        queryFn: () => getCourseAnnouncements(courseId),
        refetchInterval: 30000 // refresh every 30s
    });

    const createMutation = useMutation({
        mutationFn: (data) => createAnnouncement(courseId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['announcements', courseId]);
            setShowForm(false);
            setTitle('');
            setContent('');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;
        createMutation.mutate({ title, content });
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const canPost = isOwner || userRole === 'admin';

    return (
        <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold m-0" style={{ color: '#6f42c1' }}>Announcements</h4>
                {canPost && (
                    <Button 
                        size="sm" 
                        style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }} 
                        onClick={() => setShowForm(!showForm)}
                    >
                        <Plus size={16} className="me-1" /> {showForm ? 'Cancel' : 'Post Update'}
                    </Button>
                )}
            </div>

            {canPost && showForm && (
                <Card className="border-0 shadow-sm mb-4 bg-body-tertiary shadow border-start border-4" style={{ borderColor: '#6f42c1' }}>
                    <Card.Body className="p-4">
                        <h5 className="fw-bold mb-3" style={{ color: '#6f42c1' }}>New Announcement</h5>
                        <p className="text-muted small">Posting this will immediately notify all enrolled students.</p>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-medium text-body">Title</Form.Label>
                                <Form.Control 
                                    required 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    placeholder="e.g., Midterm Exam Moved to Friday"
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-medium text-body">Message / Detailed Update</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={4} 
                                    required 
                                    value={content} 
                                    onChange={(e) => setContent(e.target.value)} 
                                    placeholder="Write your announcement here..."
                                />
                            </Form.Group>
                            <div className="d-flex justify-content-end">
                                <Button 
                                    variant="primary" 
                                    type="submit" 
                                    disabled={createMutation.isPending}
                                    style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
                                    className="px-4 fw-bold"
                                >
                                    {createMutation.isPending ? 'Posting...' : <><Send size={16} className="me-2"/> Publish & Notify</>}
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            {isLoading && <div className="text-center py-5"><Spinner animation="border" style={{ color: '#6f42c1' }} /></div>}
            
            {!isLoading && announcements?.length === 0 && (
                <div className="text-center py-5 text-muted">
                    <BellRing size={48} className="mb-3 opacity-25" />
                    <p className="fw-medium">No announcements yet.</p>
                    {canPost && <small>Keep your students updated by posting an announcement.</small>}
                </div>
            )}

            {!isLoading && announcements?.map(a => (
                <Card key={a.id} className="border-0 shadow-sm mb-3">
                    <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <h5 className="fw-bold text-body m-0">{a.title}</h5>
                            <small className="text-muted fw-medium">{formatDate(a.createdAt)}</small>
                        </div>
                        <p className="text-muted mb-3" style={{ whiteSpace: 'pre-wrap' }}>{a.content}</p>
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle d-flex align-items-center justify-content-center text-white me-2" style={{ backgroundColor: '#6f42c1', width: '30px', height: '30px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {a.authorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="small fw-bold text-body">{a.authorName} <Badge bg="light" text="dark" className="ms-1 fw-normal border">{a.authorRole}</Badge></span>
                        </div>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
};

export default CourseAnnouncements;
