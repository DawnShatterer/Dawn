import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getCourseById, updateCourse } from '../api/courseService';
import { Form, Button, Card, Container, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { Edit3, ArrowLeft, Image as ImageIcon } from 'lucide-react';

const EditCourse = () => {
    const { id } = useParams();
    const [formData, setFormData] = useState({ title: '', description: '', price: 0 });
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: course, isLoading } = useQuery({
        queryKey: ['course', id],
        queryFn: () => getCourseById(id)
    });

    useEffect(() => {
        if (course) {
            setFormData({
                title: course.title || '',
                description: course.description || '',
                price: course.price || 0
            });
            if (course.thumbnailUrl) {
                setPreviewUrl(course.thumbnailUrl.startsWith('http') ? course.thumbnailUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${course.thumbnailUrl}`);
            }
        }
    }, [course]);

    const mutation = useMutation({
        mutationFn: (payload) => updateCourse(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(['courses']);
            queryClient.invalidateQueries(['course', id]);
            queryClient.invalidateQueries(['analytics']);
            navigate('/analytics');
        },
    });

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setThumbnailFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('Title', formData.title);
        data.append('Description', formData.description);
        data.append('Price', formData.price === '' ? 0 : parseFloat(formData.price));
        
        if (thumbnailFile) {
            data.append('ThumbnailFile', thumbnailFile);
        }

        mutation.mutate(data);
    };

    if (isLoading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading Course Data...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4" style={{ maxWidth: '900px' }}>
            <Button variant="link" className="text-decoration-none text-muted mb-3 p-0" onClick={() => navigate('/analytics')}>
                <ArrowLeft size={16} className="me-1" /> Back to Dashboard
            </Button>
            
            <Card className="border-0 shadow-sm p-4">
                <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                    <div className="bg-primary bg-opacity-10 p-2 rounded me-3 text-primary">
                        <Edit3 size={24} />
                    </div>
                    <div>
                        <h3 className="mb-0 fw-bold">Edit Course Settings</h3>
                        <p className="text-muted small mb-0">Update your syllabus and marketing details.</p>
                    </div>
                </div>

                {mutation.isError && (
                    <Alert variant="danger" className="border-0 shadow-sm">
                        <strong>Error:</strong> {mutation.error?.response?.data?.message || mutation.error?.response?.data || 'Failed to sync modifications.'}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col lg={8}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Course Title</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={6}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-semibold">Price (NPR)</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    style={{ maxWidth: '200px' }}
                                />
                            </Form.Group>
                        </Col>
                        
                        <Col lg={4}>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-semibold">Thumbnail Image</Form.Label>
                                <div 
                                    className="d-flex flex-column align-items-center justify-content-center p-3 rounded" 
                                    style={{ border: '2px dashed #dee2e6', cursor: 'pointer', minHeight: '180px', backgroundColor: '#f8f9fa' }}
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Thumbnail Preview" style={{ width: '100%', borderRadius: '4px', objectFit: 'cover' }} />
                                    ) : (
                                        <>
                                            <ImageIcon size={40} className="text-secondary mb-2" />
                                            <small className="text-muted fw-bold text-center px-3">Click to upload a new cover image</small>
                                        </>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    style={{ display: 'none' }} 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.75rem' }}>
                                    Recommended: 1280x720px (16:9). JPG or PNG.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                        <Button
                            variant="light"
                            onClick={() => navigate('/analytics')}
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            className="px-4 fw-bold"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? (
                                <><Spinner size="sm" className="me-2" /> Synching...</>
                            ) : 'Save Updates'}
                        </Button>
                    </div>
                </Form>
            </Card>
        </Container>
    );
};

export default EditCourse;
