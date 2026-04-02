import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Layers, Video, FileText, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import ParticleCanvas from '../components/ParticleCanvas';

const ContentPage = () => {
    return (
        <div className="bg-body-tertiary min-vh-100 font-sans position-relative overflow-hidden">
            <div className="position-absolute top-0 start-50 translate-middle-x w-100 h-100" style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(13,110,253,0.05) 0%, transparent 50%)',
                zIndex: 0, pointerEvents: 'none'
            }}></div>
            <div className="position-fixed w-100 h-100 top-0 start-0" style={{ zIndex: 0, pointerEvents: 'none' }}>
                <ParticleCanvas />
            </div>
            <PublicNavbar />
            <Container className="position-relative z-1" style={{ paddingTop: '120px', paddingBottom: '60px' }}>
                <div className="text-center mb-5 pb-3">
                    <h1 className="fw-bolder display-5 text-body tracking-tight">World-Class Educational Content</h1>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: '650px' }}>
                        Explore thousands of hours of high-quality courses, interactive assessments, and expert-led live classes designed to escalate your career.
                    </p>
                </div>

                <Row className="g-4 mb-5 justify-content-center">
                    <Col md={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100 text-center hover-scale transition-all">
                            <Card.Body className="p-5">
                                <Video size={48} className="text-primary mb-4" />
                                <h4 className="fw-bold mb-3">4K Video Libraries</h4>
                                <p className="text-muted small">
                                    Cinematic video lectures featuring interactive transcriptions and smart chapter markers to help you find precisely what you need.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100 text-center hover-scale transition-all bg-primary text-white">
                            <Card.Body className="p-5">
                                <Layers size={48} className="text-warning mb-4" />
                                <h4 className="fw-bold mb-3">Structured Modules</h4>
                                <p className="text-white-50 small">
                                    Every course is perfectly structured into digestible modules. Track your progress with dynamic progress bars and instant feedback on your assignments.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="border-0 shadow-sm rounded-4 h-100 text-center hover-scale transition-all">
                            <Card.Body className="p-5">
                                <FileText size={48} className="text-success mb-4" />
                                <h4 className="fw-bold mb-3">Rich Resources</h4>
                                <p className="text-muted small">
                                    Downloadable PDFs, slide decks, and code execution environments built straight into the browser. No external tools required.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-5">
                    <Row className="g-0 align-items-center">
                        <Col lg={7} className="p-5">
                            <h3 className="fw-bold mb-4">Quality assured by top experts.</h3>
                            <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                                <li className="d-flex align-items-center"><CheckCircle size={20} className="text-success me-3" /> <span className="fw-medium text-body">Syllabus strictly follows global standards</span></li>
                                <li className="d-flex align-items-center"><CheckCircle size={20} className="text-success me-3" /> <span className="fw-medium text-body">Daily live support sessions by Teaching Assistants</span></li>
                                <li className="d-flex align-items-center"><CheckCircle size={20} className="text-success me-3" /> <span className="fw-medium text-body">Lifetime access to purchased content and all future updates</span></li>
                                <li className="d-flex align-items-center"><CheckCircle size={20} className="text-success me-3" /> <span className="fw-medium text-body">AI-driven BM25 search engine to instantly query any course material</span></li>
                            </ul>
                        </Col>
                        <Col lg={5} className="bg-light p-5 h-100 d-flex flex-column justify-content-center border-start">
                            <h5 className="fw-bold mb-3">Ready to dive in?</h5>
                            <p className="text-muted small mb-4">Create your account to browse the full catalog of available courses.</p>
                            <Link to="/register" className="btn btn-primary fw-bold py-3 rounded-pill w-100">Start Browsing Content</Link>
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

export default ContentPage;
