import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button } from 'react-bootstrap';
import { XCircle, RefreshCw } from 'lucide-react';

const PaymentFailed = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const reason = searchParams.get('reason') || 'unknown';

    const reasonMessages = {
        esewa_cancelled: 'The eSewa payment was cancelled or not completed.',
        khalti_cancelled: 'The Khalti payment was cancelled or not completed.',
        signature_mismatch: 'Payment verification failed due to a signature mismatch.',
        payment_not_found: 'The payment record could not be found.',
        payment_incomplete: 'The payment was not fully completed.',
        khalti_lookup_failed: 'Khalti payment verification failed.',
        server_error: 'An unexpected server error occurred.',
        unknown: 'The payment could not be processed.'
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Card className="border-0 shadow-lg rounded-4 text-center p-5" style={{ maxWidth: '500px', width: '100%' }}>
                <div className="mb-4">
                    <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                        <XCircle size={40} className="text-danger" />
                    </div>
                </div>
                <h3 className="fw-bold text-danger mb-2">Payment Failed</h3>
                <p className="text-muted mb-4">
                    {reasonMessages[reason] || reasonMessages.unknown}
                </p>
                <div className="d-flex gap-3 justify-content-center">
                    <Button variant="danger" className="px-4 py-2 fw-bold rounded-3 shadow-sm" onClick={() => navigate('/courses')}>
                        <RefreshCw size={18} className="me-2" /> Try Again
                    </Button>
                    <Button variant="outline-secondary" className="px-4 py-2 rounded-3" onClick={() => navigate('/dashboard')}>
                        Dashboard
                    </Button>
                </div>
            </Card>
        </Container>
    );
};

export default PaymentFailed;
