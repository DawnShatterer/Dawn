import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Card, Table, Badge, Form, Row, Col, Spinner, Button, Modal } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';

const AdminSupportMessages = () => {
    const queryClient = useQueryClient();
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(null);

    const { data: messages, isLoading } = useQuery({
        queryKey: ['support-messages', filterStatus],
        queryFn: async () => {
            const res = await api.get(`/SupportInquiry${filterStatus ? `?status=${filterStatus}` : ''}`);
            return res.data;
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            const res = await api.put(`/SupportInquiry/${id}/status`, { status });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['support-messages']);
            setSelectedMessage(null);
        }
    });

    const handleStatusChange = (id, status) => {
        updateStatusMutation.mutate({ id, status });
    };

    if (isLoading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading messages...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="px-4 py-4">
            <Helmet>
                <title>User Queries | Dawn LMS</title>
            </Helmet>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                        <i className="bi bi-chat-square-text text-primary" style={{ fontSize: '24px' }}></i>
                    </div>
                    <div>
                        <h3 className="fw-bolder mb-0">User Queries</h3>
                        <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage and resolve support issues.</p>
                    </div>
                </div>

                <Form.Select 
                    style={{ width: '200px' }} 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="Unread">Unread</option>
                    <option value="Read">Read</option>
                    <option value="Resolved">Resolved</option>
                </Form.Select>
            </div>

            <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-0">
                    <Table responsive hover className="align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3 text-muted small text-uppercase">Sender</th>
                                <th className="py-3 text-muted small text-uppercase">Subject</th>
                                <th className="py-3 text-muted small text-uppercase text-center">Date</th>
                                <th className="py-3 text-muted small text-uppercase text-center">Status</th>
                                <th className="py-3 text-muted small text-uppercase text-center px-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages?.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-5 text-muted">
                                        <i className="bi bi-chat-square-text mb-3 opacity-50" style={{ fontSize: '40px' }}></i>
                                        <p className="mb-0">No messages found.</p>
                                    </td>
                                </tr>
                            ) : (
                                messages?.map((msg) => (
                                    <tr key={msg.id} style={{ opacity: msg.status === 'Resolved' ? 0.7 : 1 }}>
                                        <td className="px-4 py-3">
                                            <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>{msg.fullName}</h6>
                                            <small className="text-muted"><i className="bi bi-envelope me-1" style={{ fontSize: '12px' }}></i>{msg.email}</small>
                                        </td>
                                        <td className="py-3">
                                            <span className="fw-semibold">{msg.subject}</span>
                                        </td>
                                        <td className="text-center py-3">
                                            <small className="text-muted"><i className="bi bi-calendar me-1" style={{ fontSize: '12px' }}></i>{new Date(msg.createdAt).toLocaleDateString()}</small>
                                        </td>
                                        <td className="text-center py-3">
                                            {msg.status === 'Unread' && <Badge bg="danger">Unread</Badge>}
                                            {msg.status === 'Read' && <Badge bg="warning" text="dark">Read</Badge>}
                                            {msg.status === 'Resolved' && <Badge bg="success">Resolved</Badge>}
                                        </td>
                                        <td className="text-center px-4 py-3">
                                            <Button 
                                                variant="light" 
                                                size="sm" 
                                                className="fw-bold rounded-3 shadow-sm border"
                                                onClick={() => {
                                                    setSelectedMessage(msg);
                                                    if (msg.status === 'Unread') handleStatusChange(msg.id, 'Read');
                                                }}
                                            >
                                                View Issue
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* View Message Modal */}
            <Modal show={!!selectedMessage} onHide={() => setSelectedMessage(null)} size="lg" centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bolder fs-5">
                        Issue Details
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {selectedMessage && (
                        <>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <p className="text-uppercase text-muted mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>From</p>
                                    <p className="mb-0 fw-semibold">{selectedMessage.fullName}</p>
                                    <a href={`mailto:${selectedMessage.email}`} className="small text-decoration-none text-primary">{selectedMessage.email}</a>
                                </Col>
                                <Col md={6} className="text-md-end">
                                    <p className="text-uppercase text-muted mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Sent On</p>
                                    <p className="mb-0 fw-semibold">
                                        {new Date(selectedMessage.createdAt).toLocaleString()}
                                    </p>
                                </Col>
                            </Row>
                            
                            <div className="bg-body-secondary p-4 rounded-3 border mb-4">
                                <h6 className="fw-bold mb-3 border-bottom pb-2">{selectedMessage.subject}</h6>
                                <p className="mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                    {selectedMessage.message}
                                </p>
                            </div>

                            <div className="d-flex justify-content-end gap-2">
                                {selectedMessage.status !== 'Resolved' && (
                                    <Button 
                                        variant="success" 
                                        className="fw-bold px-4 rounded-3"
                                        onClick={() => handleStatusChange(selectedMessage.id, 'Resolved')}
                                        disabled={updateStatusMutation.isPending}
                                    >
                                        <i className="bi bi-check-circle me-2" style={{ fontSize: '18px' }}></i> Mark as Resolved
                                    </Button>
                                )}
                                <Button variant="outline-secondary" onClick={() => setSelectedMessage(null)}>
                                    Close
                                </Button>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>

        </Container>
    );
};

export default AdminSupportMessages;
