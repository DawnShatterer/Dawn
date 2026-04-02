import React from 'react';
import { Container, Card, Button, Row, Col, Badge } from 'react-bootstrap';
import { CreditCard, CheckCircle, GraduationCap, Zap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Subscriptions = () => {
    const navigate = useNavigate();

    return (
        <Container className="py-5" style={{ maxWidth: '900px' }}>
            <div className="text-center mb-5">
                <div className="bg-primary bg-opacity-10 p-4 rounded-circle d-inline-flex mb-3 shadow-sm">
                    <Star size={42} className="text-primary" />
                </div>
                <h2 className="fw-bold mb-2">My Subscriptions</h2>
                <p className="text-muted mb-0">Premium learning passes and institutional memberships.</p>
            </div>

            <Card className="border-0 shadow-sm rounded-4 text-center p-5 mb-5">
                <div className="py-4">
                    <div className="bg-light d-inline-flex p-4 rounded-circle mb-3">
                        <CreditCard size={48} className="text-muted" />
                    </div>
                    <h4 className="fw-bold">No Active Subscriptions</h4>
                    <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
                        You are currently on the **Free Tier**. You are enrolled in subjects on an individual basis.
                    </p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button variant="primary" className="fw-bold px-4 rounded-pill shadow-sm" disabled>
                            Upgrade Coming Soon
                        </Button>
                        <Button variant="outline-primary" className="fw-bold px-4 rounded-pill" onClick={() => navigate('/courses')}>
                            Explore Courses
                        </Button>
                    </div>
                </div>
            </Card>

            <h5 className="fw-bold mb-4">Why upgrade to Dawn Premium?</h5>
            <Row className="g-4">
                {[
                    { title: 'Unlimited Access', desc: 'Enroll in any number of subjects without individual payments.', icon: CheckCircle },
                    { title: 'Certificate Verifier', desc: 'Secure blockchain-based verification for all your earned certificates.', icon: GraduationCap },
                    { title: 'Priority AI Support', desc: 'Get instant, high-token limit responses from the AI Tutor.', icon: Zap }
                ].map((perk, idx) => (
                    <Col md={4} key={idx}>
                        <Card className="border-0 bg-body shadow-sm rounded-4 h-100 p-4 text-center">
                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-flex mx-auto mb-3">
                                <perk.icon size={28} className="text-primary" />
                            </div>
                            <h6 className="fw-bold">{perk.title}</h6>
                            <p className="text-muted small mb-0">{perk.desc}</p>
                        </Card>
                    </Col>
                ))}
            </Row>

            <div className="mt-5 p-4 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-25 text-center">
                <Badge bg="primary" className="mb-2">COMMUNITY NOTE</Badge>
                <p className="mb-0 text-primary small fw-medium">
                    Subscription plans are currently being finalized. Once live, existing high-points earners will receive discounted early-bird passes.
                </p>
            </div>
        </Container>
    );
};

export default Subscriptions;
