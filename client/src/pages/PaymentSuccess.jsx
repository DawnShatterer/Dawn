import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from '../api/axios';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [verifying, setVerifying] = useState(true);
    const [paymentDetails, setPaymentDetails] = useState(null);
    
    const invoiceId = searchParams.get('invoiceId');
    const gateway = searchParams.get('gateway');
    
    useEffect(() => {
        const verifyPayment = async () => {
            // Validate URL parameters
            if (!invoiceId || !gateway) {
                navigate('/dashboard?error=invalid_payment_params');
                return;
            }
            
            if (!['esewa', 'khalti'].includes(gateway.toLowerCase())) {
                navigate('/dashboard?error=invalid_gateway');
                return;
            }
            
            try {
                // Backend verification
                const response = await api.get(`/Payment/verify`, {
                    params: { invoiceId, gateway }
                });
                
                if (response.data.success) {
                    setPaymentDetails(response.data);
                } else {
                    // Payment not completed or verification failed
                    navigate(`/payment-failed?reason=verification_failed`);
                    return;
                }
            } catch (err) {
                navigate(`/payment-failed?reason=verification_failed`);
                return;
            } finally {
                setVerifying(false);
            }
        };
        
        verifyPayment();
    }, [invoiceId, gateway, navigate]);
    
    if (verifying) {
        return (
            <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                <Card className="border-0 shadow-lg rounded-4 text-center p-5" style={{ maxWidth: '500px', width: '100%' }}>
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Verifying your payment...</p>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Card className="border-0 shadow-lg rounded-4 text-center p-5" style={{ maxWidth: '500px', width: '100%' }}>
                <div className="mb-4">
                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                        <i className="bi bi-check-circle text-success" style={{ fontSize: '40px' }}></i>
                    </div>
                </div>
                <h3 className="fw-bold text-success mb-2">Payment Successful!</h3>
                <p className="text-muted mb-1">
                    Your payment via <strong className="text-capitalize">{paymentDetails?.gateway || gateway}</strong> has been verified.
                </p>
                <p className="text-muted mb-4">
                    Your semester tuition payment has been recorded successfully.
                </p>
                {paymentDetails && (
                    <div className="text-start mb-4 p-3 bg-body-secondary rounded">
                        <p className="mb-1 small"><strong>Amount:</strong> Rs. {paymentDetails.amount?.toFixed(2)}</p>
                        <p className="mb-1 small"><strong>Transaction ID:</strong> {paymentDetails.transactionId}</p>
                        <p className="mb-0 small"><strong>Date:</strong> {new Date(paymentDetails.timestamp).toLocaleString()}</p>
                    </div>
                )}
                <div className="d-flex gap-3 justify-content-center">
                    {invoiceId && (
                        <Button variant="primary" className="px-4 py-2 fw-bold rounded-3 shadow-sm" onClick={() => navigate(`/tuition`)}>
                            View Billing
                        </Button>
                    )}
                    <Button variant="outline-secondary" className="px-4 py-2 rounded-3" onClick={() => navigate('/dashboard')}>
                        Dashboard
                    </Button>
                </div>
            </Card>
        </Container>
    );
};

export default PaymentSuccess;
