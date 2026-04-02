import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { Star, MessageCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const CourseReviews = ({ courseId, isEnrolled, userRole }) => {
    const queryClient = useQueryClient();
    const [score, setScore] = useState(0);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [comment, setComment] = useState('');

    const { data: reviews, isLoading } = useQuery({
        queryKey: ['course-reviews', courseId],
        queryFn: async () => {
            const res = await api.get(`/CourseReview/course/${courseId}`);
            return res.data;
        }
    });

    const submitReviewMutation = useMutation({
        mutationFn: async (reviewData) => {
            const res = await api.post('/CourseReview', reviewData);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['course-reviews', courseId]);
            queryClient.invalidateQueries(['course', courseId]); // To update average stats
            setScore(0);
            setComment('');
        }
    });

    const isStudent = userRole === 'student';

    // Has this user already reviewed? We can check locally if their name matches roughly, but backend enforces it safely.
    // For local UI, if submission fails with 400, it's mostly "already reviewed".

    const handleSubmit = (e) => {
        e.preventDefault();
        if (score === 0) return alert('Please select a star rating.');
        submitReviewMutation.mutate({ courseId, score, comment });
    };

    if (isLoading) return <Spinner animation="border" variant="warning" />;

    return (
        <div className="py-2">
            <h4 className="fw-bold mb-4 d-flex align-items-center">
                Student Reviews <Badge bg="warning" text="dark" className="ms-3">{reviews?.length || 0}</Badge>
            </h4>

            {isStudent && isEnrolled && (
                <Card className="border-0 shadow-sm mb-5 bg-warning bg-opacity-10 border-start border-4 border-warning">
                    <Card.Body className="p-4">
                        <h5 className="fw-bold mb-3 d-flex align-items-center">
                            <MessageCircle className="me-2 text-warning" /> Leave a Review
                        </h5>
                        
                        {submitReviewMutation.isError && (
                            <Alert variant="danger" className="py-2 d-flex align-items-center">
                                <AlertCircle size={16} className="me-2"/>
                                {submitReviewMutation.error?.response?.data?.message || 'Failed to submit review.'}
                            </Alert>
                        )}
                        {submitReviewMutation.isSuccess && (
                            <Alert variant="success" className="py-2">Thank you! Your review is now public.</Alert>
                        )}

                        <Form onSubmit={handleSubmit}>
                            <div className="mb-3 d-flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star 
                                        key={star} 
                                        size={28} 
                                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                        fill={(hoveredStar || score) >= star ? '#ffc107' : 'transparent'}
                                        color={(hoveredStar || score) >= star ? '#ffc107' : '#ced4da'}
                                        onMouseEnter={() => setHoveredStar(star)}
                                        onMouseLeave={() => setHoveredStar(0)}
                                        onClick={() => setScore(star)}
                                    />
                                ))}
                            </div>
                            <Form.Group className="mb-3">
                                <Form.Control 
                                    as="textarea" 
                                    rows={3} 
                                    placeholder="Write about your experience with this course..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Button 
                                variant="warning" 
                                type="submit" 
                                className="fw-bold px-4"
                                disabled={submitReviewMutation.isPending || score === 0}
                            >
                                {submitReviewMutation.isPending ? 'Posting...' : 'Post Review'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            {!reviews?.length && <p className="text-muted">No reviews yet. Be the first to review this course!</p>}

            <div className="d-flex flex-column gap-3">
                {reviews?.map(review => (
                    <Card key={review.id} className="border-0 shadow-sm">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="fw-bold mb-0">{review.studentName}</h6>
                                <span className="text-muted small">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="d-flex mb-3">
                                {[1,2,3,4,5].map(star => (
                                    <Star 
                                        key={star} 
                                        size={14} 
                                        fill={star <= review.score ? '#ffc107' : 'transparent'} 
                                        color={star <= review.score ? '#ffc107' : '#ced4da'} 
                                        className="me-1" 
                                    />
                                ))}
                            </div>
                            <p className="mb-0 text-muted">{review.comment}</p>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default CourseReviews;
