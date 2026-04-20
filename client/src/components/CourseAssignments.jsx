import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Spinner, Card, Modal, Badge, Row, Col } from 'react-bootstrap';
import { getCourseAssignments, createAssignment, deleteAssignment, submitAssignmentFile } from '../api/assignmentService';
import 'bootstrap-icons/font/bootstrap-icons.css';
import GradeSubmissionsModal from './GradeSubmissionsModal';
import { getFileUrl } from '../utils/fileUtils';

const CourseAssignments = ({ courseId, canViewContent, userRole }) => {
    const queryClient = useQueryClient();
    const isInstructor = userRole === 'teacher' || userRole === 'admin';

    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [dueDate, setDueDate] = useState('');

    const [uploadingFor, setUploadingFor] = useState(null); // Assignment id being uploaded to
    const [uploadFile, setUploadFile] = useState(null);
    const fileRef = useRef(null);

    const [gradingAssignmentId, setGradingAssignmentId] = useState(null);

    const { data: assignments, isLoading } = useQuery({
        queryKey: ['assignments', courseId],
        queryFn: () => getCourseAssignments(courseId),
        enabled: !!courseId && canViewContent
    });

    const createMutation = useMutation({
        mutationFn: createAssignment,
        onSuccess: () => {
            queryClient.invalidateQueries(['assignments', courseId]);
            setShowCreate(false);
            setTitle(''); setContent(''); setDueDate('');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAssignment,
        onSuccess: () => queryClient.invalidateQueries(['assignments', courseId])
    });

    const uploadMutation = useMutation({
        mutationFn: submitAssignmentFile,
        onSuccess: () => {
            queryClient.invalidateQueries(['assignments', courseId]);
            setUploadingFor(null);
            setUploadFile(null);
        }
    });

    if (!canViewContent) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                <i className="bi bi-file-text" style={{ fontSize: '48px', marginBottom: '1rem' }}></i>
                <h5>Content Locked</h5>
                <p>Enroll in this course to view and submit assignments.</p>
            </div>
        );
    }

    if (isLoading) {
        return <div className="text-center p-4"><Spinner animation="border" variant="primary" /></div>;
    }

    const handleCreate = (e) => {
        e.preventDefault();
        createMutation.mutate({ courseId, title, content, dueDate: new Date(dueDate).toISOString() });
    };

    const handleUpload = (e, assignmentId) => {
        e.preventDefault();
        if (!uploadFile) return;
        const form = new FormData();
        form.append('AssignmentId', assignmentId);
        form.append('File', uploadFile);
        uploadMutation.mutate(form);
    };

    return (
        <div className="course-assignments">
            {isInstructor && (
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">Manage Assignments</h5>
                    <Button variant="primary" onClick={() => setShowCreate(!showCreate)} className="d-flex align-items-center gap-2">
                        <i className="bi bi-plus" style={{ fontSize: '16px' }}></i> New Assignment
                    </Button>
                </div>
            )}

            {showCreate && isInstructor && (
                <Card className="mb-4 shadow-sm border-0 bg-body-secondary">
                    <Card.Body>
                        <h6 className="fw-bold mb-3">Create New Assignment</h6>
                        <Form onSubmit={handleCreate}>
                            <Row>
                                <Col md={8}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Assignment Title</Form.Label>
                                        <Form.Control type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Midterm Project" />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Due Date</Form.Label>
                                        <Form.Control type="datetime-local" required value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Instructions / Description</Form.Label>
                                <Form.Control as="textarea" rows={3} required value={content} onChange={e => setContent(e.target.value)} placeholder="Describe what the students need to do..." />
                            </Form.Group>
                            <div className="d-flex justify-content-end gap-2">
                                <Button variant="light" onClick={() => setShowCreate(false)}>Cancel</Button>
                                <Button variant="primary" type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? <Spinner size="sm" /> : 'Create'}
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            {assignments?.length === 0 ? (
                <div className="text-center p-5 opacity-50">
                    <i className="bi bi-file-text mb-3" style={{ fontSize: '48px' }}></i>
                    <h6>No Assignments Yet</h6>
                    <p>There are no assignments for this course at the moment.</p>
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {assignments?.map(a => (
                        <Card key={a.id} className="border-0 shadow-sm" style={{ borderLeft: '4px solid #3b82f6' }}>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 className="mb-1 fw-semibold">{a.title}</h5>
                                        <div className="text-muted small mb-3">Due: {new Date(a.dueDate).toLocaleString()}</div>
                                        <p className="text-body" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{a.content}</p>
                                    </div>
                                    {isInstructor && (
                                        <div className="d-flex gap-2">
                                            <Button variant="outline-primary" size="sm" onClick={() => setGradingAssignmentId(a.id)}>
                                                Grade Submissions
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => { if(window.confirm('Delete this assignment?')) deleteMutation.mutate(a.id); }}>
                                                <i className="bi bi-trash" style={{ fontSize: '14px' }}></i>
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {!isInstructor && (
                                    <div className="mt-3 pt-3 border-top">
                                        {a.hasSubmitted ? (
                                            <div className="d-flex align-items-center justify-content-between p-3 rounded" style={{ background: 'rgba(52, 130, 82, 0.1)' }}>
                                                <div className="d-flex align-items-center gap-2 text-success" style={{ fontWeight: 500 }}>
                                                    <i className="bi bi-check-circle" style={{ fontSize: '20px' }}></i>
                                                    Submitted successfully
                                                </div>
                                                <div>
                                                    <a href={getFileUrl(a.submissionFileUrl)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success me-3">View File</a>
                                                    {a.submissionGrade !== null && a.submissionGrade !== undefined ? (
                                                        <Badge bg="success" style={{ fontSize: '0.9rem', padding: '0.5rem 0.8rem' }}>Grade: {a.submissionGrade}/100</Badge>
                                                    ) : (
                                                        <Badge bg="secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 0.8rem' }}>Pending Grading</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                {uploadingFor === a.id ? (
                                                    <Form onSubmit={(e) => handleUpload(e, a.id)} className="d-flex align-items-center gap-2 p-3 bg-body-secondary rounded border">
                                                        <Form.Control type="file" size="sm" onChange={e => setUploadFile(e.target.files[0])} accept=".pdf,.zip" />
                                                        <Button variant="primary" type="submit" size="sm" disabled={uploadMutation.isPending || !uploadFile}>
                                                            {uploadMutation.isPending ? <Spinner size="sm" /> : 'Upload'}
                                                        </Button>
                                                        <Button variant="light" size="sm" onClick={() => { setUploadingFor(null); setUploadFile(null); }}>Cancel</Button>
                                                    </Form>
                                                ) : (
                                                    <Button variant="primary" className="d-flex align-items-center gap-2" onClick={() => setUploadingFor(a.id)}>
                                                        <i className="bi bi-cloud-upload" style={{ fontSize: '16px' }}></i> Upload Work (.pdf/.zip)
                                                    </Button>
                                                )}
                                                <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>Max file size: 100MB. Allowed: PDF, ZIP.</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}

            {gradingAssignmentId && (
                <GradeSubmissionsModal 
                    assignmentId={gradingAssignmentId} 
                    onClose={() => setGradingAssignmentId(null)} 
                />
            )}
        </div>
    );
};

export default CourseAssignments;
