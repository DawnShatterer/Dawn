import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { ShieldCheck, Zap, Globe, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import ParticleCanvas from '../components/ParticleCanvas';

const DawnPlatform = () => {
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
                    <h1 className="fw-bolder display-4 text-body tracking-tight">About Dawn Platform 2.0</h1>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
                        The most advanced, AI-driven educational framework ever built. Learn without limits.
                    </p>
                </div>

                <Row className="g-4 mb-5">
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm rounded-4 h-100 bg-primary text-white overflow-hidden position-relative">
                            <div className="position-absolute top-0 end-0 opacity-10 p-4">
                                <Globe size={120} />
                            </div>
                            <Card.Body className="p-5 position-relative z-1">
                                <Zap size={32} className="mb-4 text-warning" />
                                <h3 className="fw-bold mb-3">Next-Generation Infrastructure</h3>
                                <p className="mb-0 fs-5 text-white-50 lh-lg">
                                    Our servers are powered by globally distributed CDNs, ensuring blazing fast 4K video playback, reliable real-time signal processing for chat, and zero downtime.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={6}>
                        <Row className="g-4 h-100">
                            <Col md={12}>
                                <Card className="border-0 shadow-sm rounded-4 h-100">
                                    <Card.Body className="p-4 d-flex align-items-center">
                                        <div className="bg-success bg-opacity-10 p-3 rounded-circle me-4 text-success">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-2">Bank-Grade Security</h5>
                                            <p className="text-muted mb-0">Your data, learning progress, and payments are encrypted using AES-256 military-grade encryption.</p>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={12}>
                                <Card className="border-0 shadow-sm rounded-4 h-100">
                                    <Card.Body className="p-4 d-flex align-items-center">
                                        <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-4 text-warning">
                                            <Award size={32} />
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-2">Verified Academic Integrity</h5>
                                            <p className="text-muted mb-0">Every certificate issued by Dawn is backed by cryptographic verification codes to prevent forgery.</p>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default DawnPlatform;
