import React, { useState } from 'react';
import { Modal, Button, Table, Spinner, Form, Badge } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAssignmentSubmissions, gradeSubmission } from '../api/assignmentService';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getFileUrl } from '../utils/fileUtils';

const GradeSubmissionsModal = ({ assignmentId, onClose }) => {
    const queryClient = useQueryClient();
    
    // Grading Form State (keyed by submissionId)
    const [grades, setGrades] = useState({});
    const [feedbacks, setFeedbacks] = useState({});

    const { data: submissions, isLoading } = useQuery({
        queryKey: ['submissions', assignmentId],
        queryFn: () => getAssignmentSubmissions(assignmentId),
        enabled: !!assignmentId
    });

    const gradeMutation = useMutation({
        mutationFn: ({ id, data }) => gradeSubmission(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['submissions', assignmentId]);
            // Also invalidate assignments so the student grade auto-updates if testing parallel
            queryClient.invalidateQueries(['assignments']);
            // Invalidate grade roster to refresh when assignments are graded
            queryClient.invalidateQueries(['course-grades']);
        }
    });

    const handleSaveGrade = (submissionId) => {
        const payload = {
            grade: parseInt(grades[submissionId] || 0),
            feedback: feedbacks[submissionId] || ''
        };
        gradeMutation.mutate({ id: submissionId, data: payload });
    };

    return (
        <Modal show={!!assignmentId} onHide={onClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Grade Submissions</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {isLoading ? (
                    <div className="text-center p-5"><Spinner animation="border" /></div>
                ) : submissions?.length === 0 ? (
                    <div className="text-center p-4 text-muted">No students have submitted this assignment yet.</div>
                ) : (
                    <Table hover responsive className="align-middle">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Submitted On</th>
                                <th>Status</th>
                                <th>File</th>
                                <th style={{ width: '120px' }}>Grade (0-100)</th>
                                <th>Feedback</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(sub => (
                                <tr key={sub.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{sub.studentName}</div>
                                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{sub.studentEmail}</div>
                                    </td>
                                    <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                                    <td>
                                        {sub.isGraded ? <Badge bg="success">Graded</Badge> : <Badge bg="warning" text="dark">Pending</Badge>}
                                    </td>
                                    <td>
                                        <a href={getFileUrl(sub.fileUrl)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ width: 'max-content' }}>
                                            <i className="bi bi-download" style={{ fontSize: '14px' }}></i> Download
                                        </a>
                                    </td>
                                    <td>
                                        <Form.Control 
                                            type="number" 
                                            min="0" 
                                            max="100" 
                                            size="sm"
                                            defaultValue={sub.grade ?? ''}
                                            onChange={(e) => setGrades({ ...grades, [sub.id]: e.target.value })}
                                            placeholder="/ 100"
                                        />
                                    </td>
                                    <td>
                                        <Form.Control 
                                            as="textarea" 
                                            rows={1}
                                            size="sm"
                                            defaultValue={sub.feedback ?? ''}
                                            onChange={(e) => setFeedbacks({ ...feedbacks, [sub.id]: e.target.value })}
                                            placeholder="Great work..."
                                        />
                                    </td>
                                    <td>
                                        <Button 
                                            variant="dark" 
                                            size="sm" 
                                            onClick={() => handleSaveGrade(sub.id)}
                                            disabled={gradeMutation.isPending && gradeMutation.variables?.id === sub.id}
                                        >
                                            {gradeMutation.isPending && gradeMutation.variables?.id === sub.id ? <Spinner size="sm" /> : <i className="bi bi-check" style={{ fontSize: '16px' }}></i>} Save
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default GradeSubmissionsModal;
