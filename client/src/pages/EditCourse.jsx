import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getCourseById, updateCourse } from '../api/courseService';
import { Form, Button, Card, Container, Alert, Row, Col, Spinner } from 'react-bootstrap';
import GlobalSpinner from '../components/GlobalSpinner';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getFileUrl } from '../utils/fileUtils';

const IT_CATEGORIES = [
    "Web Development", "Mobile App Development", "Data Science & Analytics", 
    "Cloud Computing", "Cybersecurity", "Game Development", 
    "Database Management", "UI/UX Design", "Networking", "Other IT & Software"
];

const EditCourse = () => {
    const { id } = useParams();
    const [formData, setFormData] = useState({ title: '', description: '', category: 'Web Development', isSequential: false, isPublished: false });
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
                category: course.category || 'Web Development',
                isSequential: course.isSequential || false,
                isPublished: course.isPublished || false
            });
            if (course.thumbnailUrl) {
                setPreviewUrl(getFileUrl(course.thumbnailUrl));
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
        data.append('Category', formData.category);

        data.append('IsSequential', formData.isSequential);
        data.append('IsPublished', formData.isPublished);
        
        if (thumbnailFile) {
            data.append('ThumbnailFile', thumbnailFile);
        }

        mutation.mutate(data);
    };

    if (isLoading) {
        return <GlobalSpinner message="Loading course data..." />;
    }

    return (
        <Container className="py-4" style={{ maxWidth: '900px' }}>
            <Card className="border-0 shadow-sm p-4">
                <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                    <div className="bg-primary bg-opacity-10 p-2 rounded me-3 text-primary">
                        <i className="bi bi-pencil-square" style={{ fontSize: '24px' }}></i>
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
                                <Form.Label className="fw-semibold">Category</Form.Label>
                                <Form.Select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {IT_CATEGORIES.map((cat, idx) => (
                                        <option value={cat} key={idx}>{cat}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="switch"
                                    id="sequential-switch-edit"
                                    label="Sequential Learning (Lock videos until previous is watched)"
                                    checked={formData.isSequential}
                                    onChange={(e) => setFormData({ ...formData, isSequential: e.target.checked })}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="switch"
                                    id="publish-switch-edit"
                                    label="Published (Visible to students in the catalog)"
                                    checked={formData.isPublished}
                                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                />
                                <Form.Text className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '2.5rem' }}>
                                    Keep unchecked to save as a private draft.
                                </Form.Text>
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
                                            <i className="bi bi-image text-secondary mb-2" style={{ fontSize: '40px' }}></i>
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
