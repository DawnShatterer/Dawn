import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Target, Users, Code, Coffee, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import ParticleCanvas from '../components/ParticleCanvas';

const AboutUs = () => {
    return (
        <div className="bg-body-tertiary min-vh-100 font-sans position-relative overflow-hidden">
            <div className="position-absolute top-0 start-50 translate-middle-x w-100 h-100" style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(13,110,253,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(13,202,240,0.05) 0%, transparent 40%)',
                zIndex: 0, pointerEvents: 'none'
            }}></div>
            <div className="position-fixed w-100 h-100 top-0 start-0" style={{ zIndex: 0, pointerEvents: 'none' }}>
                <ParticleCanvas />
            </div>
            <PublicNavbar />
            <Container className="position-relative z-1" style={{ paddingTop: '140px', paddingBottom: '60px' }}>
                <div className="text-center mb-5 pb-3">
                    <h1 className="fw-bolder display-5 text-body tracking-tight mt-4">About Dawn</h1>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
                        We are on a mission to democratize premium education, breaking down geographical borders through advanced technology, AI, and beautifully designed user experiences.
                    </p>
                </div>

                <Row className="g-4 mb-5">
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100 text-center hover-scale transition-all">
                            <Card.Body className="p-5">
                                <Target size={40} className="text-primary mb-4" />
                                <h4 className="fw-bold mb-3">Our Mission</h4>
                                <p className="text-muted small mb-0">
                                    To provide a unified platform where anyone, anywhere can learn from top-tier instructors without the friction of outdated university systems.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100 text-center hover-scale transition-all">
                            <Card.Body className="p-5">
                                <Code size={40} className="text-success mb-4" />
                                <h4 className="fw-bold mb-3">Our Engineering</h4>
                                <p className="text-muted small mb-0">
                                    Built using cutting-edge .NET 9 and highly responsive React logic, the platform ensures rapid rendering, seamless state handling, and 100% uptime.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100 text-center hover-scale transition-all">
                            <Card.Body className="p-5">
                                <Globe size={40} className="text-info mb-4" />
                                <h4 className="fw-bold mb-3">Our Vision</h4>
                                <p className="text-muted small mb-0">
                                    We see a future where high-quality education is not gated by income, but accessible to any internet-connected device instantaneously.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-5 bg-primary text-white position-relative">
                    <div className="position-absolute end-0 bottom-0 opacity-10 p-5">
                        <Users size={160} />
                    </div>
                    <Row className="g-0 align-items-center position-relative z-1">
                        <Col lg={7} className="p-5">
                            <h3 className="fw-bold mb-4">Meet the Team</h3>
                            <p className="lh-lg mb-4 text-white-50">
                                Dawn was envisioned and built by a dedicated team of passionate engineers, designers, and educators who were tired of chunky, slow, and expensive Learning Management Systems. We combined our skills to build something we actually wanted to use.
                            </p>
                            <div className="d-flex align-items-center">
                                <div className="bg-white bg-opacity-25 p-3 rounded-circle me-3">
                                    <Coffee size={24} />
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-0">Fueled by purpose</h6>
                                    <small className="text-white-50">And maybe a little bit of caffeine.</small>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card>
                <style>{`
                    .hover-scale { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                    .hover-scale:hover { transform: translateY(-10px); }
                `}</style>
            </Container>
        </div>
    );
};

export default AboutUs;
