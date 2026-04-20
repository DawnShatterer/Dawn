import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Card, Table, Badge, Spinner, Row, Col, Button, Modal, Form, Alert } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { toast } from 'react-toastify';

const AdminInvoices = () => {
    const [page, setPage] = useState(1);
    const [filterPaid, setFilterPaid] = useState('all');
    const [filterBatch, setFilterBatch] = useState('');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    
    // Generate invoice form state
    const [generateType, setGenerateType] = useState('batch'); // 'batch' or 'student'
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [invoiceDescription, setInvoiceDescription] = useState('');
    const [invoiceAmount, setInvoiceAmount] = useState('60000');
    const [invoiceDueDate, setInvoiceDueDate] = useState('');

    const queryClient = useQueryClient();

    // Fetch invoices
    const { data: invoicesData, isLoading } = useQuery({
        queryKey: ['admin-invoices', page, filterPaid, filterBatch],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });
            
            if (filterPaid !== 'all') {
                params.append('isPaid', filterPaid === 'paid' ? 'true' : 'false');
            }
            
            if (filterBatch) {
                params.append('batchId', filterBatch);
            }
            
            const res = await api.get(`/Tuition/all?${params.toString()}`);
            return res.data;
        }
    });

    // Fetch batches for filters and generation
    const { data: batches } = useQuery({
        queryKey: ['batches-all'],
        queryFn: async () => {
            const res = await api.get('/Batch/all');
            return res.data;
        }
    });

    // Fetch students for individual invoice generation
    const { data: students } = useQuery({
        queryKey: ['students-all'],
        queryFn: async () => {
            const res = await api.get('/Auth/all-users?roles=Student');
            return res.data;
        },
        enabled: generateType === 'student'
    });

    // Generate invoice mutation
    const generateMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/Tuition/generate', data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Invoices generated successfully!');
            queryClient.invalidateQueries(['admin-invoices']);
            setShowGenerateModal(false);
            resetGenerateForm();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to generate invoices');
        }
    });

    // Mark as paid mutation
    const markPaidMutation = useMutation({
        mutationFn: async (invoiceId) => {
            const res = await api.put(`/Tuition/mark-paid/${invoiceId}`);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Invoice marked as paid!');
            queryClient.invalidateQueries(['admin-invoices']);
            setShowMarkPaidModal(false);
            setSelectedInvoice(null);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to mark invoice as paid');
        }
    });

    const resetGenerateForm = () => {
        setGenerateType('batch');
        setSelectedBatchId('');
        setSelectedStudentId('');
        setInvoiceDescription('');
        setInvoiceAmount('60000');
        setInvoiceDueDate('');
    };

    const handleGenerateInvoice = () => {
        if (!invoiceDescription || !invoiceAmount || !invoiceDueDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        const payload = {
            description: invoiceDescription,
            amountNpr: parseFloat(invoiceAmount),
            dueDate: new Date(invoiceDueDate).toISOString()
        };

        if (generateType === 'batch') {
            if (!selectedBatchId) {
                toast.error('Please select a batch');
                return;
            }
            payload.batchId = parseInt(selectedBatchId);
        } else {
            if (!selectedStudentId) {
                toast.error('Please select a student');
                return;
            }
            payload.studentId = selectedStudentId;
        }

        generateMutation.mutate(payload);
    };

    const handleExportCSV = () => {
        if (!invoicesData?.invoices || invoicesData.invoices.length === 0) {
            toast.error('No invoices to export');
            return;
        }

        const csvContent = "data:text/csv;charset=utf-8," 
            + "Student Name,Student Email,Batch,Description,Amount (NPR),Due Date,Status,Paid At,Transaction ID\n"
            + invoicesData.invoices.map(inv => 
                `"${inv.studentName}","${inv.studentEmail}","${inv.batchId || 'N/A'}","${inv.description}",${inv.amountNpr},"${new Date(inv.dueDate).toLocaleDateString()}","${inv.isPaid ? 'Paid' : 'Unpaid'}","${inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : 'N/A'}","${inv.eSewaTransactionId || 'N/A'}"`
            ).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `invoices_export_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV exported successfully!');
    };

    const invoices = invoicesData?.invoices || [];
    const totalPages = Math.ceil((invoicesData?.total || 0) / 20);

    if (isLoading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading invoices...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="px-4 py-4">
            <Helmet>
                <title>Invoice Management | Dawn LMS</title>
                <meta name="description" content="Manage student tuition invoices" />
            </Helmet>

            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 p-3 rounded-3 me-3">
                        <i className="bi bi-receipt text-success" style={{ fontSize: '24px' }}></i>
                    </div>
                    <div>
                        <h3 className="fw-bolder mb-0">Invoice Management</h3>
                        <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Generate and manage student tuition invoices</p>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={handleExportCSV}>
                        <i className="bi bi-download me-2"></i>Export CSV
                    </Button>
                    <Button variant="primary" onClick={() => setShowGenerateModal(true)}>
                        <i className="bi bi-plus-circle me-2"></i>Generate Invoice
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Body className="p-4">
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Label className="fw-semibold small">Payment Status</Form.Label>
                            <Form.Select value={filterPaid} onChange={(e) => { setFilterPaid(e.target.value); setPage(1); }}>
                                <option value="all">All Invoices</option>
                                <option value="paid">Paid Only</option>
                                <option value="unpaid">Unpaid Only</option>
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Label className="fw-semibold small">Batch</Form.Label>
                            <Form.Select value={filterBatch} onChange={(e) => { setFilterBatch(e.target.value); setPage(1); }}>
                                <option value="">All Batches</option>
                                {batches?.map(batch => (
                                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4} className="d-flex align-items-end">
                            <Button variant="outline-secondary" className="w-100" onClick={() => { setFilterPaid('all'); setFilterBatch(''); setPage(1); }}>
                                <i className="bi bi-arrow-clockwise me-2"></i>Reset Filters
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Invoice Table */}
            <Card className="border-0 shadow-sm rounded-4">
                <Card.Header className="bg-body border-0 pt-4 pb-2 px-4">
                    <h5 className="fw-bold mb-0">All Invoices ({invoicesData?.total || 0})</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    {invoices.length === 0 ? (
                        <div className="text-center p-5 opacity-50">
                            <i className="bi bi-receipt text-muted mb-3" style={{ fontSize: '48px' }}></i>
                            <h5 className="fw-bold text-muted">No Invoices Found</h5>
                            <p className="text-muted small">Generate invoices to get started</p>
                        </div>
                    ) : (
                        <>
                            <Table responsive hover className="align-middle mb-0">
                                <thead className="bg-body-tertiary">
                                    <tr>
                                        <th className="px-4 py-3 text-muted small text-uppercase">Student</th>
                                        <th className="py-3 text-muted small text-uppercase">Description</th>
                                        <th className="py-3 text-muted small text-uppercase text-end">Amount</th>
                                        <th className="py-3 text-muted small text-uppercase text-center">Due Date</th>
                                        <th className="py-3 text-muted small text-uppercase text-center">Status</th>
                                        <th className="py-3 text-muted small text-uppercase text-center px-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((inv) => (
                                        <tr key={inv.id}>
                                            <td className="px-4">
                                                <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>{inv.studentName}</h6>
                                                <small className="text-muted">{inv.studentEmail}</small>
                                            </td>
                                            <td>
                                                <span className="fw-semibold">{inv.description}</span>
                                                {inv.eSewaTransactionId && (
                                                    <><br /><small className="text-muted">Ref: {inv.eSewaTransactionId.substring(0, 12)}...</small></>
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
                                                        variant="outline-success"
                                                        size="sm"
                                                        className="fw-bold rounded-3"
                                                        onClick={() => { setSelectedInvoice(inv); setShowMarkPaidModal(true); }}
                                                    >
                                                        Mark Paid
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center align-items-center gap-2 p-4 border-top">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        <i className="bi bi-chevron-left"></i>
                                    </Button>
                                    <span className="text-muted small">
                                        Page {page} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        disabled={page === totalPages}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        <i className="bi bi-chevron-right"></i>
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Generate Invoice Modal */}
            <Modal show={showGenerateModal} onHide={() => { setShowGenerateModal(false); resetGenerateForm(); }} size="lg" centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bolder fs-5">Generate New Invoice</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Invoice Type</Form.Label>
                            <div className="d-flex gap-3">
                                <Form.Check
                                    type="radio"
                                    id="type-batch"
                                    label="Batch Invoice (Multiple Students)"
                                    checked={generateType === 'batch'}
                                    onChange={() => setGenerateType('batch')}
                                />
                                <Form.Check
                                    type="radio"
                                    id="type-student"
                                    label="Individual Student"
                                    checked={generateType === 'student'}
                                    onChange={() => setGenerateType('student')}
                                />
                            </div>
                        </Form.Group>

                        {generateType === 'batch' ? (
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Select Batch <span className="text-danger">*</span></Form.Label>
                                <Form.Select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} required>
                                    <option value="">Choose a batch...</option>
                                    {batches?.map(batch => (
                                        <option key={batch.id} value={batch.id}>{batch.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        ) : (
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Select Student <span className="text-danger">*</span></Form.Label>
                                <Form.Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} required>
                                    <option value="">Choose a student...</option>
                                    {students?.map(student => (
                                        <option key={student.id} value={student.id}>{student.fullName} ({student.email})</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Description <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., Semester 1 Tuition Fee"
                                value={invoiceDescription}
                                onChange={(e) => setInvoiceDescription(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">Amount (NPR) <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="60000"
                                        value={invoiceAmount}
                                        onChange={(e) => setInvoiceAmount(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">Due Date <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={invoiceDueDate}
                                        onChange={(e) => setInvoiceDueDate(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Alert variant="info" className="small">
                            <i className="bi bi-info-circle me-2"></i>
                            {generateType === 'batch' 
                                ? 'This will generate invoices for all students in the selected batch. Duplicate invoices (same description) will be skipped.'
                                : 'This will generate an invoice for the selected student. Duplicate invoices (same description) will be skipped.'}
                        </Alert>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={() => { setShowGenerateModal(false); resetGenerateForm(); }}>
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleGenerateInvoice}
                        disabled={generateMutation.isPending}
                    >
                        {generateMutation.isPending ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-plus-circle me-2"></i>}
                        Generate Invoice
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Mark as Paid Modal */}
            <Modal show={showMarkPaidModal} onHide={() => { setShowMarkPaidModal(false); setSelectedInvoice(null); }} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bolder fs-5">Mark Invoice as Paid</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    {selectedInvoice && (
                        <>
                            <p className="text-muted mb-3">
                                Are you sure you want to mark this invoice as paid?
                            </p>
                            <div className="bg-body-tertiary p-3 rounded-3">
                                <div className="mb-2"><strong>Student:</strong> {selectedInvoice.studentName}</div>
                                <div className="mb-2"><strong>Description:</strong> {selectedInvoice.description}</div>
                                <div><strong>Amount:</strong> Rs. {selectedInvoice.amountNpr.toLocaleString()}</div>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={() => { setShowMarkPaidModal(false); setSelectedInvoice(null); }}>
                        Cancel
                    </Button>
                    <Button 
                        variant="success" 
                        onClick={() => markPaidMutation.mutate(selectedInvoice.id)}
                        disabled={markPaidMutation.isPending}
                    >
                        {markPaidMutation.isPending ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-check-circle me-2"></i>}
                        Mark as Paid
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminInvoices;
