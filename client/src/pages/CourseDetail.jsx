import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCourseById } from '../api/courseService';
import { enrollInCourse, unenrollFromCourse, checkEnrollment } from '../api/enrollmentService';
import { getCourseLessons, createLesson, deleteLesson } from '../api/lessonService';
import { getCourseLiveClasses, createLiveClass, deleteLiveClass } from '../api/liveClassService';
import { getCourseAnnouncements, createAnnouncement } from '../api/announcementService';
import { getCourseQuizzes, createQuiz, deleteQuiz } from '../api/quizService';
import { getUserInfo } from '../utils/authUtils';
import { Container, Card, Button, Spinner, Alert, Badge, Form, Row, Col, Tabs, Tab, Modal } from 'react-bootstrap';
import { ArrowLeft, BookOpen, UserPlus, UserMinus, GraduationCap, Video, Plus, Trash2, Radio, ClipboardList, PenTool, MessageSquare, BellRing, CreditCard, Tag } from 'lucide-react';
import LessonViewer from '../components/LessonViewer';
import LiveClassCard from '../components/LiveClassCard';
import QuizBuilder from '../components/QuizBuilder';
import QuizTaker from '../components/QuizTaker';
import DiscussionBoard from '../components/DiscussionBoard';
import CourseAnnouncements from '../components/CourseAnnouncements';
import CourseReviews from '../components/CourseReviews';
import { Star } from 'lucide-react';
import api from '../api/axios';

const CourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = getUserInfo();
    const userRole = user?.role?.toLowerCase();
    const courseId = parseInt(id);

    // Navigation Sub-States
    const [showAddLesson, setShowAddLesson] = useState(false);
    const [showAddClass, setShowAddClass] = useState(false);
    const [showQuizBuilder, setShowQuizBuilder] = useState(false);
    const [takingQuizId, setTakingQuizId] = useState(null);

    // Form Data
    const [lessonData, setLessonData] = useState({ title: '', description: '', order: 1, videoUrl: '' });
    const [videoFile, setVideoFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [pptFile, setPptFile] = useState(null);
    const [assessmentData, setAssessmentData] = useState({ title: '', date: '', description: '' });
    const [showAddAssessment, setShowAddAssessment] = useState(false);
    const [classData, setClassData] = useState({ title: '', topic: '', startTime: new Date().toISOString().slice(0,16), durationMinutes: 60, meetingLink: '', meetingPassword: '' });

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const esewaFormRef = useRef(null);
    const [esewaFormData, setEsewaFormData] = useState(null);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [couponValid, setCouponValid] = useState(null); // null, true, false
    const [couponInfo, setCouponInfo] = useState(null); // { discountPercent, maxDiscountAmount, message }
    const [couponChecking, setCouponChecking] = useState(false);

    // Queries
    const { data: course, isLoading: coursesLoading } = useQuery({ 
        queryKey: ['course', courseId], 
        queryFn: () => getCourseById(courseId),
        enabled: !!courseId
    });
    const { data: enrollmentStatus, isLoading: checkLoading } = useQuery({ queryKey: ['enrollment-check', courseId], queryFn: () => checkEnrollment(courseId), enabled: !!courseId });
    const canViewContent = enrollmentStatus?.isEnrolled || userRole === 'teacher' || userRole === 'admin';

    const { data: lessons, isLoading: lessonsLoading } = useQuery({ queryKey: ['lessons', courseId], queryFn: () => getCourseLessons(courseId), enabled: !!courseId && canViewContent });
    const { data: liveClasses, isLoading: classesLoading } = useQuery({ queryKey: ['liveclasses', courseId], queryFn: () => getCourseLiveClasses(courseId), enabled: !!courseId && canViewContent });
    const { data: quizzes, isLoading: quizzesLoading } = useQuery({ queryKey: ['quizzes', courseId], queryFn: () => getCourseQuizzes(courseId), enabled: !!courseId && canViewContent });

    // Mutations
    const enrollMutation = useMutation({ mutationFn: () => enrollInCourse(courseId), onSuccess: () => { queryClient.invalidateQueries(['enrollment-check', courseId]); queryClient.invalidateQueries(['my-enrollments']); } });
    const unenrollMutation = useMutation({ mutationFn: () => unenrollFromCourse(courseId), onSuccess: () => { queryClient.invalidateQueries(['enrollment-check', courseId]); queryClient.invalidateQueries(['my-enrollments']); } });
    
    const createLessonMutation = useMutation({ mutationFn: createLesson, onSuccess: () => { queryClient.invalidateQueries(['lessons', courseId]); setShowAddLesson(false); } });
    const deleteLessonMutation = useMutation({ mutationFn: deleteLesson, onSuccess: () => queryClient.invalidateQueries(['lessons', courseId]) });

    const createClassMutation = useMutation({ mutationFn: createLiveClass, onSuccess: () => { queryClient.invalidateQueries(['liveclasses', courseId]); setShowAddClass(false); } });
    const deleteClassMutation = useMutation({ mutationFn: deleteLiveClass, onSuccess: () => queryClient.invalidateQueries(['liveclasses', courseId]) });

    const createQuizMutation = useMutation({ mutationFn: createQuiz, onSuccess: () => { queryClient.invalidateQueries(['quizzes', courseId]); setShowQuizBuilder(false); } });
    const deleteQuizMutation = useMutation({ mutationFn: deleteQuiz, onSuccess: () => queryClient.invalidateQueries(['quizzes', courseId]) });

    // Handlers
    const handleAddLesson = (e) => { e.preventDefault(); const formData = new FormData(); formData.append('Title', lessonData.title); formData.append('Description', lessonData.description); formData.append('Order', lessonData.order); formData.append('CourseId', courseId); if (lessonData.videoUrl) formData.append('VideoUrl', lessonData.videoUrl); if (videoFile) formData.append('VideoFile', videoFile); if (pdfFile) formData.append('PdfFile', pdfFile); if (pptFile) formData.append('PptFile', pptFile); createLessonMutation.mutate(formData); };
    const createAssessmentMutation = useMutation({ mutationFn: ({ courseId, data }) => createAnnouncement(courseId, data), onSuccess: () => { setShowAddAssessment(false); setAssessmentData({ title: '', date: '', description: '' }); } });
    const handleAddAssessment = (e) => { e.preventDefault(); createAssessmentMutation.mutate({ courseId, data: { title: `[ASSESSMENT] ${assessmentData.title}`, content: `📅 Date: ${assessmentData.date}\n\n${assessmentData.description}` } }); };
    const handleAddLiveClass = (e) => { e.preventDefault(); createClassMutation.mutate({ ...classData, courseId }); };
    const handleSaveQuiz = (quizData) => { createQuizMutation.mutate(quizData); };

    // Payment handlers
    const handleEnrollClick = () => {
        if (course && course.price > 0) {
            setShowPaymentModal(true);
            setPaymentError('');
        } else {
            enrollMutation.mutate();
        }
    };

    const handlePayWithGateway = async (gateway) => {
        setPaymentLoading(true);
        setPaymentError('');
        try {
            const frontendBase = window.location.origin;
            const backendBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5159';
            
            const res = await api.post('/Payment/initiate', {
                courseId: courseId,
                gateway: gateway,
                couponCode: couponValid ? couponCode : null,
                frontendBaseUrl: frontendBase,
                backendBaseUrl: backendBase
            });

            if (gateway === 'esewa') {
                // eSewa uses HTML form POST submission
                setEsewaFormData({
                    url: res.data.paymentUrl,
                    data: res.data.formData
                });
            } else if (gateway === 'khalti') {
                // Khalti gives a direct redirect URL
                if (res.data.paymentUrl) {
                    window.location.href = res.data.paymentUrl;
                } else {
                    setPaymentError('Failed to get Khalti payment URL.');
                }
            }
        } catch (err) {
            setPaymentError(err.response?.data?.message || 'Failed to initiate payment.');
        } finally {
            setPaymentLoading(false);
        }
    };

    // Auto-submit eSewa form when data is ready
    useEffect(() => {
        if (esewaFormData && esewaFormRef.current) {
            esewaFormRef.current.submit();
        }
    }, [esewaFormData]);

    // Coupon validation handler
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponChecking(true);
        setCouponValid(null);
        setCouponInfo(null);
        try {
            const res = await api.get(`/Points/validate-coupon/${couponCode.trim()}`);
            setCouponValid(true);
            setCouponInfo(res.data);
        } catch (err) {
            setCouponValid(false);
            setCouponInfo({ message: err.response?.data?.message || 'Invalid coupon.' });
        } finally {
            setCouponChecking(false);
        }
    };

    const getDiscountedPrice = () => {
        if (!couponValid || !couponInfo || !course) return course?.price || 0;
        let discount = (course.price * couponInfo.discountPercent) / 100;
        if (couponInfo.maxDiscountAmount && discount > couponInfo.maxDiscountAmount) discount = couponInfo.maxDiscountAmount;
        return Math.max(course.price - discount, 10);
    };

    if (coursesLoading || checkLoading) return <div className="text-center mt-5 pt-5"><Spinner animation="border" variant="primary" /></div>;
    if (!course) return <Container className="py-5"><Alert variant="warning">Course Not Found</Alert></Container>;

    const isEnrolled = enrollmentStatus?.isEnrolled;
    const isOwner = course.instructorId === user?.id;

    return (
        <Container className="py-4" style={{ maxWidth: '900px' }}>


            {/* Course Header */}
            <Card className="border-0 shadow-sm overflow-hidden mb-4">
                <div className="bg-primary bg-gradient text-white p-4 d-flex align-items-center mb-0">
                    <div className="bg-body bg-opacity-25 p-2 rounded-3 me-3"><BookOpen size={28} /></div>
                    <div>
                        <h2 className="fw-bold mb-1">{course.title}</h2>
                        <div className="d-flex align-items-center mb-2">
                            <Badge bg="light" text="dark" className="px-2 py-1 me-3">{course.price > 0 ? `Rs. ${Number(course.price).toFixed(2)}` : 'Free'}</Badge>
                            <span className="text-warning d-flex align-items-center fw-bold me-2">
                                <Star size={16} fill="currentColor" className="me-1" />
                                {course.averageRating > 0 ? course.averageRating.toFixed(1) : 'New'}
                            </span>
                            <span className="text-light opacity-75 small">({course.totalReviews} reviews)</span>
                        </div>
                    </div>
                </div>
                <Card.Body className="p-4">
                    <p className="text-muted mb-4">{course.description || 'No description provided.'}</p>
                    <div className="d-flex gap-2 mt-3">
                        {(!isOwner && userRole !== 'admin') && !isEnrolled && <Button variant="primary" className="fw-bold shadow-sm" onClick={handleEnrollClick} disabled={enrollMutation.isPending}>{enrollMutation.isPending ? 'Enrolling...' : <><UserPlus size={16} className="me-2" /> {course.price > 0 ? `Enroll - Rs. ${Number(course.price).toFixed(0)}` : 'Enroll Now'}</>}</Button>}
                        {isEnrolled && <><Badge bg="success" className="px-3 py-2 fs-6"><GraduationCap size={16} className="me-2"/> Enrolled</Badge><Button variant="outline-danger" size="sm" onClick={() => { if(window.confirm('Unenroll?')) unenrollMutation.mutate(); }} disabled={unenrollMutation.isPending}><UserMinus size={14} className="me-1" /> Unenroll</Button></>}
                        {isOwner && <Badge bg="info" className="px-3 py-2 fs-6">You created this course</Badge>}
                    </div>
                </Card.Body>
            </Card>

            {/* Content Tabs */}
            {canViewContent && (
                <Tabs defaultActiveKey="announcements" className="mb-4 fw-bold">
                    
                    {/* ANNOUNCEMENTS */}
                    <Tab eventKey="announcements" title={<><BellRing size={18} className="me-2 mb-1" style={{color: '#6f42c1'}}/>Updates</>}>
                        <CourseAnnouncements courseId={courseId} isOwner={isOwner} userRole={userRole} />
                    </Tab>

                    {/* RECORDED LESSONS */}
                    <Tab eventKey="lessons" title={<><Video size={18} className="me-2 mb-1"/>Lessons</>}>
                        <div className="p-3">
                            <div className="d-flex justify-content-between mb-4"><h4 className="fw-bold m-0">Course Material</h4>{isOwner && <Button size="sm" onClick={() => setShowAddLesson(!showAddLesson)}><Plus size={16} className="me-1" /> {showAddLesson ? 'Cancel' : 'Upload Lesson'}</Button>}</div>
                            {isOwner && showAddLesson && (
                                <Card className="border-0 shadow-sm mb-4 bg-body-tertiary"><Card.Body className="p-4"><h5 className="fw-bold mb-3">Upload Lesson</h5>
                                    <Form onSubmit={handleAddLesson}>
                                        <Row><Col md={8}><Form.Group className="mb-3"><Form.Label>Title</Form.Label><Form.Control required value={lessonData.title} onChange={(e) => setLessonData({...lessonData, title: e.target.value})} /></Form.Group></Col><Col md={4}><Form.Group className="mb-3"><Form.Label>Order</Form.Label><Form.Control type="number" required value={lessonData.order} onChange={(e) => setLessonData({...lessonData, order: parseInt(e.target.value)})} /></Form.Group></Col></Row>
                                        <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={lessonData.description} onChange={(e) => setLessonData({...lessonData, description: e.target.value})} /></Form.Group>
                                        <Form.Group className="mb-3"><Form.Label>Video URL <span className="text-muted small">(YouTube / Google Drive link)</span></Form.Label><Form.Control type="url" placeholder="https://www.youtube.com/watch?v=..." value={lessonData.videoUrl} onChange={(e) => setLessonData({...lessonData, videoUrl: e.target.value})} /></Form.Group>
                                        <Row className="mb-4"><Col md={4}><Form.Group><Form.Label>Video File <span className="text-muted small">(or upload)</span></Form.Label><Form.Control type="file" accept=".mp4,.mkv,.webm" onChange={(e) => setVideoFile(e.target.files[0])} /></Form.Group></Col><Col md={4}><Form.Group><Form.Label>PDF</Form.Label><Form.Control type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])} /></Form.Group></Col><Col md={4}><Form.Group><Form.Label>PPT / Slides</Form.Label><Form.Control type="file" accept=".ppt,.pptx" onChange={(e) => setPptFile(e.target.files[0])} /></Form.Group></Col></Row>
                                        <Button variant="success" type="submit" disabled={createLessonMutation.isPending}>{createLessonMutation.isPending ? 'Uploading...' : 'Save Lesson'}</Button>
                                    </Form>
                                </Card.Body></Card>
                            )}
                            {lessonsLoading && <Spinner animation="border" />}
                            {!lessonsLoading && lessons?.length === 0 && <p className="text-muted">No lessons yet.</p>}
                            {!lessonsLoading && lessons?.map(l => <div key={l.id} className="position-relative">{isOwner && <Button variant="danger" size="sm" className="position-absolute top-0 end-0 m-3 z-3 shadow" onClick={() => { if(window.confirm('Delete?')) deleteLessonMutation.mutate(l.id); }}><Trash2 size={16} /></Button>}<LessonViewer lesson={l} /></div>)}
                        </div>
                    </Tab>
                    
                    {/* LIVE CLASSES */}
                    <Tab eventKey="live" title={<><Radio size={18} className="me-2 mb-1 text-danger"/>Live Classes</>}>
                        <div className="p-3">
                            <div className="d-flex justify-content-between mb-4"><h4 className="fw-bold m-0 text-danger">Live Sessions</h4>{isOwner && <Button variant="danger" size="sm" onClick={() => setShowAddClass(!showAddClass)}><Plus size={16} className="me-1" /> {showAddClass ? 'Cancel' : 'Schedule'}</Button>}</div>
                            {isOwner && showAddClass && (
                                <Card className="border-0 shadow-sm mb-4 border-start border-danger border-4 bg-body-tertiary"><Card.Body className="p-4"><h5 className="fw-bold mb-3 text-danger">Schedule Zoom/Meet</h5>
                                    <Form onSubmit={handleAddLiveClass}>
                                        <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Title</Form.Label><Form.Control required value={classData.title} onChange={(e) => setClassData({...classData, title: e.target.value})} /></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Topic</Form.Label><Form.Control required value={classData.topic} onChange={(e) => setClassData({...classData, topic: e.target.value})} /></Form.Group></Col></Row>
                                        <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Time</Form.Label><Form.Control required type="datetime-local" value={classData.startTime} onChange={(e) => setClassData({...classData, startTime: e.target.value})} /></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Duration (mins)</Form.Label><Form.Control required type="number" value={classData.durationMinutes} onChange={(e) => setClassData({...classData, durationMinutes: parseInt(e.target.value)})} /></Form.Group></Col></Row>
                                        <Row><Col md={8}><Form.Group className="mb-4"><Form.Label>Link</Form.Label><Form.Control required type="url" value={classData.meetingLink} onChange={(e) => setClassData({...classData, meetingLink: e.target.value})} /></Form.Group></Col><Col md={4}><Form.Group className="mb-4"><Form.Label>Password</Form.Label><Form.Control value={classData.meetingPassword} onChange={(e) => setClassData({...classData, meetingPassword: e.target.value})} /></Form.Group></Col></Row>
                                        <Button variant="danger" type="submit" disabled={createClassMutation.isPending}>{createClassMutation.isPending ? 'Saving...' : 'Save'}</Button>
                                    </Form>
                                </Card.Body></Card>
                            )}
                            {classesLoading && <Spinner animation="border" variant="danger"/>}
                            {!classesLoading && liveClasses?.length === 0 && <p className="text-muted">No sessions scheduled.</p>}
                            {!classesLoading && liveClasses?.map(cls => <LiveClassCard key={cls.id} liveClass={cls} isOwner={isOwner} onDelete={(id) => { if(window.confirm('Delete?')) deleteClassMutation.mutate(id); }} />)}
                        </div>
                    </Tab>

                    {/* QUIZZES & ASSIGNMENTS */}
                    <Tab eventKey="quizzes" title={<><ClipboardList size={18} className="me-2 mb-1 text-success"/>Assessments</>}>
                        <div className="p-3">
                            {takingQuizId ? (
                                <QuizTaker quizId={takingQuizId} courseId={courseId} onBack={() => setTakingQuizId(null)} />
                            ) : showQuizBuilder ? (
                                <QuizBuilder courseId={courseId} onSave={handleSaveQuiz} onCancel={() => setShowQuizBuilder(false)} />
                            ) : (
                                <>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h4 className="fw-bold m-0 text-success">Assessments & Quizzes</h4>
                                        {isOwner && <div className="d-flex gap-2">
                                            <Button variant="outline-success" size="sm" onClick={() => setShowAddAssessment(!showAddAssessment)}><Plus size={16} className="me-1" /> {showAddAssessment ? 'Cancel' : 'Post Assessment Date'}</Button>
                                            <Button variant="success" size="sm" onClick={() => setShowQuizBuilder(true)}><Plus size={16} className="me-1" /> Create Quiz</Button>
                                        </div>}
                                    </div>
                                    {isOwner && showAddAssessment && (
                                        <Card className="border-0 shadow-sm mb-4 border-start border-4 border-success bg-body-tertiary">
                                            <Card.Body className="p-4">
                                                <h5 className="fw-bold mb-3 text-success">Post Upcoming Assessment Date</h5>
                                                <Form onSubmit={handleAddAssessment}>
                                                    <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Assessment Title</Form.Label><Form.Control required placeholder="e.g. Mid-Term Exam" value={assessmentData.title} onChange={(e) => setAssessmentData({...assessmentData, title: e.target.value})} /></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Date</Form.Label><Form.Control required type="date" value={assessmentData.date} onChange={(e) => setAssessmentData({...assessmentData, date: e.target.value})} /></Form.Group></Col></Row>
                                                    <Form.Group className="mb-3"><Form.Label>Details</Form.Label><Form.Control as="textarea" rows={2} placeholder="Syllabus covered, venue, instructions..." value={assessmentData.description} onChange={(e) => setAssessmentData({...assessmentData, description: e.target.value})} /></Form.Group>
                                                    <Button variant="success" type="submit" disabled={createAssessmentMutation.isPending}>{createAssessmentMutation.isPending ? 'Posting...' : 'Publish & Notify Students'}</Button>
                                                </Form>
                                            </Card.Body>
                                        </Card>
                                    )}
                                    
                                    {quizzesLoading && <Spinner animation="border" variant="success"/>}
                                    {!quizzesLoading && quizzes?.length === 0 && <p className="text-muted py-3">No quizzes have been created yet.</p>}
                                    
                                    {!quizzesLoading && quizzes?.map(quiz => (
                                        <Card key={quiz.id} className="border-0 shadow-sm mb-3 border-start border-4 border-success">
                                            <Card.Body className="p-4 d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5 className="fw-bold text-body mb-1">{quiz.title}</h5>
                                                    <p className="text-muted small mb-0">{quiz.description}</p>
                                                    <Badge bg="light" text="success" className="mt-2"><PenTool size={12} className="me-1"/> {quiz.totalQuestions} Questions</Badge>
                                                </div>
                                                <div>
                                                    {userRole === 'student' && (
                                                        <Button variant="success" className="fw-bold shadow-sm px-4 rounded-pill" onClick={() => setTakingQuizId(quiz.id)}>
                                                            Start Quiz
                                                        </Button>
                                                    )}
                                                    {isOwner && (
                                                        <Button variant="outline-danger" size="sm" className="ms-3" onClick={() => { if(window.confirm('Cannot be undone. Delete?')) deleteQuizMutation.mutate(quiz.id); }}>
                                                            <Trash2 size={16}/>
                                                        </Button>
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </>
                            )}
                        </div>
                    </Tab>

                    {/* DISCUSSIONS */}
                    <Tab eventKey="discussions" title={<><MessageSquare size={18} className="me-2 mb-1 text-primary"/>Discussions</>}>
                        <div className="p-3">
                            <DiscussionBoard courseId={courseId} currentUserId={user?.id} userRole={userRole} />
                        </div>
                    </Tab>

                    {/* REVIEWS - Always visible so students can read before enrolling */}
                    <Tab eventKey="reviews" title={<><Star size={18} className="me-2 mb-1 text-warning"/>Reviews</>}>
                        <div className="p-3">
                            <CourseReviews courseId={courseId} isEnrolled={isEnrolled} userRole={userRole} />
                        </div>
                    </Tab>
                </Tabs>
            )}

            {/* Reviews visible even without enrollment */}
            {!canViewContent && (
                <div className="mt-4">
                    <h5 className="fw-bold mb-3 d-flex align-items-center">
                        <Star size={20} className="me-2 text-warning" /> Student Reviews
                    </h5>
                    <CourseReviews courseId={courseId} isEnrolled={false} userRole={userRole} />
                </div>
            )}

            {/* eSewa Hidden Form (submits automatically) */}
            {esewaFormData && (
                <form ref={esewaFormRef} action={esewaFormData.url} method="POST" style={{ display: 'none' }}>
                    {Object.entries(esewaFormData.data).map(([key, value]) => (
                        <input key={key} type="hidden" name={key} value={value} />
                    ))}
                </form>
            )}

            {/* Payment Gateway Selection Modal */}
            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Choose Payment Method</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    <div className="text-center mb-3">
                        <h5 className="text-muted mb-1">{course?.title}</h5>
                        {couponValid ? (
                            <div>
                                <h5 className="text-muted text-decoration-line-through mb-0">Rs. {Number(course?.price || 0).toFixed(2)}</h5>
                                <h3 className="fw-bold text-success">Rs. {Number(getDiscountedPrice()).toFixed(2)}</h3>
                                <Badge bg="success" className="px-2"><Tag size={12} className="me-1" />{couponInfo.discountPercent}% OFF Applied</Badge>
                            </div>
                        ) : (
                            <h3 className="fw-bold text-success">Rs. {Number(course?.price || 0).toFixed(2)}</h3>
                        )}
                    </div>

                    {/* Coupon Input */}
                    <div className="mb-3">
                        <div className="d-flex gap-2">
                            <Form.Control
                                type="text"
                                placeholder="Have a Dawn Coupon? Enter code..."
                                value={couponCode}
                                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponValid(null); setCouponInfo(null); }}
                                className="py-2"
                                style={{ fontSize: '0.9rem' }}
                            />
                            <Button variant="outline-primary" onClick={handleApplyCoupon} disabled={couponChecking || !couponCode.trim()} className="px-3 fw-bold" style={{ whiteSpace: 'nowrap' }}>
                                {couponChecking ? <Spinner size="sm" /> : 'Apply'}
                            </Button>
                        </div>
                        {couponValid === true && <small className="text-success fw-bold mt-1 d-block">✓ {couponInfo?.message}</small>}
                        {couponValid === false && <small className="text-danger mt-1 d-block">✗ {couponInfo?.message}</small>}
                    </div>

                    {paymentError && <Alert variant="danger" className="py-2 text-sm">{paymentError}</Alert>}

                    <div className="d-grid gap-3">
                        <Button
                            variant="success"
                            size="lg"
                            className="py-3 fw-bold d-flex align-items-center justify-content-center rounded-3 shadow-sm"
                            onClick={() => handlePayWithGateway('esewa')}
                            disabled={paymentLoading}
                            style={{ background: '#60BB46', borderColor: '#60BB46' }}
                        >
                            <CreditCard size={22} className="me-3" />
                            {paymentLoading ? <Spinner size="sm" /> : `Pay Rs. ${Number(getDiscountedPrice()).toFixed(0)} with eSewa`}
                        </Button>

                        <Button
                            size="lg"
                            className="py-3 fw-bold d-flex align-items-center justify-content-center rounded-3 shadow-sm"
                            onClick={() => handlePayWithGateway('khalti')}
                            disabled={paymentLoading}
                            style={{ background: '#5C2D91', borderColor: '#5C2D91', color: '#fff' }}
                        >
                            <CreditCard size={22} className="me-3" />
                            {paymentLoading ? <Spinner size="sm" /> : `Pay Rs. ${Number(getDiscountedPrice()).toFixed(0)} with Khalti`}
                        </Button>
                    </div>

                    <p className="text-muted text-center small mt-3 mb-0">
                        You will be redirected to the payment gateway to complete your transaction securely.
                    </p>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default CourseDetail;
