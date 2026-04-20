import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuizDetails, submitQuiz } from '../api/quizService';
import { Card, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

const QuizTaker = ({ quizId, courseId, onBack }) => {
    const queryClient = useQueryClient();
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);

    const { data: quiz, isLoading, isError } = useQuery({
        queryKey: ['quizDetail', quizId],
        queryFn: () => getQuizDetails(quizId),
        enabled: !!quizId && !result
    });

    const submitMutation = useMutation({
        mutationFn: (data) => submitQuiz(quizId, data),
        onSuccess: (data) => {
            setResult(data);
            // Invalidate grade roster to refresh when quizzes are submitted
            queryClient.invalidateQueries(['course-grades']);
        }
    });

    const handleSelect = (questionId, optionId) => {
        setAnswers({ ...answers, [questionId]: optionId });
    };

    const handleSubmit = () => {
        if (!quiz) return;
        const totalQ = quiz.questions.length;
        if (Object.keys(answers).length < totalQ) {
            if (!window.confirm("You have unanswered questions! Are you sure you want to submit?")) {
                return;
            }
        }
        submitMutation.mutate({ quizId, answers });
    };

    if (isLoading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
    if (isError) return <Alert variant="danger">Failed to load quiz details.</Alert>;
    if (!quiz) return null;

    if (result) {
        // Show result screen
        const passed = result.percentage >= 60;
        return (
            <Card className="border-0 shadow-lg mb-4 bg-body text-center">
                <Card.Body className="p-5">
                    <i className={`bi bi-award mb-3 ${passed ? 'text-success' : 'text-danger'}`} style={{ fontSize: '64px' }}></i>
                    <h2 className="fw-bold mb-2">{passed ? 'Congratulations!' : 'Keep Trying!'}</h2>
                    <p className="text-muted fs-5 mb-4">You have completed the assessment.</p>
                    
                    <div className="bg-body-tertiary rounded-4 p-4 mb-4 d-inline-block">
                        <div className="fs-1 fw-bold text-body mb-1">{result.score} / {result.totalPoints}</div>
                        <Badge bg={passed ? 'success' : 'danger'} className="fs-6 px-3 py-2 rounded-pill">
                            {result.percentage.toFixed(1)}% Score
                        </Badge>
                    </div>

                    <div>
                        <Button variant="outline-primary" onClick={onBack} size="lg" className="px-5 rounded-pill fw-bold">
                            Return to Course
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-primary text-white p-4 d-flex justify-content-between align-items-center">
                <div>
                    <h4 className="fw-bold mb-1">{quiz.title}</h4>
                    <p className="mb-0 opacity-75 small">{quiz.description}</p>
                </div>
                <Badge bg="light" text="primary" className="fs-6 px-3 py-2">
                    {quiz.questions.length} Questions
                </Badge>
            </Card.Header>
            <Card.Body className="p-4 p-md-5">
                {quiz.questions.map((q, index) => (
                    <div key={q.id} className="mb-5 border-bottom pb-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <h5 className="fw-bold lh-base d-flex">
                                <span className="text-primary me-2">{index + 1}.</span> {q.text}
                            </h5>
                            <Badge bg="secondary" className="ms-3">{q.points} {q.points === 1 ? 'pt' : 'pts'}</Badge>
                        </div>
                        
                        <div className="ps-4">
                            {q.options.map(opt => (
                                <Form.Check 
                                    key={opt.id}
                                    type="radio"
                                    id={`q${q.id}-opt${opt.id}`}
                                    name={`question-${q.id}`}
                                    label={opt.text}
                                    className="mb-2 fs-5"
                                    onChange={() => handleSelect(q.id, opt.id)}
                                    checked={answers[q.id] === opt.id}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                <div className="d-flex justify-content-between align-items-center mt-5 pt-3">
                    <Button variant="light" onClick={onBack} className="fw-bold px-4">Exit Assessment</Button>
                    <Button 
                        variant="success" 
                        size="lg" 
                        className="fw-bold px-5 rounded-pill shadow"
                        onClick={handleSubmit}
                        disabled={submitMutation.isPending}
                    >
                        {submitMutation.isPending ? 'Submitting...' : <><i className="bi bi-check-circle me-2" style={{ fontSize: '20px' }}></i> Submit Assessment</>}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default QuizTaker;
