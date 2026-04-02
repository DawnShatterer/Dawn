import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCourses } from '../api/courseService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Row, Col, Card, Badge, Form, InputGroup } from 'react-bootstrap';
import { Search, BookOpen, Star, Clock } from 'lucide-react';
import PaginationControls from '../components/PaginationControls';

const AllCourses = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

    const [page, setPage] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    // Debounce search input
    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to first page on new search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const { data: pagedData, isLoading } = useQuery({
        queryKey: ['courses', page, debouncedSearch],
        queryFn: () => getCourses(page, 9, debouncedSearch) // 9 courses per page (3x3 grid)
    });

    const coursesList = pagedData?.items || [];
    const totalCount = pagedData?.totalCount || 0;
    const totalPages = pagedData?.totalPages || 1;

    return (
        <div className="container-fluid py-4 font-sans">
            {/* Hero Header */}
            <div className="bg-primary bg-opacity-10 rounded-4 p-5 mb-5 position-relative overflow-hidden border border-primary border-opacity-25 shadow-sm">
                <div className="position-relative z-1">
                    <h1 className="fw-bold text-body mb-3 display-5 tracking-tight">Discover Your Next Skill</h1>
                    <p className="lead text-muted mb-4" style={{ maxWidth: '600px' }}>
                        Browse our extensive catalog of expert-led courses. From programming to design, Dawn has everything you need to succeed.
                    </p>
                    
                    <InputGroup className="shadow-sm" style={{ maxWidth: '600px' }}>
                        <InputGroup.Text className="bg-body border-end-0 px-4 py-3">
                            <Search className="text-muted" size={20} />
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
                <BookOpen size={300} className="position-absolute text-primary opacity-10" style={{ right: '-5%', top: '-20%', transform: 'rotate(-15deg)' }} />
            </div>

            <h4 className="fw-bold mb-4 d-flex align-items-center">
                All Available Courses {totalCount > 0 && <Badge bg="primary" className="ms-3">{totalCount}</Badge>}
            </h4>

            {isLoading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <>
                    <Row className="g-4">
                        {coursesList.length === 0 ? (
                            <Col xs={12}>
                                <div className="text-center py-5 text-muted">
                                    <BookOpen size={48} className="mb-3 opacity-50" />
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
                                                    <img src={course.thumbnailUrl} alt={course.title} className="w-100 h-100 object-fit-cover" />
                                                ) : (
                                                    <BookOpen size={40} className="opacity-50" />
                                                )}
                                            </div>
                                            <Badge bg="primary" className="position-absolute top-0 end-0 m-3 px-3 py-2 rounded-pill shadow-sm">
                                                Rs. {course.price}
                                            </Badge>
                                        </div>
                                        
                                        <Card.Body className="d-flex flex-column p-4">
                                            <Card.Title className="fw-bold fs-5 mb-2 line-clamp-2">{course.title}</Card.Title>
                                            <Card.Text className="text-muted small mb-4 flex-grow-1 line-clamp-3">
                                                {course.description}
                                            </Card.Text>
                                            
                                            <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center text-warning small fw-bold">
                                                    <Star size={14} className="me-1 fill-warning" /> 
                                                    {course.averageRating > 0 ? course.averageRating.toFixed(1) : 'New'}
                                                </div>
                                                <div className="d-flex align-items-center text-muted small">
                                                    <Clock size={14} className="me-1" /> Self-paced
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))
                        )}
                    </Row>
                    
                    {totalPages > 1 && (
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
