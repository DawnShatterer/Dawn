import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { BookOpen, Video, Users, Award, ArrowRight, PlayCircle, ShieldCheck, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import PublicNavbar from '../components/PublicNavbar';
import ParticleCanvas from '../components/ParticleCanvas';

/* ─── Main Homepage ─── */
const Home = () => {
    // Fetch live platform stats for the hero section
    const { data: stats, isLoading } = useQuery({
        queryKey: ['public-stats'],
        queryFn: async () => {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5159';
            const res = await axios.get(`${apiBase}/api/public/stats`);
            return res.data;
        }
    });

    return (
        <div className="font-sans position-relative bg-body-tertiary" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
            
            {/* ─── Particles Background Layer ─── */}
            <div className="position-fixed w-100 h-100 top-0 start-0" style={{ zIndex: 0 }}>
                <ParticleCanvas />
            </div>

            <PublicNavbar />

            {/* ─── Hero Section ─── */}
            <section className="position-relative pt-5 pb-5" style={{ zIndex: 2 }}>
                <Container className="pt-5 pb-5">
                    <Row className="align-items-center justify-content-center text-center text-lg-start">
                        <Col lg={7} className="mb-5 mb-lg-0 position-relative" style={{ zIndex: 3 }}>
                            <div className="d-inline-flex align-items-center mb-4 px-3 py-2 rounded-pill bg-body shadow-sm border" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#6610f2' }}>
                                <Zap size={16} className="me-2 text-warning" /> 
                                Dawn Platform 2.0 is Live
                            </div>
                            <h1 className="fw-bolder mb-4 text-body" style={{ fontSize: '4.5rem', lineHeight: '1.1', letterSpacing: '-2px' }}>
                                Learn Without <br/>
                                <span style={{ background: 'linear-gradient(45deg, #0d6efd, #6610f2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Boundaries.</span>
                            </h1>
                            <p className="lead text-muted mb-5 pe-lg-5 fs-4" style={{ lineHeight: '1.6' }}>
                                The premium e-learning platform that empowers you to master new skills with interactive AI tools, stunning courses, and an elite community.
                            </p>
                            <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-lg-start gap-3">
                                <Link to="/register" className="btn btn-primary btn-lg px-5 py-3 fw-bold rounded-pill shadow-lg bg-gradient d-flex align-items-center justify-content-center" style={{ transition: 'transform 0.2s', border: 'none' }}>
                                    Start Learning For Free
                                </Link>
                                <Link to="/login" className="btn btn-white btn-lg px-5 py-3 fw-bold rounded-pill shadow-sm border d-flex align-items-center justify-content-center text-body hover-light">
                                    <PlayCircle size={20} className="me-2 text-primary" /> See How It Works
                                </Link>
                            </div>
                            
                            <div className="mt-5 d-flex align-items-center justify-content-center justify-content-lg-start gap-4">
                                <div className="d-flex align-items-center">
                                    <div className="d-flex me-2">
                                        {[1,2,3,4].map(i => (
                                            <div key={i} className="rounded-circle border border-2 border-white bg-primary" style={{ width: '32px', height: '32px', marginLeft: i > 1 ? '-12px' : 0, backgroundImage: `url(https://i.pravatar.cc/100?img=${i+10})`, backgroundSize: 'cover' }}></div>
                                        ))}
                                    </div>
                                    <div className="small fw-bold text-muted lh-sm">
                                        <span className="text-body d-block fs-5">{isLoading ? '100+' : (stats?.students || '100+').toLocaleString()}+</span>Students
                                    </div>
                                </div>
                                <div className="border-start ps-4 d-none d-sm-block">
                                    <div className="d-flex text-warning mb-1">
                                        {Array(5).fill(0).map((_,i) => <span key={i}>★</span>)}
                                    </div>
                                    <div className="small fw-bold text-muted">{isLoading ? '4.9' : (stats?.averageRating || 4.9)}/5 Average Rating</div>
                                </div>
                            </div>
                        </Col>
                        
                        <Col lg={5} className="position-relative" style={{ zIndex: 3 }}>
                            {/* Glassmorphic Mockup Dashboard */}
                            <div className="position-relative rounded-4 p-2 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.8)', transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)' }}>
                                <div className="bg-body p-4 rounded-4 shadow-sm w-100 h-100">
                                    <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary rounded-circle" style={{ width: '40px', height: '40px', backgroundImage: 'url(https://i.pravatar.cc/150?img=68)', backgroundSize: 'cover' }}></div>
                                            <div>
                                                <h6 className="fw-bold mb-0">Dawn Learner</h6>
                                                <small className="text-muted">Pro Student</small>
                                            </div>
                                        </div>
                                        <div className="bg-success bg-opacity-10 text-success fw-bold px-3 py-1 rounded-pill small">Online</div>
                                    </div>
                                    <h6 className="fw-bold mb-3">Your Progress</h6>
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between small fw-bold mb-1">
                                            <span>Advanced C# Architecture</span>
                                            <span className="text-primary">78%</span>
                                        </div>
                                        <div className="progress rounded-pill" style={{ height: '8px' }}>
                                            <div className="progress-bar bg-primary bg-gradient" style={{ width: '78%' }}></div>
                                        </div>
                                    </div>
                                    <div className="mb-2">
                                        <div className="d-flex justify-content-between small fw-bold mb-1">
                                            <span>React Masterclass</span>
                                            <span className="text-info">42%</span>
                                        </div>
                                        <div className="progress rounded-pill" style={{ height: '8px' }}>
                                            <div className="progress-bar bg-info bg-gradient" style={{ width: '42%' }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Elements */}
                                <div className="position-absolute bg-body shadow-lg p-3 rounded-4" style={{ bottom: '-30px', left: '-40px', zIndex: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-warning bg-opacity-10 p-3 rounded-3 text-warning"><Award size={24}/></div>
                                        <div>
                                            <h6 className="fw-bold mb-0">Certificate Earned</h6>
                                            <small className="text-muted fw-medium">Just now</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* ─── Premium Features Section ─── */}
            <section className="py-6 position-relative bg-body" style={{ zIndex: 2 }}>
                <Container className="py-5">
                    <div className="text-center mb-5 pb-4">
                        <span className="text-primary fw-bold text-uppercase tracking-wide small d-block mb-2">Why Dawn?</span>
                        <h2 className="fw-bolder display-6 text-body mb-3">Everything you need to succeed.</h2>
                        <p className="lead text-muted mx-auto" style={{ maxWidth: '600px' }}>
                            We combine cutting-edge technology with world-class education to deliver an unparalleled learning experience.
                        </p>
                    </div>

                    <Row className="g-4">
                        {[
                            { icon: BookOpen, color: 'primary', title: 'World-Class Curriculum', desc: 'Syllabuses built by industry leaders guaranteed to boost your career prospects.' },
                            { icon: Video, color: 'danger', title: 'Cinematic Video Lessons', desc: '4K streaming, interactive chapters, and beautifully designed study materials.' },
                            { icon: ShieldCheck, color: 'success', title: 'Verified Certification', desc: 'Earn verifiable digital certificates with unique cryptographic QR codes.' },
                            { icon: Users, color: 'info', title: 'Thriving Community', desc: 'Gain access to private chat rooms, study groups, and direct teacher mentoring.' }
                        ].map((feat, i) => (
                            <Col md={6} lg={3} key={i}>
                                <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden" 
                                      style={{ transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-10px)'}
                                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <Card.Body className="p-4">
                                        <div className={`bg-${feat.color} bg-opacity-10 d-inline-flex p-3 rounded-4 mb-4`}>
                                            <feat.icon size={28} className={`text-${feat.color}`} />
                                        </div>
                                        <h5 className="fw-bold text-body mb-3">{feat.title}</h5>
                                        <p className="text-muted small lh-lg mb-0">{feat.desc}</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* ─── CTA Footer Section ─── */}
            <section className="py-6 bg-dark text-white position-relative overflow-hidden pt-5 pb-5" style={{ zIndex: 2 }}>
                <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25" style={{ background: 'radial-gradient(circle at 100% 0%, #6610f2 0%, transparent 50%), radial-gradient(circle at 0% 100%, #0d6efd 0%, transparent 50%)' }}></div>
                <Container className="py-5 text-center position-relative z-1">
                    <h2 className="fw-bolder display-5 mb-4">Start your journey today.</h2>
                    <p className="lead text-white-50 mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                        Join over 10,000 ambitious learners who are already levelling up their skills and careers with Dawn.
                    </p>
                    <div className="d-flex justify-content-center gap-3">
                        <Link to="/register" className="btn btn-light btn-lg px-5 py-3 fw-bold rounded-pill text-body shadow-lg btn-hover-scale">
                            Create Your Free Account
                        </Link>
                    </div>
                </Container>
            </section>

            {/* Basic responsive style injection */}
            <style>{`
                .hover-primary:hover { color: #0d6efd !important; }
                .tracking-wide { letter-spacing: 2px; }
                .btn-hover-scale { transition: transform 0.2s; }
                .btn-hover-scale:hover { transform: scale(1.05); }
                .hover-light:hover { background: #f8f9fa; }
            `}</style>
        </div>
    );
};

export default Home;
