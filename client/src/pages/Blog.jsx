import React from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import PublicNavbar from '../components/PublicNavbar';
import ParticleCanvas from '../components/ParticleCanvas';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Blog = () => {
    const blogPosts = [
        {
            title: "The Future of Personalized Coaching in Modern E-Learning Platforms",
            excerpt: "Discover how advanced data analytics is personalizing student learning paths and streamlining complex grading systems for instructors.",
            author: "Dr. Sarah Chen",
            date: "April 1, 2026",
            category: "Technology",
            color: "primary",
            icon: <i className="bi bi-book" style={{ fontSize: '20px' }}></i>
        },
        {
            title: "5 Proven Strategies to Master Any New Career Skill",
            excerpt: "Learn the cognitive techniques used by high-performers to rapidly acquire and retain information in a fast-paced digital world.",
            author: "James Wilson",
            date: "March 28, 2026",
            category: "Study Tips",
            color: "success",
            icon: <i className="bi bi-book" style={{ fontSize: '20px' }}></i>
        },
        {
            title: "Transitioning to Tech: A Student Success Story",
            excerpt: "From retail management to Cloud Architecture—find out how one Dawn student completely transformed their career through online learning.",
            author: "Elena Rodriguez",
            date: "March 22, 2026",
            category: "Career",
            color: "warning",
            icon: <i className="bi bi-briefcase" style={{ fontSize: '20px' }}></i>
        },
        {
            title: "How to Build a High-Growth Learning Community",
            excerpt: "Group interaction is the key to retention. Explore our new social learning features and how to leverage them for your course.",
            author: "Mark Thompson",
            date: "March 15, 2026",
            category: "Community",
            color: "info",
            icon: <i className="bi bi-arrow-right" style={{ fontSize: '20px' }}></i>
        }
    ];

    return (
        <div className="bg-body-tertiary min-vh-100 font-sans position-relative overflow-hidden">
            <Helmet>
                <title>Blog | Dawn Platform</title>
                <meta name="description" content="Latest insights into e-learning, technology, and career building from the Dawn team." />
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
                <div className="text-center mb-5 pb-4">
                    <span className="text-primary fw-bold text-uppercase tracking-wider small d-block mb-2">Platform Blog</span>
                    <h1 className="fw-bolder display-4 tracking-tight">Latest from the Dawn Team</h1>
                    <p className="lead text-muted mx-auto mb-5" style={{ maxWidth: '650px' }}>
                        Expert insights, student success stories, and our vision for the future of decentralized education.
                    </p>
                </div>

                <Row className="g-4">
                    {blogPosts.map((post, i) => (
                        <Col lg={6} key={i}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden hover-scale transition-all">
                                <Card.Body className="p-5">
                                    <div className={`d-flex align-items-center mb-4 text-${post.color}`}>
                                        <Badge bg={post.color} className="bg-opacity-10 text-inherit px-3 py-2 rounded-3 me-3 d-flex align-items-center gap-2">
                                            {post.icon} {post.category}
                                        </Badge>
                                        <div className="small fw-semibold text-muted d-flex align-items-center">
                                            <i className="bi bi-calendar3 me-2" style={{ fontSize: '14px' }}></i> {post.date}
                                        </div>
                                    </div>
                                    <h3 className="fw-bold mb-3 lh-sm">{post.title}</h3>
                                    <p className="text-muted mb-4 fs-5 lh-lg">
                                        {post.excerpt}
                                    </p>
                                    <div className="d-flex align-items-center justify-content-between pt-4 border-top">
                                        <div className="d-flex align-items-center gap-2">
                                            <div className={`bg-${post.color} p-2 rounded-circle text-white shadow-sm`} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <i className="bi bi-person" style={{ fontSize: '16px' }}></i>
                                            </div>
                                            <span className="small fw-bold text-muted">{post.author}</span>
                                        </div>
                                        <Button variant="link" className="p-0 text-decoration-none fw-bold d-flex align-items-center gap-2 text-primary">
                                            Read More <i className="bi bi-arrow-right" style={{ fontSize: '16px' }}></i>
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <div className="text-center mt-5 pt-4">
                    <Button variant="outline-primary" className="px-5 py-3 rounded-pill fw-bold">
                        Browse All Articles
                    </Button>
                </div>

                <style>{`
                    .hover-scale { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                    .hover-scale:hover { transform: translateY(-5px); }
                    .text-inherit { color: inherit !important; }
                `}</style>
            </Container>
        </div>
    );
};

export default Blog;
