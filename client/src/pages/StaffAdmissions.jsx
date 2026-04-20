import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Spinner, Badge, Tab, Nav, Alert } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';

const StaffAdmissions = () => {
    return (
        <Container fluid className="px-4 py-4 h-100">
            <Helmet>
                <title>Staff Operations | Dawn</title>
            </Helmet>

            <div className="d-flex align-items-center mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                    <i className="bi bi-people text-primary" style={{ fontSize: '24px' }}></i>
                </div>
                <div>
                    <h3 className="fw-bolder mb-0">Staff Operations</h3>
                    <p className="text-muted mb-0">Admissions, batches, and tuition management.</p>
                </div>
            </div>

            <Tab.Container defaultActiveKey="admissions">
                <Card className="border-0 shadow-sm overflow-hidden mb-4 rounded-4">
                    <Card.Header className="bg-body border-bottom pt-3 pb-0 px-4">
                        <Nav variant="tabs" className="border-bottom-0 gap-3">
                            <Nav.Item>
                                <Nav.Link eventKey="admissions" className="fw-bold px-4 py-3 border-0 border-bottom border-3 border-opacity-50">Bulk Admissions</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="batches" className="fw-bold px-4 py-3 border-0 border-bottom border-3 border-opacity-50">Batch Management</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="tuition" className="fw-bold px-4 py-3 border-0 border-bottom border-3 border-opacity-50">Tuition Invoices</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="modules" className="fw-bold px-4 py-3 border-0 border-bottom border-3 border-opacity-50">Module Assignment</Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Card.Header>
                    <Card.Body className="p-0 bg-body-secondary" style={{ minHeight: '500px' }}>
                        <Tab.Content>
                            <Tab.Pane eventKey="admissions">
                                <div className="p-4">
                                    <AdmissionsGenerator />
                                </div>
                            </Tab.Pane>
                            <Tab.Pane eventKey="batches">
                                <div className="p-4">
                                    <BatchManagement />
                                </div>
                            </Tab.Pane>
                            <Tab.Pane eventKey="tuition">
                                <div className="p-4">
                                    <TuitionManagement />
                                </div>
                            </Tab.Pane>
                            <Tab.Pane eventKey="modules">
                                <div className="p-4">
                                    <ModuleAssignment />
                                </div>
                            </Tab.Pane>
                        </Tab.Content>
                    </Card.Body>
                </Card>
            </Tab.Container>
        </Container>
    );
};

export default StaffAdmissions;

// ══════════════════════════════════════════
// ══════ ADMISSIONS GENERATOR ══════════════
// ══════════════════════════════════════════

