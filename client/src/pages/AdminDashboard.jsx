import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Card, Nav, Tab, Form, Button, Alert, Spinner, Table, Badge, Row, Col, Modal } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from '../api/axios';

const AdminDashboard = () => {
    return (
        <Container fluid className="py-4 h-100">
            <div className="mb-4">
                <h2 className="fw-bold mb-1">Site Administration</h2>
                <p className="text-muted">System-level management of faculty, staff, and core platform modules.</p>
            </div>

            <Tab.Container defaultActiveKey="users">
                <Card className="border-0 shadow-sm overflow-hidden mb-4">
                    <Card.Header className="bg-body border-bottom pt-3 pb-0 px-4">
                        <Nav variant="tabs" className="border-bottom-0 gap-3">
                            <Nav.Item>
                                <Nav.Link eventKey="users" className="fw-bold px-4 py-3 border-0 border-bottom border-3 border-opacity-50">Faculty & Staff</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="cleanup" className="fw-bold px-4 py-3 border-0 border-bottom border-3 border-opacity-50">Student Cleanup</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="modules" className="fw-bold px-4 py-3 border-0 border-bottom border-3 border-opacity-50">Module Assignments</Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Card.Header>
                    <Card.Body className="p-0 bg-body-secondary" style={{ minHeight: '500px' }}>
                        <Tab.Content>
                            <Tab.Pane eventKey="users">
                                <div className="p-4">
                                    <AdminUserManagement />
                                </div>
                            </Tab.Pane>
                            <Tab.Pane eventKey="cleanup">
                                <div className="p-4">
                                    <StudentCleanup />
                                </div>
                            </Tab.Pane>
                            <Tab.Pane eventKey="modules">
                                <div className="p-4">
                                    <AdminModuleAssignment />
                                </div>
                            </Tab.Pane>
                        </Tab.Content>
                    </Card.Body>
                </Card>
            </Tab.Container>
        </Container>
    );
};

export default AdminDashboard;

// ══════════════════════════════════════════
// ══════ ADMIN USER MANAGEMENT ═════════════
// ══════════════════════════════════════════

