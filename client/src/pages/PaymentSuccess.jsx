import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button } from 'react-bootstrap';
import { CheckCircle, BookOpen } from 'lucide-react';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const courseId = searchParams.get('courseId');
    const gateway = searchParams.get('gateway');

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Card className="border-0 shadow-lg rounded-4 text-center p-5" style={{ maxWidth: '500px', width: '100%' }}>
                <div className="mb-4">
                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                        <CheckCircle size={40} className="text-success" />
                    </div>
                </div>
                <h3 className="fw-bold text-success mb-2">Payment Successful!</h3>
                <p className="text-muted mb-1">
                    Your payment via <strong className="text-capitalize">{gateway || 'gateway'}</strong> has been verified.
                </p>
                <p className="text-muted mb-4">
                    You have been automatically enrolled in the course. Start learning now!
                </p>
                <div className="d-flex gap-3 justify-content-center">
                    {courseId && (
                        <Button variant="success" className="px-4 py-2 fw-bold rounded-3 shadow-sm" onClick={() => navigate(`/courses/${courseId}`)}>
                            <BookOpen size={18} className="me-2" />Go to Course
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