const AdmissionsGenerator = () => {
    const queryClient = useQueryClient();
    const [namesInput, setNamesInput] = useState('');
    const [batchId, setBatchId] = useState('');
    const [generateInvoice, setGenerateInvoice] = useState(false);
    const [invoiceAmount, setInvoiceAmount] = useState('60000');
    
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [nameCount, setNameCount] = useState(0);
    const [validationWarnings, setValidationWarnings] = useState([]);

    const { data: batches, isLoading: isBatchesLoading } = useQuery({
        queryKey: ['batches-all'],
        queryFn: async () => {
            const response = await api.get('/Batch/all');
            return response.data;
        },
        staleTime: 30000, // 30 seconds
        refetchOnWindowFocus: true
    });

    // Real-time validation as user types
    const handleNamesChange = (e) => {
        const value = e.target.value;
        setNamesInput(value);
        
        const lines = value.split('\n');
        const validNames = [];
        const warnings = [];
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.length === 0) return;
            
            const parts = trimmed.split(' ').filter(p => p.length > 0);
            
            if (parts.length < 2) {
                warnings.push({ line: index + 1, message: 'Missing last name', name: trimmed });
            } else if (parts.length > 3) {
                warnings.push({ line: index + 1, message: 'Possible multiple names', name: trimmed });
            } else if (parts.some(p => p.length < 2)) {
                warnings.push({ line: index + 1, message: 'Name part too short', name: trimmed });
            } else {
                validNames.push(trimmed);
            }
        });
        
        setNameCount(validNames.length);
        setValidationWarnings(warnings);
    };

    // Auto-format names: split multi-name lines, capitalize, remove extra spaces
    const autoFormatNames = () => {
        const lines = namesInput.split('\n');
        const formatted = [];
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.length === 0) return;
            
            const parts = trimmed.split(' ').filter(p => p.length > 0);
            
            // If more than 3 parts, try to split into multiple names
            if (parts.length > 3) {
                // Assume every 2 parts is a name (First Last)
                for (let i = 0; i < parts.length; i += 2) {
                    if (i + 1 < parts.length) {
                        const firstName = parts[i].charAt(0).toUpperCase() + parts[i].slice(1).toLowerCase();
                        const lastName = parts[i + 1].charAt(0).toUpperCase() + parts[i + 1].slice(1).toLowerCase();
                        formatted.push(`${firstName} ${lastName}`);
                    }
                }
            } else if (parts.length >= 2) {
                // Capitalize each part
                const capitalized = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
                formatted.push(capitalized.join(' '));
            }
        });
        
        setNamesInput(formatted.join('\n'));
    };

    // Add example names for testing
    const addExampleNames = () => {
        const examples = [
            'Aayush Sharma',
            'Binita Tamang',
            'Rajesh Kumar',
            'Priya Thapa',
            'Suman Gurung'
        ];
        setNamesInput(examples.join('\n'));
    };

    // Clear all names
    const clearAllNames = () => {
        if (namesInput.trim().length > 0) {
            if (window.confirm('Are you sure you want to clear all names?')) {
                setNamesInput('');
                setNameCount(0);
                setValidationWarnings([]);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        
        const names = namesInput
            .split('\n')
            .map(n => n.trim())
            .filter(n => n.length > 0);

        if (names.length === 0) {
            setError('Please enter at least one student name.');
            return;
        }

        // Validate that a batch is selected
        if (!batchId || batchId === '') {
            setError('Please select a target academic batch. All students must be assigned to a batch.');
            return;
        }

        // Validate that each name has at least a space (first and last name)
        const invalidNames = names.filter(name => !name.includes(' ') || name.split(' ').filter(part => part.length > 0).length < 2);
        
        if (invalidNames.length > 0) {
            setError(`Invalid name format detected. Each name must have at least a first and last name separated by a space.\n\nInvalid entries:\n${invalidNames.map(n => `• "${n}"`).join('\n')}`);
            return;
        }

        // Additional validation: check for names that are too short
        const tooShortNames = names.filter(name => {
            const parts = name.split(' ').filter(part => part.length > 0);
            return parts.some(part => part.length < 2);
        });

        if (tooShortNames.length > 0) {
            setError(`Some names have parts that are too short (minimum 2 characters per name part).\n\nInvalid entries:\n${tooShortNames.map(n => `• "${n}"`).join('\n')}`);
            return;
        }

        // Check for potential multiple names on same line (more than 3 name parts suggests multiple people)
        const potentialMultipleNames = names.filter(name => {
            const parts = name.split(' ').filter(part => part.length > 0);
            return parts.length > 3;
        });

        if (potentialMultipleNames.length > 0) {
            setError(`Possible multiple names detected on a single line. Each line should contain only ONE person's name.\n\nPlease check these entries:\n${potentialMultipleNames.map(n => `• "${n}"`).join('\n')}\n\nIf this is a single person with a long name, you can ignore this warning and try again.`);
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                studentNames: names,
                batchId: batchId ? parseInt(batchId) : null,
                generateInvoice: generateInvoice,
                invoiceAmountNpr: parseFloat(invoiceAmount) || 0
            };

            const response = await api.post('/Auth/bulk-register', payload);
            setResults(response.data);
            setNamesInput('');
            setNameCount(0);
            setValidationWarnings([]);
            
            // Invalidate related queries to refresh other tabs
            queryClient.invalidateQueries(['batches-all']);
            queryClient.invalidateQueries(['admin-invoices']);
            queryClient.invalidateQueries(['courses-all']);
            
            // Show success message
            setSuccessMessage(`Successfully created ${response.data.details?.filter(d => d.status === 'Success').length || 0} student accounts. Other tabs have been refreshed.`);
            
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete batch generation.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        if (!results || !results.details) return;
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Name,Email,Temporary Password,Status\n"
            + results.details.map(r => `${r.name},${r.email || ''},dawnuser1090,${r.status || 'Failed'}`).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `dawn_batch_export_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Row className="g-4">
            <Col lg={4}>
                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Header className="bg-body border-0 pt-4 pb-0 px-4">
                        <h5 className="fw-bold mb-0 d-flex align-items-center">
                            <i className="bi bi-person-plus me-2 text-primary" style={{ fontSize: '18px' }}></i>
                            Batch Account Generator
                        </h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                        {successMessage && (
                            <div className="alert alert-success py-2 border-0 rounded-3 mb-3 d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                                <i className="bi bi-check-circle-fill me-2"></i>
                                {successMessage}
                            </div>
                        )}
                        {error && (
                            <div className="alert alert-danger py-2 border-0 rounded-3 mb-3" style={{ fontSize: '0.85rem', whiteSpace: 'pre-line' }}>
                                {error}
                            </div>
                        )}
                        
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-2">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Form.Label className="fw-semibold text-muted small mb-0">Student Full Names</Form.Label>
                                    <div className="d-flex gap-2">
                                        <Button 
                                            variant="link" 
                                            size="sm" 
                                            className="text-decoration-none p-0 text-primary fw-semibold" 
                                            style={{ fontSize: '0.75rem' }}
                                            onClick={addExampleNames}
                                            type="button"
                                        >
                                            <i className="bi bi-plus-circle me-1"></i>Add Examples
                                        </Button>
                                        <Button 
                                            variant="link" 
                                            size="sm" 
                                            className="text-decoration-none p-0 text-danger fw-semibold" 
                                            style={{ fontSize: '0.75rem' }}
                                            onClick={clearAllNames}
                                            type="button"
                                        >
                                            <i className="bi bi-x-circle me-1"></i>Clear All
                                        </Button>
                                    </div>
                                </div>
                                <Form.Control 
                                    as="textarea" 
                                    rows={8} 
                                    placeholder="Enter one full name per line (First Last)...&#10;e.g.&#10;Aayush Sharma&#10;Binita Tamang&#10;Rajesh Kumar"
                                    value={namesInput}
                                    onChange={handleNamesChange}
                                    className={`bg-body border rounded-3 ${validationWarnings.length > 0 ? 'border-warning' : nameCount > 0 ? 'border-success' : ''}`}
                                    style={{ fontSize: '0.9rem' }}
                                />
                                <div className="d-flex justify-content-between align-items-center mt-2">
                                    <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        Each name must include first and last name separated by a space.
                                    </Form.Text>
                                    {nameCount > 0 && (
                                        <Badge bg={validationWarnings.length > 0 ? 'warning' : 'success'} className="d-flex align-items-center">
                                            <i className={`bi ${validationWarnings.length > 0 ? 'bi-exclamation-triangle' : 'bi-check-circle'} me-1`}></i>
                                            {nameCount} {nameCount === 1 ? 'name' : 'names'} detected
                                        </Badge>
                                    )}
                                </div>
                                {validationWarnings.length > 0 && (
                                    <div className="mt-2">
                                        <Alert variant="warning" className="py-2 px-3 mb-0" style={{ fontSize: '0.75rem' }}>
                                            <div className="fw-bold mb-1"><i className="bi bi-exclamation-triangle me-1"></i>Validation Warnings:</div>
                                            <ul className="mb-0 ps-3">
                                                {validationWarnings.slice(0, 3).map((w, idx) => (
                                                    <li key={idx}>Line {w.line}: {w.message} - "{w.name}"</li>
                                                ))}
                                                {validationWarnings.length > 3 && (
                                                    <li className="text-muted">...and {validationWarnings.length - 3} more</li>
                                                )}
                                            </ul>
                                            <Button 
                                                variant="warning" 
                                                size="sm" 
                                                className="mt-2 fw-bold" 
                                                onClick={autoFormatNames}
                                                type="button"
                                            >
                                                <i className="bi bi-magic me-1"></i>Auto-Fix Names
                                            </Button>
                                        </Alert>
                                    </div>
                                )}
                            </Form.Group>

                            <Row className="g-3 mb-3">
                                <Col xs={12}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted small">
                                            Target Academic Batch <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Select 
                                            value={batchId}
                                            onChange={(e) => setBatchId(e.target.value)}
                                            className={`border rounded-3 ${!batchId ? 'border-danger' : ''}`}
                                            disabled={isBatchesLoading}
                                            required
                                        >
                                            <option value="">-- Select a batch (required) --</option>
                                            {batches?.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </Form.Select>
                                        <Form.Text className="text-danger" style={{ fontSize: '0.75rem' }}>
                                            All students must be assigned to a batch during creation.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="p-3 bg-body-secondary rounded-3 mb-4 border border-secondary border-opacity-10">
                                <Form.Check 
                                    type="switch"
                                    id="invoice-switch"
                                    label={<span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Generate Auto-Invoice</span>}
                                    checked={generateInvoice}
                                    onChange={(e) => setGenerateInvoice(e.target.checked)}
                                />
                                {generateInvoice && (
                                    <div className="mt-3">
                                        <Form.Label className="fw-semibold text-muted" style={{ fontSize: '0.75rem' }}>Semester Tuition Amount (NPR)</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            value={invoiceAmount}
                                            onChange={(e) => setInvoiceAmount(e.target.value)}
                                            className="border rounded-2"
                                            style={{ fontSize: '0.85rem' }}
                                        />
                                    </div>
                                )}
                            </div>

                            <Button 
                                type="submit" 
                                variant="primary" 
                                className="w-100 py-3 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                                disabled={isLoading}
                            >
                                {isLoading ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-people me-2" style={{ fontSize: '18px' }}></i>}
                                {isLoading ? 'Generating Accounts...' : 'Generate Accounts'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>

            <Col lg={8}>
                {results ? (
                    <Card className="border-0 shadow-sm rounded-4 h-100 bg-body">
                        <Card.Header className="bg-body border-0 pt-4 pb-3 px-4 d-flex justify-content-between align-items-center border-bottom">
                            <div>
                                <h5 className="fw-bold mb-1">Generation Results</h5>
                                <p className="text-muted small mb-0">{results.message}</p>
                            </div>
                            <Button variant="light" size="sm" className="fw-bold text-success border d-flex align-items-center" onClick={handleExport}>
                                <i className="bi bi-download me-2" style={{ fontSize: '14px' }}></i> Export CSV
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover responsive className="mb-0 align-middle">
                                <thead className="bg-body-tertiary">
                                    <tr>
                                        <th className="px-4 py-3 text-muted small text-uppercase">Status</th>
                                        <th className="py-3 text-muted small text-uppercase">Student Name</th>
                                        <th className="py-3 text-muted small text-uppercase">Generated Email</th>
                                        <th className="py-3 text-muted small text-uppercase">Temp Password</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.details.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4">
                                                {row.status === 'Success' ? (
                                                    <Badge bg="success" className="d-inline-flex align-items-center fw-normal rounded-pill px-2 py-1">
                                                        <i className="bi bi-check-circle me-1" style={{ fontSize: '12px' }}></i> Success
                                                    </Badge>
                                                ) : (
                                                    <Badge bg="danger" className="d-inline-flex align-items-center fw-normal rounded-pill px-2 py-1">
                                                        <i className="bi bi-exclamation-triangle me-1" style={{ fontSize: '12px' }}></i> Error
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="fw-medium">{row.name}</td>
                                            <td>
                                                {row.email ? (
                                                    <span className="text-primary" style={{ fontFamily: 'monospace' }}>{row.email}</span>
                                                ) : (
                                                    <span className="text-danger small">{JSON.stringify(row.errors)}</span>
                                                )}
                                            </td>
                                            <td>
                                                {row.status === 'Success' && <span className="bg-body-secondary px-2 py-1 rounded border" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>dawnuser1090</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                ) : (
                    <Card className="border-0 shadow-sm rounded-4 h-100 bg-body">
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-5 opacity-50">
                            <i className="bi bi-file-text mb-3" style={{ fontSize: '48px' }}></i>
                            <h5 className="fw-bold">Awaiting Batch Generation</h5>
                            <p className="text-muted small" style={{ maxWidth: '300px' }}>Enter a list of student names on the left to automatically generate their institutional email addresses and records.</p>
                        </Card.Body>
                    </Card>
                )}
            </Col>
        </Row>
    );
};

// ══════════════════════════════════════════
// ══════ TUITION MANAGEMENT ════════════════
// ══════════════════════════════════════════

const TuitionManagement = () => {
    const queryClient = useQueryClient();
    const [filterBatch, setFilterBatch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [feedback, setFeedback] = useState(null);

    const { data: batches } = useQuery({
        queryKey: ['batches-all'],
        queryFn: async () => {
            const response = await api.get('/Batch/all');
            return response.data;
        },
        staleTime: 30000,
        refetchOnWindowFocus: true
    });

    const { data: invoicesData, isLoading } = useQuery({
        queryKey: ['admin-invoices', filterBatch, filterStatus],
        queryFn: async () => {
            let url = '/Tuition/all?limit=50';
            if (filterBatch) url += `&batchId=${filterBatch}`;
            if (filterStatus) url += `&isPaid=${filterStatus === 'paid'}`;
            const res = await api.get(url);
            return res.data;
        },
        staleTime: 30000,
        refetchOnWindowFocus: true
    });

    const markPaidMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.put(`/Tuition/mark-paid/${id}`);
            return res.data;
        },
        onSuccess: (data) => {
            setFeedback({ type: 'success', msg: data.message });
            queryClient.invalidateQueries(['admin-invoices']);
        },
        onError: (err) => {
            setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Update failed.' });
        }
    });

    const invoices = invoicesData?.invoices || [];

    return (
        <Card className="border-0 shadow-sm rounded-4 bg-body">
            <Card.Header className="bg-body border-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <h5 className="fw-bold mb-0 d-flex align-items-center">
                    <i className="bi bi-receipt me-2 text-success" style={{ fontSize: '18px' }}></i> Tuition Invoices
                </h5>
                <div className="d-flex gap-2">
                    <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="d-flex align-items-center"
                        onClick={() => queryClient.invalidateQueries(['admin-invoices'])}
                    >
                        <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                    </Button>
                    <Form.Select size="sm" value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="border-0 fw-medium">
                        <option value="">All Batches</option>
                        {batches?.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </Form.Select>
                    <Form.Select size="sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border-0 fw-medium">
                        <option value="">All Statuses</option>
                        <option value="paid">Paid Only</option>
                        <option value="unpaid">Unpaid Only</option>
                    </Form.Select>
                </div>
            </Card.Header>
            <Card.Body className="p-4">
                {feedback && <Alert variant={feedback.type} className="py-2 small" dismissible onClose={() => setFeedback(null)}>{feedback.msg}</Alert>}
                
                {isLoading ? (
                    <div className="text-center py-5"><Spinner /></div>
                ) : invoices.length === 0 ? (
                    <Alert variant="info" className="text-center py-4">No tuition invoices found for this criteria.</Alert>
                ) : (
                    <Table responsive hover className="align-middle">
                        <thead className="bg-body-tertiary">
                            <tr>
                                <th className="small text-muted fw-bold">Student</th>
                                <th className="small text-muted fw-bold">Description</th>
                                <th className="small text-muted fw-bold">Amount</th>
                                <th className="small text-muted fw-bold">Due Date</th>
                                <th className="small text-muted fw-bold">Status</th>
                                <th className="small text-muted fw-bold text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td>
                                        <div className="fw-medium">{inv.studentName}</div>
                                        <code className="small text-muted">{inv.studentEmail}</code>
                                    </td>
                                    <td>{inv.description}</td>
                                    <td className="fw-bold">Rs. {inv.amountNpr.toLocaleString()}</td>
                                    <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                                    <td>
                                        {inv.isPaid ? (
                                            <Badge bg="success" className="px-2 py-1 fw-normal d-flex align-items-center w-max-content">
                                                <i className="bi bi-check-circle me-1" style={{ fontSize: '12px' }}></i> Paid
                                            </Badge>
                                        ) : (
                                            <Badge bg="warning" text="dark" className="px-2 py-1 fw-normal d-flex align-items-center w-max-content">
                                                <i className="bi bi-exclamation-triangle me-1" style={{ fontSize: '12px' }}></i> Unpaid
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="text-end">
                                        {!inv.isPaid && (
                                            <Button 
                                                variant="outline-success" 
                                                size="sm" 
                                                className="fw-bold"
                                                disabled={markPaidMutation.isPending}
                                                onClick={() => {
                                                    if(window.confirm(`Confirm payment received for ${inv.studentName}?`)) {
                                                        markPaidMutation.mutate(inv.id);
                                                    }
                                                }}
                                            >
                                                Mark as Paid
                                            </Button>
                                        )}
                                        {inv.isPaid && inv.paidAt && (
                                            <span className="text-muted small">Paid: {new Date(inv.paidAt).toLocaleDateString()}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Card.Body>
        </Card>
    );
};

// ══════════════════════════════════════════
// ══════ BATCH MANAGEMENT ══════════════════
// ══════════════════════════════════════════

const BatchManagement = () => {
    const queryClient = useQueryClient();
    const [batchName, setBatchName] = useState('');
    const [batchDescription, setBatchDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [graduationDate, setGraduationDate] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { data: batches, isLoading: isBatchesLoading } = useQuery({
        queryKey: ['batches-all'],
        queryFn: async () => {
            const response = await api.get('/Batch/all');
            return response.data;
        },
        staleTime: 30000,
        refetchOnWindowFocus: true
    });

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!batchName.trim()) {
            setError('Batch name is required.');
            return;
        }

        if (!startDate) {
            setError('Start date is required.');
            return;
        }

        if (!graduationDate) {
            setError('Expected graduation date is required.');
            return;
        }

        // Validate that graduation date is after start date
        if (new Date(graduationDate) <= new Date(startDate)) {
            setError('Graduation date must be after the start date.');
            return;
        }

        setIsCreating(true);
        try {
            const payload = {
                name: batchName.trim(),
                description: batchDescription.trim() || '',
                startDate: new Date(startDate).toISOString(),
                expectedGraduationDate: new Date(graduationDate).toISOString()
            };

            await api.post('/Batch/create', payload);
            
            // Clear form
            setBatchName('');
            setBatchDescription('');
            setStartDate('');
            setGraduationDate('');
            
            // Refresh batch list
            queryClient.invalidateQueries(['batches-all']);
            
            setSuccessMessage('Batch created successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create batch.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Row className="g-4">
            <Col lg={5}>
                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Header className="bg-body border-0 pt-4 pb-0 px-4">
                        <h5 className="fw-bold mb-0 d-flex align-items-center">
                            <i className="bi bi-calendar-plus me-2 text-success" style={{ fontSize: '18px' }}></i>
                            Create New Batch
                        </h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                        {successMessage && (
                            <div className="alert alert-success py-2 border-0 rounded-3 mb-3 d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                                <i className="bi bi-check-circle-fill me-2"></i>
                                {successMessage}
                            </div>
                        )}
                        {error && (
                            <div className="alert alert-danger py-2 border-0 rounded-3 mb-3" style={{ fontSize: '0.85rem', whiteSpace: 'pre-line' }}>
                                {error}
                            </div>
                        )}

                        <Form onSubmit={handleCreateBatch}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold text-muted small">
                                    Batch Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., Batch 2027 CS"
                                    value={batchName}
                                    onChange={(e) => setBatchName(e.target.value)}
                                    className="border rounded-3"
                                    required
                                />
                                <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    Use a clear naming convention (e.g., Year + Program)
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold text-muted small">Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="e.g., Computer Science Batch 2027"
                                    value={batchDescription}
                                    onChange={(e) => setBatchDescription(e.target.value)}
                                    className="border rounded-3"
                                />
                            </Form.Group>

                            <Row className="g-3 mb-3">
                                <Col xs={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted small">
                                            Start Date <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="border rounded-3"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col xs={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-muted small">
                                            Graduation Date <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={graduationDate}
                                            onChange={(e) => setGraduationDate(e.target.value)}
                                            className="border rounded-3"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Button
                                type="submit"
                                variant="success"
                                className="w-100 py-3 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                                disabled={isCreating}
                            >
                                {isCreating ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-plus-circle me-2" style={{ fontSize: '18px' }}></i>}
                                {isCreating ? 'Creating Batch...' : 'Create Batch'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>

            <Col lg={7}>
                <Card className="border-0 shadow-sm rounded-4 bg-body">
                    <Card.Header className="bg-body border-0 pt-4 pb-3 px-4 d-flex justify-content-between align-items-center border-bottom">
                        <div>
                            <h5 className="fw-bold mb-1">Existing Batches</h5>
                            <p className="text-muted small mb-0">All academic batches in the system</p>
                        </div>
                        <Button
                            variant="outline-primary"
                            size="sm"
                            className="d-flex align-items-center"
                            onClick={() => queryClient.invalidateQueries(['batches-all'])}
                        >
                            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                        </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {isBatchesLoading ? (
                            <div className="text-center py-5"><Spinner /></div>
                        ) : !batches || batches.length === 0 ? (
                            <div className="text-center py-5 opacity-50">
                                <i className="bi bi-calendar-x mb-3" style={{ fontSize: '48px' }}></i>
                                <h5 className="fw-bold">No Batches Found</h5>
                                <p className="text-muted small">Create your first batch using the form on the left.</p>
                            </div>
                        ) : (
                            <Table hover responsive className="mb-0 align-middle">
                                <thead className="bg-body-tertiary">
                                    <tr>
                                        <th className="px-4 py-3 text-muted small text-uppercase">Batch Name</th>
                                        <th className="py-3 text-muted small text-uppercase">Description</th>
                                        <th className="py-3 text-muted small text-uppercase">Start Date</th>
                                        <th className="py-3 text-muted small text-uppercase">Graduation</th>
                                        <th className="py-3 text-muted small text-uppercase">Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {batches.map((batch) => {
                                        const start = new Date(batch.startDate);
                                        const grad = new Date(batch.expectedGraduationDate);
                                        const durationYears = Math.round((grad - start) / (1000 * 60 * 60 * 24 * 365));
                                        
                                        return (
                                            <tr key={batch.id}>
                                                <td className="px-4">
                                                    <div className="fw-bold">{batch.name}</div>
                                                </td>
                                                <td>
                                                    <span className="text-muted small">{batch.description || 'No description'}</span>
                                                </td>
                                                <td>
                                                    <span className="small">{start.toLocaleDateString()}</span>
                                                </td>
                                                <td>
                                                    <span className="small">{grad.toLocaleDateString()}</span>
                                                </td>
                                                <td>
                                                    <Badge bg="info" className="fw-normal">{durationYears} years</Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

// ══════════════════════════════════════════
// ══════ MODULE ASSIGNMENT ═════════════════
// ══════════════════════════════════════════

const ModuleAssignment = () => {
    const queryClient = useQueryClient();
    const [batchId, setBatchId] = useState('');
    const [courseId, setCourseId] = useState('');
    const [feedback, setFeedback] = useState(null);

    const { data: batches, isLoading: isBatchesLoading } = useQuery({
        queryKey: ['batches-all'],
        queryFn: async () => {
            const response = await api.get('/Batch/all');
            return response.data;
        },
        staleTime: 30000,
        refetchOnWindowFocus: true
    });

    const { data: courses, isLoading: isCoursesLoading } = useQuery({
        queryKey: ['courses-all'],
        queryFn: async () => {
            const response = await api.get('/Courses?limit=50');
            return response.data.items || response.data; // accounts for PagedResult vs List
        },
        staleTime: 30000,
        refetchOnWindowFocus: true
    });

    const assignMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/Enrollments/bulk-enroll', payload);
            return res.data;
        },
        onSuccess: (data) => {
            if (data.enrolled === 0 && data.total > 0) {
                setFeedback({ type: 'info', msg: `All ${data.total} students in this batch are already enrolled.` });
            } else if (data.total === 0) {
                setFeedback({ type: 'warning', msg: 'No students found in the selected batch.' });
            } else {
                setFeedback({ type: 'success', msg: data.message });
            }
        },
        onError: (err) => {
            setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Assignment failed.' });
        }
    });

    const handleAssign = () => {
        if (!batchId || !courseId) {
            setFeedback({ type: 'danger', msg: 'Please select both a batch and a module.' });
            return;
        }
        assignMutation.mutate({ batchId: parseInt(batchId), courseId: parseInt(courseId) });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h5 className="fw-bold mb-1">Assign Batch to Module</h5>
                    <p className="text-muted small mb-0">Bulk enroll all students within a batch into a specific curriculum module.</p>
                </div>
                <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="d-flex align-items-center"
                    onClick={() => {
                        queryClient.invalidateQueries(['batches-all']);
                        queryClient.invalidateQueries(['courses-all']);
                    }}
                >
                    <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                </Button>
            </div>

            {feedback && <Alert variant={feedback.type} onClose={() => setFeedback(null)} dismissible>{feedback.msg}</Alert>}

            <Row className="mb-4">
                <Col md={5}>
                    <Form.Group>
                        <Form.Label className="fw-semibold">Select Batch</Form.Label>
                        <Form.Select 
                            value={batchId} 
                            onChange={e => setBatchId(e.target.value)}
                            disabled={isBatchesLoading}
                            className="border rounded-3"
                        >
                            <option value="">-- Choose Batch --</option>
                            {batches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={5}>
                    <Form.Group>
                        <Form.Label className="fw-semibold">Select Module (Course)</Form.Label>
                        <Form.Select 
                            value={courseId} 
                            onChange={e => setCourseId(e.target.value)}
                            disabled={isCoursesLoading}
                            className="border rounded-3"
                        >
                            <option value="">-- Choose Module --</option>
                            {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                    <Button 
                        variant="primary" 
                        className="w-100 fw-bold"
                        disabled={assignMutation.isPending || !batchId || !courseId}
                        onClick={handleAssign}
                    >
                        {assignMutation.isPending ? <Spinner size="sm" /> : 'Assign'}
                    </Button>
                </Col>
            </Row>
        </div>
    );
};
