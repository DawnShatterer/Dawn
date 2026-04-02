import React, { useState } from 'react';
import { Card, Row, Col, Form, Button, Alert, Tabs, Tab, Table, Badge, Spinner } from 'react-bootstrap';
import { Settings, Shield, Palette, Globe, CreditCard, LayoutDashboard, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import PaginationControls from '../components/PaginationControls';

const AdminDashboard = () => {
    const [branding, setBranding] = useState({
        name: 'Dawn Platform',
        logoUrl: '/logo.png',
        primaryColor: '#0d6efd',
        secondaryColor: '#6c757d'
    });
    
    // UI-only toggles for demonstration of extended global settings
    const [advancedSettings, setAdvancedSettings] = useState({
        allowRegistration: true,
        maintenanceMode: false,
        requireEmailVerification: true
    });

    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState('');

    const handleSaveBranding = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/Institutions', branding);
            
            // In a real app, advancedSettings would also be POSTed to a settings endpoint
            
            setSuccess('Global platform settings saved successfully! Refresh page to apply theme changes.');
            setTimeout(() => setSuccess(''), 5000);
        } catch (error) {
            console.error('Failed to save branding', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container-fluid py-4 font-sans">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Site Administration</h2>
                <div className="badge bg-danger bg-opacity-10 text-danger border border-danger p-2 px-3">
                    <Shield size={14} className="me-2 mb-1" /> Super Admin Access
                </div>
            </div>

            <Tabs defaultActiveKey="config" className="mb-4 dashboard-tabs border-bottom-0">
                <Tab eventKey="config" title={<><LayoutDashboard size={16} className="me-2 mb-1" />Global Configuration</>}>
                    <Row className="g-4">
                {/* Brand & Theme Configuration */}
                <Col lg={12}>
                    <Card className="border-0 shadow-sm overflow-hidden mb-4 h-100">
                        <div className="bg-body border-bottom p-4">
                            <h5 className="fw-bold mb-1 text-body"><Palette size={18} className="me-2 mb-1 text-primary"/> Global Platform Branding</h5>
                            <p className="text-muted mb-0 small">Configure the global look and feel of the platform.</p>
                        </div>
                        <Card.Body className="p-4 bg-body">
                            {success && <Alert variant="success">{success}</Alert>}
                            <Form onSubmit={handleSaveBranding}>
                                <Row className="g-4 mb-4">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted">Platform Name</Form.Label>
                                            <Form.Control type="text" value={branding.name} onChange={(e) => setBranding({...branding, name: e.target.value})} placeholder="e.g. Dawn EdTech" />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted">Logo Image URL</Form.Label>
                                            <Form.Control type="text" value={branding.logoUrl} onChange={(e) => setBranding({...branding, logoUrl: e.target.value})} placeholder="https://..." />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted">Primary Brand Color (Hex)</Form.Label>
                                            <div className="d-flex align-items-center">
                                                <Form.Control type="color" value={branding.primaryColor} onChange={(e) => setBranding({...branding, primaryColor: e.target.value})} className="me-3 p-1" style={{ width: '50px', height: '40px' }} />
                                                <Form.Control type="text" value={branding.primaryColor} onChange={(e) => setBranding({...branding, primaryColor: e.target.value})} />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold small text-muted">Secondary Accent Color (Hex)</Form.Label>
                                            <div className="d-flex align-items-center">
                                                <Form.Control type="color" value={branding.secondaryColor} onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})} className="me-3 p-1" style={{ width: '50px', height: '40px' }} />
                                                <Form.Control type="text" value={branding.secondaryColor} onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})} />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Button variant="primary" type="submit" className="px-5 py-2 fw-bold" disabled={isSaving}>
                                    <Settings size={16} className="me-2 mb-1" /> Deploy Configuration
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
                </Tab>
                <Tab eventKey="payouts" title={<><CreditCard size={16} className="me-2 mb-1" />Instructor Payout Requests</>}>
                    <AdminPayouts />
                </Tab>
            </Tabs>

            <style>{`
                .dashboard-tabs .nav-link {
                    color: var(--bs-secondary);
                    font-weight: 500;
                    border: none;
                    border-bottom: 2px solid transparent;
                    padding: 0.75rem 1.5rem;
                }
                .dashboard-tabs .nav-link:hover {
                    border-color: transparent;
                    color: var(--bs-primary);
                }
                .dashboard-tabs .nav-link.active {
                    color: var(--bs-primary) !important;
                    background: transparent;
                    border-color: var(--bs-primary);
                    border-radius: 0;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;

// ── Admin Payouts Component ──
const AdminPayouts = () => {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [notes, setNotes] = useState({});
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPayouts = async (currentPage) => {
        setLoading(true);
        try {
            const res = await api.get(`/Payout/all?page=${currentPage}&limit=10`);
            setPayouts(res.data.items || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error('Failed to load payouts', err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { fetchPayouts(page); }, [page]);

    const handleProcess = async (id, status) => {
        if (!window.confirm(`Are you sure you want to mark this payout as ${status}?`)) return;
        setProcessingId(id);
        try {
            await api.put(`/Payout/${id}/process`, {
                status: status,
                adminNotes: notes[id] || ''
            });
            fetchPayouts(); // Refresh list
        } catch (err) {
            alert('Failed to process payout. ' + (err.response?.data?.message || ''));
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

    const pendingCount = payouts.filter(p => p.status === 'Pending').length;

    return (
        <Card className="border-0 shadow-sm rounded-4">
            <Card.Header className="bg-body border-bottom p-4 d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="fw-bold mb-1"><CreditCard size={18} className="me-2 text-primary mb-1"/> Platform Payout Queue</h5>
                    <p className="text-muted small mb-0">Manage instructor withdrawal requests. {pendingCount > 0 ? <Badge bg="warning" className="ms-2">{pendingCount} pending requests</Badge> : ''}</p>
                </div>
            </Card.Header>
            <Card.Body className="p-0">
                <Table responsive hover className="align-middle mb-0">
                    <thead className="bg-body-tertiary">
                        <tr>
                            <th className="px-4 py-3 small text-muted font-monospace text-uppercase">Instructor</th>
                            <th className="py-3 small text-muted font-monospace text-uppercase">Amount/Method</th>
                            <th className="py-3 small text-muted font-monospace text-uppercase">Request Date</th>
                            <th className="py-3 small text-muted font-monospace text-uppercase">Status</th>
                            <th className="px-4 py-3 small text-muted font-monospace text-uppercase">Admin Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payouts.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-5 text-muted">No payout requests found.</td></tr>
                        ) : (
                            payouts.map((p) => (
                                <tr key={p.id}>
                                    <td className="px-4">
                                        <div className="fw-bold">{p.instructorName}</div>
                                        <div className="small text-muted">{p.instructorEmail}</div>
                                    </td>
                                    <td>
                                        <div className="fw-bold text-success">Rs. {p.amount.toFixed(2)}</div>
                                        <div className="small text-muted">{p.paymentMethod}</div>
                                    </td>
                                    <td className="small text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <Badge bg={p.status === 'Paid' ? 'success' : p.status === 'Rejected' ? 'danger' : 'warning'} className="px-3 py-2 rounded-pill shadow-sm">
                                            {p.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4">
                                        {p.status === 'Pending' ? (
                                            <div className="d-flex flex-column gap-2" style={{ maxWidth: '250px' }}>
                                                <Form.Control 
                                                    size="sm" 
                                                    type="text" 
                                                    placeholder="Reference ID/Notes (optional)" 
                                                    value={notes[p.id] || ''}
                                                    onChange={e => setNotes({...notes, [p.id]: e.target.value})}
                                                    className="rounded-3 px-3 py-2"
                                                />
                                                <div className="d-flex gap-2">
                                                    <Button size="sm" variant="success" className="w-50 fw-bold d-flex align-items-center justify-content-center" onClick={() => handleProcess(p.id, 'Paid')} disabled={processingId === p.id}>
                                                        {processingId === p.id ? <Spinner size="sm" /> : <><CheckCircle size={14} className="me-1"/> Pay</>}
                                                    </Button>
                                                    <Button size="sm" variant="outline-danger" className="w-50 fw-bold d-flex align-items-center justify-content-center" onClick={() => handleProcess(p.id, 'Rejected')} disabled={processingId === p.id}>
                                                        <XCircle size={14} className="me-1"/> Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="small text-muted fst-italic">
                                                {p.status} on {new Date(p.processedAt).toLocaleDateString()}<br/>
                                                <span className="fw-bold">Note: </span>{p.adminNotes || 'None'}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card.Body>
            <Card.Footer className="bg-body border-0 py-3">
                <PaginationControls page={page} setPage={setPage} totalPages={totalPages} />
            </Card.Footer>
        </Card>
    );
};
