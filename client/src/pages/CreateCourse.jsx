import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createCourse } from '../api/courseService';
import { Form, Button, Card, Container, Spinner, Alert } from 'react-bootstrap';
import { PlusCircle, ArrowLeft } from 'lucide-react';

const CreateCourse = () => {
    const [formData, setFormData] = useState({ title: '', description: '', price: 0 });
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createCourse,
        onSuccess: () => {
            // Refreshes the dashboard list so the new course appears immediately
            queryClient.invalidateQueries(['courses']);
            navigate('/dashboard');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ ...formData, price: parseFloat(formData.price) });
    };

    return (
        <Container className="py-4" style={{ maxWidth: '800px' }}>
            <Button variant="link" onClick={() => navigate(-1)} className="text-decoration-none mb-3 p-0">
                <ArrowLeft size={18} className="me-1" /> Back
            </Button>

            <Card className="border-0 shadow-sm p-4">
                <div className="d-flex align-items-center mb-4">
                    <PlusCircle className="text-primary me-2" size={28} />
                    <h2 className="mb-0 fw-bold">Create New Course</h2>
                </div>

                {mutation.isError && (
                    <Alert variant="danger">
                        Failed to create course. Error: {mutation.error?.response?.data || 'Server Error'}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Course Title</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. Master React 19 with Vite"
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            placeholder="Describe what students will learn..."
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold">Price ($)</Form.Label>
                        <Form.Control
                            type="number"
                            step="0.01"
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                        />
                    </Form.Group>

                    <div className="d-flex gap-2">
                        <Button variant="primary" type="submit" className="px-4" disabled={mutation.isPending}>
                            {mutation.isPending ? <Spinner size="sm" className="me-2" /> : null}
                            Publish Course
                        </Button>
                        <Button variant="light" onClick={() => navigate('/dashboard')}>Cancel</Button>
                    </div>
                </Form>
            </Card>
        </Container>
    );
};

export default CreateCourse;