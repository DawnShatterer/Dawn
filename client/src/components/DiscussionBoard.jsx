import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCourseThreads, getThreadDetails, createThread, createReply, deleteThread, deleteReply } from '../api/discussionService';
import { Card, Button, Form, Spinner, Alert, Badge, Row, Col } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ThreadView = ({ threadId, onBack, currentUserId, userRole }) => {
    const queryClient = useQueryClient();
    const [replyContent, setReplyContent] = useState('');

    const { data: thread, isLoading, isError } = useQuery({
        queryKey: ['thread', threadId],
        queryFn: () => getThreadDetails(threadId)
    });

    const replyMutation = useMutation({
        mutationFn: (content) => createReply(threadId, content),
        onSuccess: () => {
            queryClient.invalidateQueries(['thread', threadId]);
            queryClient.invalidateQueries(['threads']); // update counts
            setReplyContent('');
        }
    });

    const delReplyMutation = useMutation({
        mutationFn: deleteReply,
        onSuccess: () => queryClient.invalidateQueries(['thread', threadId])
    });

    if (isLoading) return <Spinner animation="border" variant="primary" className="m-4" />;
    if (isError || !thread) return <Alert variant="danger">Failed to load thread.</Alert>;

    const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';

    const handleReply = (e) => {
        e.preventDefault();
        if (replyContent.trim()) replyMutation.mutate(replyContent.trim());
    };

    return (
        <div className="animate-fade-in">
            <Button variant="link" className="text-decoration-none p-0 mb-3 d-flex align-items-center" onClick={onBack}>
                <i className="bi bi-arrow-left me-1" style={{ fontSize: '16px' }}></i> Back to Discussions
            </Button>
            
            <Card className="border-0 shadow-sm mb-4 border-start border-4 border-primary">
                <Card.Body className="p-4">
                    <h4 className="fw-bold mb-3">{thread.title}</h4>
                    <p className="fs-5 mb-4" style={{ whiteSpace: 'pre-wrap' }}>{thread.content}</p>
                    <div className="d-flex align-items-center text-muted small border-top pt-3">
                        <i className="bi bi-person me-1" style={{ fontSize: '14px' }}></i>
                        <span className="fw-bold me-2">{thread.authorName}</span>
                        <Badge bg="light" text="dark" className="me-3">{thread.authorRole}</Badge>
                        <span>{new Date(thread.createdAt).toLocaleString()}</span>
                    </div>
                </Card.Body>
            </Card>

            <h5 className="fw-bold mb-3 d-flex align-items-center">
                <i className="bi bi-chat-dots me-2 text-primary" style={{ fontSize: '18px' }}></i> 
                {thread.replies?.length || 0} Replies
            </h5>

            {thread.replies?.map(r => (
                <Card key={r.id} className="border-0 shadow-sm mb-3 ms-4 ms-md-5">
                    <Card.Body className="p-3">
                        <div className="d-flex justify-content-between">
                            <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>{r.content}</p>
                            {(r.authorId === currentUserId || isTeacherOrAdmin) && (
                                <Button variant="link" size="sm" className="text-danger p-0 ms-2" onClick={() => { if(window.confirm("Delete reply?")) delReplyMutation.mutate(r.id); }}>
                                    <i className="bi bi-trash" style={{ fontSize: '14px' }}></i>
                                </Button>
                            )}
                        </div>
                        <div className="d-flex align-items-center text-muted small">
                            <span className="fw-bold me-2">{r.authorName}</span>
                            <Badge bg="light" text="dark" className="me-3">{r.authorRole}</Badge>
                            <span>{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                    </Card.Body>
                </Card>
            ))}

            <Card className="border-0 shadow-sm mt-4 ms-4 ms-md-5 bg-body-tertiary">
                <Card.Body className="p-3">
                    <Form onSubmit={handleReply}>
                        <Form.Group className="mb-2">
                            <Form.Control 
                                as="textarea" 
                                rows={2} 
                                placeholder="Write a reply..." 
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="primary" type="submit" size="sm" className="fw-bold px-4" disabled={replyMutation.isPending}>
                                {replyMutation.isPending ? 'Posting...' : <><i className="bi bi-send me-1" style={{ fontSize: '14px' }}></i> Post Reply</>}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

const DiscussionBoard = ({ courseId, currentUserId, userRole }) => {
    const queryClient = useQueryClient();
    const [viewingThreadId, setViewingThreadId] = useState(null);
    const [showNewThread, setShowNewThread] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const { data: threads, isLoading } = useQuery({
        queryKey: ['threads', courseId],
        queryFn: () => getCourseThreads(courseId)
    });

    const createMutation = useMutation({
        mutationFn: (data) => createThread(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['threads', courseId]);
            setShowNewThread(false);
            setTitle('');
            setContent('');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteThread,
        onSuccess: () => queryClient.invalidateQueries(['threads', courseId])
    });

    const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';

    if (viewingThreadId) {
        return <ThreadView threadId={viewingThreadId} onBack={() => setViewingThreadId(null)} currentUserId={currentUserId} userRole={userRole} />;
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold m-0 d-flex align-items-center text-primary">
                    <i className="bi bi-chat-square-text me-2" style={{ fontSize: '20px' }}></i> Class Discussions
                </h4>
                <Button variant="primary" size="sm" onClick={() => setShowNewThread(!showNewThread)} className="fw-bold">
                    {showNewThread ? 'Cancel' : 'Start Discussion'}
                </Button>
            </div>

            {showNewThread && (
                <Card className="border-0 shadow-sm mb-4 bg-body-tertiary">
                    <Card.Body className="p-4">
                        <h5 className="fw-bold mb-3">Create New Topic</h5>
                        <Form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ title, content, courseId }); }}>
                            <Form.Group className="mb-3">
                                <Form.Label>Topic Title</Form.Label>
                                <Form.Control required placeholder="What do you want to discuss?" value={title} onChange={e => setTitle(e.target.value)} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Details</Form.Label>
                                <Form.Control required as="textarea" rows={3} placeholder="Provide more context..." value={content} onChange={e => setContent(e.target.value)} />
                            </Form.Group>
                            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Posting...' : 'Post Topic'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            {isLoading && <Spinner animation="border" variant="primary" />}
            
            {!isLoading && threads?.length === 0 && (
                <div className="text-center py-5 text-muted">
                    <i className="bi bi-chat-dots opacity-25 mb-3" style={{ fontSize: '48px' }}></i>
                    <p>No discussions yet. Be the first to start one!</p>
                </div>
            )}

            {!isLoading && threads?.map(t => (
                <Card key={t.id} className="border-0 shadow-sm mb-3 hover-shadow" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                    <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1" onClick={() => setViewingThreadId(t.id)}>
                                <h5 className="fw-bold mb-2 text-body hover-primary">{t.title}</h5>
                                <div className="d-flex align-items-center text-muted small">
                                    <span className="fw-bold text-primary me-2">{t.authorName}</span>
                                    <Badge bg="light" text="dark" className="me-3">{t.authorRole}</Badge>
                                    <span className="me-3">{new Date(t.createdAt).toLocaleDateString()}</span>
                                    <span className="d-flex align-items-center text-info">
                                        <i className="bi bi-chat-dots me-1" style={{ fontSize: '14px' }}></i> {t.replyCount} Replies
                                    </span>
                                </div>
                            </div>
                            {(t.authorId === currentUserId || isTeacherOrAdmin) && (
                                <Button variant="link" size="sm" className="text-danger p-0 ms-3 z-3" onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete thread completely?')) deleteMutation.mutate(t.id); }}>
                                    <i className="bi bi-trash" style={{ fontSize: '16px' }}></i>
                                </Button>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
};

export default DiscussionBoard;
