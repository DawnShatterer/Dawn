import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCourses } from '../api/courseService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Row, Col, Card, Badge, Form, InputGroup } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getFileUrl } from '../utils/fileUtils';
import PaginationControls from '../components/PaginationControls';
import { Helmet } from 'react-helmet-async';
import SkeletonCourseCard from '../components/SkeletonCourseCard';

const AllCourses = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

    // Sync state with URL params
    React.useEffect(() => {
        const q = searchParams.get('q');
        if (q !== null && q !== searchTerm) {
            setSearchTerm(q);
        }
    }, [searchParams]);

    const [page, setPage] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    const [selectedCategory, setSelectedCategory] = useState("All");

    const categories = [
        "All", 
        "Web Development", 
        "Software Development", 
        "Data Science", 
        "Cyber Security", 
        "Cloud Computing", 
        "Artificial Intelligence", 
        "Mobile Development"
    ];

    // Debounce search input
    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const { data: pagedData, isLoading } = useQuery({
        queryKey: ['courses', page, debouncedSearch, selectedCategory],
        queryFn: () => getCourses(page, 3, debouncedSearch, selectedCategory)
    });

    const { data: allCoursesData } = useQuery({
        queryKey: ['all-courses-count', debouncedSearch],
        queryFn: () => getCourses(1, 1000, debouncedSearch, "All")
    });

    const coursesList = pagedData?.items || [];
    const totalCount = pagedData?.totalCount || 0;
    const totalPages = pagedData?.totalPages || 1;

    const allCoursesList = allCoursesData?.items || [];
    const categoryCounts = allCoursesList.reduce((acc, course) => {
        const cat = course.category || 'General';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});
    const totalCountAll = allCoursesData?.totalCount || 0;

    return (
        <div className="container-fluid py-4 font-sans">
            <Helmet>
                <title>All Courses | Dawn Platform</title>
                <meta name="description" content="Browse our extensive catalog of expert-led courses. Find your next skill to master at Dawn Platform." />
            </Helmet>
            {/* Hero Header */}
            <div className="bg-primary bg-opacity-10 rounded-4 p-5 mb-5 position-relative overflow-hidden border border-primary border-opacity-25 shadow-sm">
                <div className="position-relative z-1">
                    <h1 className="fw-bold mb-3 display-5 tracking-tight">Discover Your Next Skill</h1>
                    <p className="lead text-muted mb-4" style={{ maxWidth: '600px' }}>
                        Browse our extensive catalog of expert-led courses. From programming to design, Dawn has everything you need to succeed.
                    </p>

                    <InputGroup className="shadow-sm" style={{ maxWidth: '600px' }}>
                        <InputGroup.Text className="bg-body border-end-0 px-4 py-3">
                            <i className="bi bi-search text-muted" style={{ fontSize: '20px' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Search completely..."
                            className="bg-body border-start-0 py-3 shadow-none focus-ring focus-ring-light text-body fs-5"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </div>
                {/* Decorative background element */}
                <i className="bi bi-book position-absolute text-primary opacity-10" style={{ fontSize: '300px', right: '-5%', top: '-20%', transform: 'rotate(-15deg)' }}></i>
            </div>

            <div className="mb-4">
                <h4 className="fw-bold mb-3 d-flex align-items-center">
                    All Available Courses{totalCount > 0 ? <span className="ms-1" style={{ fontSize: '0.85rem', opacity: 0.8 }}>({totalCount})</span> : ''}
                </h4>
                
                <div className="category-pills d-flex gap-3 overflow-auto pb-2" style={{ maxWidth: '100%' }}>
                    {categories.map(cat => {
                        const count = cat === 'All' ? totalCountAll : (categoryCounts[cat] || 0);
                        return (
                            <Badge 
                                key={cat} 
                                bg={selectedCategory === cat ? "primary" : "transparent"} 
                                text={selectedCategory === cat ? "white" : "body"}
                                className={`px-3 py-2 rounded-pill shadow-sm border border-secondary cursor-pointer hover-shadow transition-all ${selectedCategory === cat ? 'border-primary' : 'text-muted'}`}
                                onClick={() => { setSelectedCategory(cat); setPage(1); }}
                                style={{ cursor: 'pointer', whiteSpace: 'nowrap', opacity: selectedCategory === cat ? 1 : 0.8 }}
                            >
                                {cat}{count > 0 ? <span className="ms-1" style={{ fontSize: '0.75rem', opacity: 0.9 }}>({count})</span> : ''}
                            </Badge>
                        )
                    })}
                </div>
            </div>

            {isLoading ? (
                <Row className="g-4">
                    <SkeletonCourseCard count={6} />
                </Row>
            ) : (
                <>
                    <Row className="g-4">
                        {coursesList.length === 0 ? (
                            <Col xs={12}>
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-book mb-3 opacity-50" style={{ fontSize: '48px' }}></i>
                                    <h5>No courses found</h5>
                                    <p>Try adjusting your search criteria.</p>
                                </div>
                            </Col>
                        ) : (
                            coursesList.map(course => (
                                <Col key={course.id} xs={12} md={6} lg={4}>
                                    <Card
                                        className="h-100 border-0 shadow-sm course-card overflow-hidden"
                                        onClick={() => navigate(`/courses/${course.id}`)}
                                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                    >
                                        <div className="position-relative">
                                            <div style={{ height: '160px', backgroundColor: '#e9ecef' }} className="w-100 d-flex align-items-center justify-content-center text-secondary">
                                                {course.thumbnailUrl ? (
                                                    <img src={getFileUrl(course.thumbnailUrl)} alt={course.title} className="w-100 h-100 object-fit-cover" />
                                                ) : (
                                                    <i className="bi bi-book opacity-50" style={{ fontSize: '40px' }}></i>
                                                )}
                                            </div>
                                        </div>

                                        <Card.Body className="d-flex flex-column p-4">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <Badge bg="info" className="bg-opacity-10 text-info border border-info px-2 py-1 fw-bold" style={{ fontSize: '0.65rem' }}>
                                                    {course.category || 'General'}
                                                </Badge>
                                            </div>
                                            <Card.Title className="fw-bold fs-5 mb-2 line-clamp-2" style={{ lineHeight: '1.4' }}>{course.title}</Card.Title>
                                            <Card.Text className="text-muted small mb-4 flex-grow-1 line-clamp-3">
                                                {course.description}
                                            </Card.Text>

                                            <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center text-warning small fw-bold">
                                                    <i className="bi bi-star-fill me-1" style={{ fontSize: '14px' }}></i>
                                                    {course.averageRating > 0 ? course.averageRating.toFixed(1) : 'New'}
                                                </div>
                                                <Badge bg="secondary" className="bg-opacity-10 text-secondary border border-secondary d-flex align-items-center" style={{ fontSize: '0.65rem', padding: '0.35rem 0.6rem' }}>
                                                    <i className="bi bi-clock me-1" style={{ fontSize: '12px' }}></i> Self-Paced
                                                </Badge>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))
                        )}
                    </Row>

                    {totalPages > 0 && (
                        <div className="mt-5 pb-4">
                            <PaginationControls page={page} setPage={setPage} totalPages={totalPages} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AllCourses;
