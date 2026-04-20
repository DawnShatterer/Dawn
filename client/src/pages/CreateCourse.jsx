import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createCourse } from '../api/courseService';
import { getUserInfo } from '../utils/authUtils';
import { Form, Button, Card, Container, Spinner, Alert, Row, Col } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { toast } from 'react-toastify';
import api from '../api/axios';

const IT_CATEGORIES = [
    "Web Development", "Mobile App Development", "Data Science & Analytics", 
    "Cloud Computing", "Cybersecurity", "Game Development", 
    "Database Management", "UI/UX Design", "Networking", "Other IT & Software"
];

const CreateCourse = () => {
    const user = getUserInfo();
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const [formData, setFormData] = useState({ title: '', description: '', category: 'Web Development', isSequential: false });
    const [assignedInstructorId, setAssignedInstructorId] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch teachers list only if user is Admin
    const { data: teachers } = useQuery({
        queryKey: ['teachers-list'],
        queryFn: async () => {
            const res = await api.get('/Auth/all-users?roles=Teacher');
            return res.data;
        },
        enabled: isAdmin
    });

    const mutation = useMutation({
        mutationFn: createCourse,
        onSuccess: () => {
            queryClient.invalidateQueries(['courses']);
            toast.success('🎉 Course published successfully!', {
                position: 'bottom-right',
                autoClose: 3500,
            });
            navigate('/dashboard');
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || 'Failed to publish course. Please try again.');
        }
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
        data.append('IsPublished', true); // Always publish when creating a course
        
        if (thumbnailFile) {
            data.append('ThumbnailFile', thumbnailFile);
        }

        // If Admin selected an instructor, include it
        if (isAdmin && assignedInstructorId) {
            data.append('AssignedInstructorId', assignedInstructorId);
        }

        mutation.mutate(data);
    };

    return (
        <Container className="py-4" style={{ maxWidth: '900px' }}>
            <Card className="border-0 shadow-sm p-4">
                <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                    <div className="bg-primary bg-opacity-10 p-2 rounded me-3 text-primary">
                        <i className="bi bi-plus-circle" style={{ fontSize: '24px' }}></i>
                    </div>
                    <div>
                        <h3 className="mb-0 fw-bold">Create New Course</h3>
                        <p className="text-muted small mb-0">Set up your new course syllabus and marketing details.</p>
                    </div>
                </div>

                {mutation.isError && (
                    <Alert variant="danger" className="border-0 shadow-sm">
                        <strong>Error:</strong> {mutation.error?.response?.data?.message || mutation.error?.response?.data || 'Failed to save course. Check your connection.'}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col lg={8}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Course Title</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Fullstack Development with .NET & React"
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
                                    id="sequential-switch"
                                    label="Sequential Learning (Lock videos until previous is watched)"
                                    checked={formData.isSequential}
                                    onChange={(e) => setFormData({ ...formData, isSequential: e.target.checked })}
                                />
                            </Form.Group>

                            {/* Admin-only: Assign Instructor */}
                            {isAdmin && (
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                                        <i className="bi bi-people text-info" style={{ fontSize: '16px' }}></i> Assign to Instructor
                                    </Form.Label>
                                    <Form.Select
                                        value={assignedInstructorId}
                                        onChange={(e) => setAssignedInstructorId(e.target.value)}
                                    >
                                        <option value="">Platform Module (No departmental budget assigned)</option>
                                        {teachers?.map((t) => (
                                            <option key={t.id} value={t.id}>{t.fullName}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        {assignedInstructorId 
                                            ? 'The selected instructor is officially assigned to teach this curriculum.'
                                            : 'This curriculum will be managed by general platform staff.'}
                                    </Form.Text>
                                </Form.Group>
                            )}

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={6}
                                    placeholder="Provide a detailed overview of the course content..."
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
                                            <small className="text-muted fw-bold text-center px-3">Click to upload a cover image</small>
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
                            onClick={() => navigate('/dashboard')}
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
                                <><Spinner size="sm" className="me-2" /> Publishing...</>
                            ) : 'Publish Course'}
                        </Button>
                    </div>
                </Form>
            </Card>
        </Container>
    );
};

export default CreateCourse;