import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Card, Table, Badge, Spinner, Row, Col, Button, Modal } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';

const MyTuition = () => {
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['my-tuition'],
        queryFn: async () => {
            const res = await api.get('/Tuition/my-invoices');
            return res.data;
        }
    });

    const payMutation = useMutation({
        mutationFn: async ({ invoiceId, gateway }) => {
            const res = await api.post('/Payment/initiate', {
                semesterInvoiceId: invoiceId,
                gateway,
                frontendBaseUrl: window.location.origin,
                backendBaseUrl: import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5159'
            });
            return res.data;
        },
        onSuccess: (data) => {
            if (data.gateway === 'esewa' && data.paymentUrl) {
                // Build and submit eSewa form
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = data.paymentUrl;
                Object.entries(data.formData).forEach(([key, value]) => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value;
                    form.appendChild(input);
                });
                document.body.appendChild(form);
                form.submit();
            } else if (data.gateway === 'khalti' && data.paymentUrl) {
                window.location.href = data.paymentUrl;
            }
        }
    });

    const handlePay = (invoice, gateway) => {
        payMutation.mutate({ invoiceId: invoice.id, gateway });
        setShowPayModal(false);
    };

    if (isLoading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading billing information...</p>
            </Container>
        );
    }

    const invoices = data?.invoices || [];
    const totalDue = data?.totalDue || 0;
    const totalPaid = data?.totalPaid || 0;

    // Pagination logic
    const totalPages = Math.ceil(invoices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentInvoices = invoices.slice(startIndex, endIndex);

    return (
        <Container fluid className="px-4 py-4">
            <Helmet>
                <title>Tuition & Billing | Dawn LMS</title>
                <meta name="description" content="View and pay your semester tuition invoices." />
            </Helmet>

            {/* Header */}
            <div className="d-flex align-items-center mb-4">
                <div className="bg-success bg-opacity-10 p-3 rounded-3 me-3">
                    <i className="bi bi-credit-card text-success" style={{ fontSize: '24px' }}></i>
                </div>
                <div>
                    <h3 className="fw-bolder mb-0">Tuition & Billing</h3>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>View and pay your semester invoices via eSewa or Khalti.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <Row className="g-3 mb-4">
                <Col sm={6} lg={4}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Body className="p-4 d-flex align-items-center">
                            <div className="bg-danger bg-opacity-10 p-3 rounded-circle me-3">
                                <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '22px' }}></i>
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Total Due</div>
                                <div className="fw-bolder fs-4 text-danger" style={{ lineHeight: 1 }}>Rs. {totalDue.toLocaleString()}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} lg={4}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Body className="p-4 d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                                <i className="bi bi-check-circle text-success" style={{ fontSize: '22px' }}></i>
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Total Paid</div>
                                <div className="fw-bolder fs-4 text-success" style={{ lineHeight: 1 }}>Rs. {totalPaid.toLocaleString()}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} lg={4}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Body className="p-4 d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                                <i className="bi bi-receipt text-primary" style={{ fontSize: '22px' }}></i>
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Total Invoices</div>
                                <div className="fw-bolder fs-4 text-primary" style={{ lineHeight: 1 }}>{invoices.length}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Invoice Table */}
            <Card className="border-0 shadow-sm rounded-4">
                <Card.Header className="bg-body border-0 pt-4 pb-2 px-4">
                    <h5 className="fw-bold mb-0">Semester Invoices</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    {invoices.length === 0 ? (
                        <div className="text-center p-5 opacity-50">
                            <i className="bi bi-receipt text-muted mb-3" style={{ fontSize: '48px' }}></i>
                            <h5 className="fw-bold text-muted">No Invoices Yet</h5>
                            <p className="text-muted small">Your semester tuition invoices will appear here.</p>
                        </div>
                    ) : (
                        <Table responsive hover className="align-middle mb-0">
                            <thead className="bg-body-tertiary">
                                <tr>
                                    <th className="px-4 py-3 text-muted small text-uppercase">Description</th>
                                    <th className="py-3 text-muted small text-uppercase text-end">Amount</th>
                                    <th className="py-3 text-muted small text-uppercase text-center">Due Date</th>
                                    <th className="py-3 text-muted small text-uppercase text-center">Status</th>
                                    <th className="py-3 text-muted small text-uppercase text-center px-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentInvoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="px-4">
                                            <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>{inv.description}</h6>
                                            {inv.eSewaTransactionId && (
                                                <small className="text-muted">Ref: {inv.eSewaTransactionId.substring(0, 12)}...</small>
                                            )}
                                        </td>
                                        <td className="text-end fw-bold">Rs. {inv.amountNpr.toLocaleString()}</td>
                                        <td className="text-center">
                                            <small className="text-muted">{new Date(inv.dueDate).toLocaleDateString()}</small>
                                        </td>
                                        <td className="text-center">
                                            {inv.isPaid ? (
                                                <Badge bg="success" className="px-3 py-2 rounded-pill">
                                                    <i className="bi bi-check-circle me-1" style={{ fontSize: '12px' }}></i> Paid
                                                </Badge>
                                            ) : new Date(inv.dueDate) < new Date() ? (
                                                <Badge bg="danger" className="px-3 py-2 rounded-pill">
                                                    <i className="bi bi-exclamation-triangle me-1" style={{ fontSize: '12px' }}></i> Overdue
                                                </Badge>
                                            ) : (
                                                <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill">
                                                    <i className="bi bi-clock me-1" style={{ fontSize: '12px' }}></i> Pending
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="text-center px-4">
                                            {inv.isPaid ? (
                                                <span className="text-muted small">
                                                    {inv.paidAt && `Paid ${new Date(inv.paidAt).toLocaleDateString()}`}
                                                </span>
                                            ) : (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="fw-bold rounded-3 px-3"
                                                    onClick={() => { setSelectedInvoice(inv); setShowPayModal(true); }}
                                                >
                                                    Pay Now
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
                {totalPages > 1 && (
                    <Card.Footer className="bg-body border-0 py-3">
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                            <Button 
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <i className="bi bi-chevron-left"></i> Previous
                            </Button>
                            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button 
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next <i className="bi bi-chevron-right"></i>
                            </Button>
                        </div>
                    </Card.Footer>
                )}
            </Card>

            {/* Payment Gateway Modal */}
            <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bolder fs-5">Choose Payment Method</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    {selectedInvoice && (
                        <>
                            <p className="text-muted mb-3">
                                Paying <strong>Rs. {selectedInvoice.amountNpr?.toLocaleString()}</strong> for <strong>{selectedInvoice.description}</strong>
                            </p>
                            <div className="d-grid gap-2">
                                <Button
                                    variant="success"
                                    size="lg"
                                    className="fw-bold rounded-3"
                                    onClick={() => handlePay(selectedInvoice, 'esewa')}
                                    disabled={payMutation.isPending}
                                >
                                    {payMutation.isPending ? <Spinner size="sm" className="me-2" /> : null}
                                    Pay with eSewa
                                </Button>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="fw-bold rounded-3"
                                    onClick={() => handlePay(selectedInvoice, 'khalti')}
                                    disabled={payMutation.isPending}
                                >
                                    {payMutation.isPending ? <Spinner size="sm" className="me-2" /> : null}
                                    Pay with Khalti
                                </Button>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default MyTuition;