const AdminUserManagement = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({ fullName: '', role: 'Teacher' });
    const [feedback, setFeedback] = useState(null);
    const [resetTarget, setResetTarget] = useState(null);
    const [resetFeedback, setResetFeedback] = useState(null);

    // Fetch existing teachers & staff
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-all-users'],
        queryFn: async () => {
            const res = await api.get('/Auth/all-users?roles=Teacher,Staff');
            return res.data;
        }
    });

    const generateMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/Auth/generate-staff', data);
            return res.data;
        },
        onSuccess: (data) => {
            setFeedback({ type: 'success', msg: `${data.role} account created: ${data.email} (${data.fullName})` });
            setFormData({ fullName: '', role: 'Teacher' });
            queryClient.invalidateQueries(['admin-all-users']);
        },
        onError: (err) => {
            setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to generate account.' });
        }
    });

    const resetPasswordMutation = useMutation({
        mutationFn: async (userId) => {
            const res = await api.post('/Auth/admin-reset-password', { userId });
            return res.data;
        },
        onSuccess: (data) => {
            setResetFeedback({ type: 'success', msg: data.message || 'Password reset to default.' });
            setResetTarget(null);
        },
        onError: (err) => {
            setResetFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to reset password.' });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setFeedback(null);
        if (!formData.fullName.trim()) return;
        generateMutation.mutate(formData);
    };

    return (
        <div>
            <h5 className="fw-bold mb-3 d-flex align-items-center">
                <i className="bi bi-person-plus me-2 text-primary" style={{ fontSize: '20px' }}></i> Generate Faculty & Staff Accounts
            </h5>
            
            {feedback && <Alert variant={feedback.type} className="py-2 small" dismissible onClose={() => setFeedback(null)}>{feedback.msg}</Alert>}

            <Card className="border shadow-sm rounded-3 mb-4">
                <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        <Row className="g-3 align-items-end">
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Full Name</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={formData.fullName} 
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} 
                                        placeholder="e.g. Ramesh Pradhan" 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Role</Form.Label>
                                    <Form.Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="Teacher">Teacher</option>
                                        <option value="Staff">Staff</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Button type="submit" variant="primary" className="w-100 fw-bold rounded-3" disabled={generateMutation.isPending}>
                                    {generateMutation.isPending ? <Spinner size="sm" /> : 'Generate Account'}
                                </Button>
                            </Col>
                        </Row>
                        <small className="text-muted mt-2 d-block">
                            Email will be auto-generated as <code>faculty1001@dawn.edu.np</code> or <code>staff1001@dawn.edu.np</code>. Default password: <code>dawnuser1090</code>.
                        </small>
                    </Form>
                </Card.Body>
            </Card>

            {/* Existing Users Table */}
            <h6 className="fw-bold mb-3">Existing Faculty & Staff</h6>
            {isLoading ? (
                <div className="text-center py-4"><Spinner /></div>
            ) : (
                <Table responsive hover className="align-middle bg-body rounded shadow-sm">
                    <thead className="bg-body-tertiary">
                        <tr>
                            <th className="small text-muted fw-bold">Name</th>
                            <th className="small text-muted fw-bold">Email</th>
                            <th className="small text-muted fw-bold">Role</th>
                            <th className="small text-muted fw-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.length === 0 && (
                            <tr><td colSpan={4} className="text-center text-muted py-4">No faculty or staff accounts found.</td></tr>
                        )}
                        {users?.map(u => (
                            <tr key={u.id}>
                                <td className="fw-medium">{u.fullName}</td>
                                <td><code className="small">{u.email}</code></td>
                                <td><Badge bg={u.role === 'Teacher' ? 'info' : 'secondary'}>{u.role}</Badge></td>
                                <td>
                                    <Button 
                                        variant="outline-warning" 
                                        size="sm" 
                                        className="d-flex align-items-center gap-1"
                                        onClick={() => { setResetTarget(u); setResetFeedback(null); }}
                                    >
                                        <i className="bi bi-key" style={{ fontSize: '14px' }}></i> Reset Password
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {/* Reset Password Confirmation Modal */}
            <Modal show={!!resetTarget} onHide={() => setResetTarget(null)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold fs-5">Reset Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {resetFeedback && <Alert variant={resetFeedback.type} className="py-2 small">{resetFeedback.msg}</Alert>}
                    <p>Reset password for <strong>{resetTarget?.fullName}</strong> ({resetTarget?.email}) to the default <code>dawnuser1090</code>?</p>
                    <p className="text-muted small mb-0">They will be forced to change it on next login.</p>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setResetTarget(null)}>Cancel</Button>
                    <Button variant="warning" className="fw-bold" disabled={resetPasswordMutation.isPending} onClick={() => resetPasswordMutation.mutate(resetTarget.id)}>
                        {resetPasswordMutation.isPending ? <Spinner size="sm" /> : 'Confirm Reset'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

// ══════════════════════════════════════════
// ══════ STUDENT CLEANUP ═══════════════════
// ══════════════════════════════════════════

const StudentCleanup = () => {
    const queryClient = useQueryClient();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const { data: unbatchedData, isLoading } = useQuery({
        queryKey: ['unbatched-students'],
        queryFn: async () => {
            const res = await api.get('/Auth/unbatched-students');
            return res.data;
        },
        refetchOnWindowFocus: true
    });

    const cleanupMutation = useMutation({
        mutationFn: async () => {
            const res = await api.delete('/Auth/cleanup-unbatched-students');
            return res.data;
        },
        onSuccess: (data) => {
            setFeedback({ type: 'success', msg: data.message });
            setShowConfirmModal(false);
            queryClient.invalidateQueries(['unbatched-students']);
        },
        onError: (err) => {
            setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to cleanup students.' });
            setShowConfirmModal(false);
        }
    });

    const handleCleanup = () => {
        setFeedback(null);
        cleanupMutation.mutate();
    };

    const unbatchedStudents = unbatchedData?.Students || [];
    const count = unbatchedData?.Count || 0;

    return (
        <>
            <Card className="border-0 shadow-sm rounded-4">
                <Card.Header className="bg-body border-0 pt-4 pb-3 px-4 border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="fw-bold mb-1 d-flex align-items-center">
                                <i className="bi bi-trash me-2 text-danger" style={{ fontSize: '18px' }}></i>
                                Unbatched Students Cleanup
                            </h5>
                            <p className="text-muted small mb-0">Remove students who are not assigned to any batch</p>
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => queryClient.invalidateQueries(['unbatched-students'])}
                                className="d-flex align-items-center"
                            >
                                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                            </Button>
                            {count > 0 && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => setShowConfirmModal(true)}
                                    className="d-flex align-items-center"
                                >
                                    <i className="bi bi-trash me-1"></i> Delete All ({count})
                                </Button>
                            )}
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="p-4">
                    {feedback && (
                        <Alert variant={feedback.type} dismissible onClose={() => setFeedback(null)} className="mb-3">
                            {feedback.msg}
                        </Alert>
                    )}

                    {isLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : count === 0 ? (
                        <div className="text-center py-5 opacity-50">
                            <i className="bi bi-check-circle mb-3" style={{ fontSize: '48px', color: 'var(--bs-success)' }}></i>
                            <h5 className="fw-bold">All Clean!</h5>
                            <p className="text-muted">No unbatched students found. All students are properly assigned to batches.</p>
                        </div>
                    ) : (
                        <>
                            <Alert variant="warning" className="mb-3 d-flex align-items-start">
                                <i className="bi bi-exclamation-triangle me-2 mt-1" style={{ fontSize: '20px' }}></i>
                                <div>
                                    <strong>Warning:</strong> Found {count} student{count !== 1 ? 's' : ''} without batch assignments. 
                                    These students cannot access the system properly and should either be assigned to a batch or removed.
                                </div>
                            </Alert>

                            <Table hover responsive className="mb-0">
                                <thead className="bg-body-tertiary">
                                    <tr>
                                        <th className="px-4 py-3 text-muted small text-uppercase">Student Name</th>
                                        <th className="py-3 text-muted small text-uppercase">Email</th>
                                        <th className="py-3 text-muted small text-uppercase">Created At</th>
                                        <th className="py-3 text-muted small text-uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unbatchedStudents.map((student) => (
                                        <tr key={student.id}>
                                            <td className="px-4 fw-medium">{student.fullName}</td>
                                            <td>
                                                <span className="text-primary" style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                                    {student.email}
                                                </span>
                                            </td>
                                            <td className="small text-muted">
                                                {new Date(student.createdAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <Badge bg="warning" className="fw-normal">
                                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                                    No Batch
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Confirmation Modal */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">
                        <i className="bi bi-exclamation-triangle text-danger me-2"></i>
                        Confirm Deletion
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-3">
                        You are about to <strong className="text-danger">permanently delete {count} student account{count !== 1 ? 's' : ''}</strong> that {count !== 1 ? 'are' : 'is'} not assigned to any batch.
                    </p>
                    <Alert variant="danger" className="mb-0">
                        <strong>This action cannot be undone!</strong> All data associated with these students will be permanently removed.
                    </Alert>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                        Cancel
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleCleanup}
                        disabled={cleanupMutation.isLoading}
                    >
                        {cleanupMutation.isLoading ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-trash me-2"></i>
                                Delete All
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

// ══════════════════════════════════════════
// ══════ ADMIN MODULE ASSIGNMENT ═══════════
// ══════════════════════════════════════════

const AdminModuleAssignment = () => {
    const queryClient = useQueryClient();
    const [feedback, setFeedback] = useState(null);

    // Fetch all modules
    const { data: modulesData, isLoading: modulesLoading } = useQuery({
        queryKey: ['admin-all-modules'],
        queryFn: async () => {
            const res = await api.get('/Courses?limit=50');
            return res.data;
        }
    });

    // Fetch all teachers for dropdown
    const { data: teachers, isLoading: teachersLoading } = useQuery({
        queryKey: ['admin-teachers-list'],
        queryFn: async () => {
            const res = await api.get('/Auth/all-users?roles=Teacher');
            return res.data;
        }
    });

    const assignMutation = useMutation({
        mutationFn: async ({ courseId, teacherId }) => {
            const res = await api.put(`/Courses/${courseId}/assign-teacher`, { teacherId });
            return res.data;
        },
        onSuccess: (data) => {
            setFeedback({ type: 'success', msg: data.message });
            queryClient.invalidateQueries(['admin-all-modules']);
        },
        onError: (err) => {
            setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Assignment failed.' });
        }
    });

    const handleAssign = (courseId, teacherId) => {
        if (!teacherId) return;
        setFeedback(null);
        assignMutation.mutate({ courseId, teacherId });
    };

    const modules = modulesData?.items || modulesData?.data || modulesData || [];
    const moduleList = Array.isArray(modules) ? modules : [];

    if (modulesLoading || teachersLoading) return <div className="text-center py-5"><Spinner /></div>;

    return (
        <div>
            <h5 className="fw-bold mb-3 d-flex align-items-center">
                <i className="bi bi-book me-2 text-success" style={{ fontSize: '20px' }}></i> Teacher-to-Module Binding
            </h5>

            {feedback && <Alert variant={feedback.type} className="py-2 small" dismissible onClose={() => setFeedback(null)}>{feedback.msg}</Alert>}

            {moduleList.length === 0 ? (
                <Alert variant="info">No modules found. Create modules first from the "Create Module" page.</Alert>
            ) : (
                <Table responsive hover className="align-middle bg-body rounded shadow-sm">
                    <thead className="bg-body-tertiary">
                        <tr>
                            <th className="small text-muted fw-bold">Module</th>
                            <th className="small text-muted fw-bold">Category</th>
                            <th className="small text-muted fw-bold">Current Teacher</th>
                            <th className="small text-muted fw-bold" style={{ minWidth: '250px' }}>Assign Teacher</th>
                        </tr>
                    </thead>
                    <tbody>
                        {moduleList.map(m => (
                            <tr key={m.id}>
                                <td className="fw-medium">{m.title}</td>
                                <td><Badge bg="light" text="dark" className="border">{m.category || 'General'}</Badge></td>
                                <td>
                                    {m.instructorName ? (
                                        <span className="fw-medium text-success">{m.instructorName}</span>
                                    ) : (
                                        <span className="text-muted fst-italic">Unassigned</span>
                                    )}
                                </td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <Form.Select 
                                            size="sm" 
                                            defaultValue="" 
                                            className="w-auto"
                                            id={`teacher-select-${m.id}`}
                                        >
                                            <option value="" disabled>Select teacher...</option>
                                            {teachers?.map(t => (
                                                <option key={t.id} value={t.id}>{t.fullName}</option>
                                            ))}
                                        </Form.Select>
                                        <Button 
                                            variant="success" 
                                            size="sm" 
                                            className="fw-bold"
                                            disabled={assignMutation.isPending}
                                            onClick={() => {
                                                const select = document.getElementById(`teacher-select-${m.id}`);
                                                handleAssign(m.id, select?.value);
                                            }}
                                        >
                                            {assignMutation.isPending ? <Spinner size="sm" /> : 'Assign'}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
};
