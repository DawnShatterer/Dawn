import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

const QuizBuilder = ({ courseId, onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([
        { text: '', points: 1, options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }
    ]);

    const addQuestion = () => {
        setQuestions([...questions, { text: '', points: 1, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }]);
    };

    const removeQuestion = (index) => {
        const newQ = [...questions];
        newQ.splice(index, 1);
        setQuestions(newQ);
    };

    const updateQuestion = (index, field, value) => {
        const newQ = [...questions];
        newQ[index][field] = value;
        setQuestions(newQ);
    };

    const addOption = (qIndex) => {
        const newQ = [...questions];
        newQ[qIndex].options.push({ text: '', isCorrect: false });
        setQuestions(newQ);
    };

    const updateOption = (qIndex, oIndex, field, value) => {
        const newQ = [...questions];
        if (field === 'isCorrect' && value === true) {
            // Uncheck others for single correct answer
            newQ[qIndex].options.forEach(o => o.isCorrect = false);
        }
        newQ[qIndex].options[oIndex][field] = value;
        setQuestions(newQ);
    };

    const removeOption = (qIndex, oIndex) => {
        const newQ = [...questions];
        newQ[qIndex].options.splice(oIndex, 1);
        setQuestions(newQ);
    };

    const handleSave = (e) => {
        e.preventDefault();
        onSave({ title, description, courseId, questions });
    };

    return (
        <Card className="border-0 shadow mb-4">
            <Card.Header className="bg-primary text-white p-4">
                <h4 className="fw-bold mb-0">Create New Assessment</h4>
            </Card.Header>
            <Card.Body className="p-4">
                <Form onSubmit={handleSave}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Quiz Title</Form.Label>
                        <Form.Control required value={title} onChange={e => setTitle(e.target.value)} placeholder="Midterm Exam" />
                    </Form.Group>
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Instructions / Description</Form.Label>
                        <Form.Control as="textarea" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
                    </Form.Group>

                    <h5 className="fw-bold border-bottom pb-2 mb-4">Questions</h5>
                    
                    {questions.map((q, qIndex) => (
                        <Card key={qIndex} className="mb-4 border border-light bg-body-tertiary shadow-sm">
                            <Card.Body className="p-3">
                                <div className="d-flex justify-content-between mb-3">
                                    <Badge bg="secondary" className="fs-6 px-3 py-2">Question {qIndex + 1}</Badge>
                                    <Button variant="outline-danger" size="sm" onClick={() => removeQuestion(qIndex)}><i className="bi bi-trash" style={{ fontSize: '16px' }}></i></Button>
                                </div>
                                <Row className="mb-3">
                                    <Col md={9}>
                                        <Form.Control required placeholder="Question text..." value={q.text} onChange={e => updateQuestion(qIndex, 'text', e.target.value)} />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Control type="number" min="1" required placeholder="Points" value={q.points} onChange={e => updateQuestion(qIndex, 'points', parseInt(e.target.value))} />
                                    </Col>
                                </Row>

                                <div className="ps-3 border-start border-3 border-warning">
                                    {q.options.map((opt, oIndex) => (
                                        <div key={oIndex} className="d-flex align-items-center mb-2 gap-2">
                                            <Form.Check 
                                                type="radio" 
                                                name={`correct-${qIndex}`} 
                                                checked={opt.isCorrect} 
                                                onChange={(e) => updateOption(qIndex, oIndex, 'isCorrect', e.target.checked)} 
                                            />
                                            <Form.Control 
                                                size="sm" 
                                                required 
                                                placeholder={`Option ${oIndex + 1}`} 
                                                value={opt.text} 
                                                onChange={e => updateOption(qIndex, oIndex, 'text', e.target.value)} 
                                            />
                                            {q.options.length > 2 && (
                                                <Button variant="link" className="text-danger p-0 ms-1" onClick={() => removeOption(qIndex, oIndex)}><i className="bi bi-trash" style={{ fontSize: '14px' }}></i></Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button variant="link" className="text-decoration-none small p-0 mt-1" onClick={() => addOption(qIndex)}>
                                        <i className="bi bi-plus me-1" style={{ fontSize: '14px' }}></i> Add Option
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}

                    <Button variant="outline-primary" className="mb-4 w-100 py-2 border-dashed" style={{ borderStyle: 'dashed' }} onClick={addQuestion}>
                        <i className="bi bi-plus me-2" style={{ fontSize: '18px' }}></i> Add Another Question
                    </Button>

                    <div className="d-flex justify-content-end gap-2 border-top pt-4">
                        <Button variant="light" onClick={onCancel}>Cancel</Button>
                        <Button variant="primary" type="submit" className="fw-bold px-4"><i className="bi bi-check-circle me-2" style={{ fontSize: '18px' }}></i> Save Assessment</Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default QuizBuilder;
