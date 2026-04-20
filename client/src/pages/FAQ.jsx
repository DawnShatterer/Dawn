import React from 'react';
import { Container, Accordion, Row, Col } from 'react-bootstrap';
import PublicNavbar from '../components/PublicNavbar';
import ParticleCanvas from '../components/ParticleCanvas';
import { Helmet } from 'react-helmet-async';

const FAQ = () => {
    const faqCategories = [
        {
            title: "General Questions",
            icon: <i className="bi bi-question-circle text-primary me-2" style={{ fontSize: '24px' }}></i>,
            items: [
                { q: "What is Dawn Learning?", a: "Dawn is a premium e-learning platform designed to provide high-quality, interactive courses from industry experts with a focus on career acceleration." },
                { q: "How do I create an account?", a: "Click the 'Get Started' or 'Register' button on the homepage. You can sign up as a Student to learn or a Teacher to host your own courses." }
            ]
        },
        {
            title: "Courses & Grades",
            icon: <i className="bi bi-book text-success me-2" style={{ fontSize: '24px' }}></i>,
            items: [
                { q: "Are the grades official?", a: "Yes, your attendance and assignment scores are automatically logged and accessible to the university administration for official grading." },
                { q: "Can I access courses offline?", a: "Currently, our video player requires an active internet connection for 4K streaming, but most supplemental materials like PDFs and code files are downloadable." }
            ]
        },
        {
            title: "Payments & Billing",
            icon: <i className="bi bi-credit-card text-warning me-2" style={{ fontSize: '24px' }}></i>,
            items: [
                { q: "How do I pay for my semester?", a: "Your institution handles all tuition and semester fees directly. The Dawn Platform is provided to you as part of your enrollment." },
                { q: "What about course materials?", a: "Unless specified by your professor, all digital materials are included in your course hub at no extra cost." }
            ]
        }
    ];

    return (
        <div className="bg-body-tertiary min-vh-100 font-sans position-relative overflow-hidden">
            <Helmet>
                <title>FAQ | Dawn Platform</title>
                <meta name="description" content="Frequently Asked Questions about the Dawn e-learning platform." />
            </Helmet>
            <div className="position-fixed w-100 h-100 top-0 start-0" style={{ zIndex: 0, pointerEvents: 'none' }}>
                <ParticleCanvas />
            </div>
            <div className="position-absolute top-0 start-50 translate-middle-x w-100 h-100" style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(13,110,253,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(13,202,240,0.05) 0%, transparent 40%)',
                zIndex: 0, pointerEvents: 'none'
            }}></div>
            <PublicNavbar />
            <Container className="position-relative z-1" style={{ paddingTop: '140px', paddingBottom: '100px' }}>
                <div className="text-center mb-5 pb-3">
                    <span className="text-primary fw-bold text-uppercase tracking-wider small d-block mb-2">Support Center</span>
                    <h1 className="fw-bolder display-4 tracking-tight">Frequently Asked Questions</h1>
                    <p className="lead text-muted mx-auto mb-5" style={{ maxWidth: '600px' }}>
                        Everything you need to know about getting started, managing your courses, and tracking your academic progress on Dawn.
                    </p>
                </div>

                <Row className="justify-content-center">
                    <Col lg={9}>
                        {faqCategories.map((cat, idx) => (
                            <div key={idx} className="mb-5">
                                <h4 className="fw-bold mb-4 d-flex align-items-center">
                                    {cat.icon} {cat.title}
                                </h4>
                                <Accordion className="shadow-sm rounded-4 overflow-hidden border-0">
                                    {cat.items.map((item, i) => (
                                        <Accordion.Item eventKey={`${idx}-${i}`} key={i} className="border-0 border-bottom">
                                            <Accordion.Header className="fw-bold py-3">{item.q}</Accordion.Header>
                                            <Accordion.Body className="text-muted lh-lg">
                                                {item.a}
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    ))}
                                </Accordion>
                            </div>
                        ))}
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default FAQ;
