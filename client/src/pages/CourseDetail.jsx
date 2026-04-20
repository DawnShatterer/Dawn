import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCourseById, permanentlyDeleteCourse } from '../api/courseService';
import { enrollInCourse, unenrollFromCourse, checkEnrollment } from '../api/enrollmentService';
import { getCourseLessons, createLesson, deleteLesson, completeLesson, getCourseProgressStatus } from '../api/lessonService';
import { getCourseLiveClasses, createLiveClass, deleteLiveClass } from '../api/liveClassService';
import { getCourseAnnouncements, createAnnouncement } from '../api/announcementService';
import { getCourseQuizzes, createQuiz, deleteQuiz } from '../api/quizService';
import { getUserInfo } from '../utils/authUtils';
import { validateFileSize, validateFileType, validateYouTubeUrl, validateGoogleDriveUrl, validateMeetingLink } from '../utils/validationUtils';
import { Container, Card, Button, Spinner, Alert, Badge, Form, Row, Col, Tabs, Tab, Modal, ProgressBar } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import LessonViewer from '../components/LessonViewer';
import LiveClassCard from '../components/LiveClassCard';
import QuizBuilder from '../components/QuizBuilder';
import { Helmet } from 'react-helmet-async';
import QuizTaker from '../components/QuizTaker';
import DiscussionBoard from '../components/DiscussionBoard';
import CourseAnnouncements from '../components/CourseAnnouncements';
import CourseAssignments from '../components/CourseAssignments';
import api from '../api/axios';
import { getFileUrl } from '../utils/fileUtils';
import ErrorBoundary from '../components/ErrorBoundary';
import SkeletonLessonList from '../components/SkeletonLessonList';
import SkeletonLoader from '../components/SkeletonLoader';

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
    const [lessonData, setLessonData] = useState({ title: '', description: '', order: 1, videoUrl: '', isFreePreview: false });
    const [videoFile, setVideoFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [pptFile, setPptFile] = useState(null);
    const [lessonError, setLessonError] = useState('');
    const [validationErrors, setValidationErrors] = useState({ video: '', pdf: '', ppt: '', videoUrl: '', meetingLink: '' });
    const videoInputRef = useRef(null);
    const pdfInputRef = useRef(null);
    const pptInputRef = useRef(null);
    const [assessmentData, setAssessmentData] = useState({ title: '', date: '', description: '' });
    const [showAddAssessment, setShowAddAssessment] = useState(false);
    const [classData, setClassData] = useState({ title: '', topic: '', startTime: new Date().toISOString().slice(0,16), durationMinutes: 60, meetingLink: '', meetingPassword: '' });

    // Queries
    const { data: course, isLoading: coursesLoading } = useQuery({ 
        queryKey: ['course', courseId], 
        queryFn: () => getCourseById(courseId),
        enabled: !!courseId
    });
    const { data: enrollmentStatus, isLoading: checkLoading } = useQuery({ queryKey: ['enrollment-check', courseId], queryFn: () => checkEnrollment(courseId), enabled: !!courseId });
    
    // CRITICAL: Wait for enrollment check to complete before evaluating access
    // This prevents race condition where content flashes before enrollment status loads
    const canViewContent = !checkLoading && (
        enrollmentStatus?.isEnrolled || 
        userRole === 'teacher' || 
        userRole === 'admin' ||
        userRole === 'staff'
    );

    const { data: lessons, isLoading: lessonsLoading } = useQuery({ queryKey: ['lessons', courseId], queryFn: () => getCourseLessons(courseId), enabled: !!courseId });
    const { data: liveClasses, isLoading: classesLoading } = useQuery({ queryKey: ['liveclasses', courseId], queryFn: () => getCourseLiveClasses(courseId), enabled: !!courseId && canViewContent });
    const { data: quizzes, isLoading: quizzesLoading } = useQuery({ queryKey: ['quizzes', courseId], queryFn: () => getCourseQuizzes(courseId), enabled: !!courseId && canViewContent });
    const { data: completedLessonIds } = useQuery({ 
        queryKey: ['lesson-progress', courseId], 
        queryFn: () => getCourseProgressStatus(courseId), 
        enabled: !!courseId && enrollmentStatus?.isEnrolled 
    });


    // Mutations

    const createLessonMutation = useMutation({
        mutationFn: createLesson,
        onSuccess: () => {
            queryClient.invalidateQueries(['lessons', courseId]);
            setShowAddLesson(false);
            setLessonData({ title: '', description: '', order: 1, videoUrl: '', isFreePreview: false });
            setVideoFile(null); setPdfFile(null); setPptFile(null);
            if (videoInputRef.current) videoInputRef.current.value = '';
            if (pdfInputRef.current) pdfInputRef.current.value = '';
            if (pptInputRef.current) pptInputRef.current.value = '';
            setLessonError('');
            setValidationErrors({ video: '', pdf: '', ppt: '', videoUrl: '', meetingLink: '' });
        },
        onError: (err) => {
            setLessonError(err?.response?.data?.message || err?.response?.data || 'Failed to save lesson. Please try again.');
        }
    });
    const deleteLessonMutation = useMutation({ mutationFn: deleteLesson, onSuccess: () => queryClient.invalidateQueries(['lessons', courseId]) });

    const createClassMutation = useMutation({ mutationFn: createLiveClass, onSuccess: () => { queryClient.invalidateQueries(['liveclasses', courseId]); setShowAddClass(false); setClassData({ title: '', topic: '', startTime: new Date().toISOString().slice(0,16), durationMinutes: 60, meetingLink: '', meetingPassword: '' }); setValidationErrors(prev => ({ ...prev, meetingLink: '' })); } });
    const deleteClassMutation = useMutation({ mutationFn: deleteLiveClass, onSuccess: () => queryClient.invalidateQueries(['liveclasses', courseId]) });

    const createQuizMutation = useMutation({ mutationFn: createQuiz, onSuccess: () => { queryClient.invalidateQueries(['quizzes', courseId]); setShowQuizBuilder(false); } });
    const deleteQuizMutation = useMutation({ mutationFn: deleteQuiz, onSuccess: () => queryClient.invalidateQueries(['quizzes', courseId]) });

    const permanentDeleteCourseMutation = useMutation({
        mutationFn: permanentlyDeleteCourse,
        onSuccess: () => {
            alert('Course permanently deleted successfully');
            navigate('/courses');
        },
        onError: (err) => {
            alert(err?.response?.data?.Message || 'Failed to delete course');
        }
    });

    const completeLessonMutation = useMutation({
        mutationFn: completeLesson,
        onSuccess: () => {
            queryClient.invalidateQueries(['lesson-progress', courseId]);
            queryClient.invalidateQueries(['enrollment-check', courseId]); // Refresh progress percentage
            queryClient.invalidateQueries(['my-enrollments']);
            queryClient.invalidateQueries(['lessons', courseId]); // Refresh locked state
        }
    });


    // Handlers
    const handleVideoFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size
        const sizeValidation = validateFileSize(file, 100, 'Video');
        if (!sizeValidation.valid) {
            setValidationErrors(prev => ({ ...prev, video: sizeValidation.error }));
            setVideoFile(null);
            if (videoInputRef.current) videoInputRef.current.value = '';
            return;
        }

        // Validate file type
        const typeValidation = validateFileType(file, ['.mp4', '.mkv', '.webm']);
        if (!typeValidation.valid) {
            setValidationErrors(prev => ({ ...prev, video: typeValidation.error }));
            setVideoFile(null);
            if (videoInputRef.current) videoInputRef.current.value = '';
            return;
        }

        // Clear error and set file
        setValidationErrors(prev => ({ ...prev, video: '' }));
        setVideoFile(file);
    };

    const handlePdfFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size
        const sizeValidation = validateFileSize(file, 100, 'PDF');
        if (!sizeValidation.valid) {
            setValidationErrors(prev => ({ ...prev, pdf: sizeValidation.error }));
            setPdfFile(null);
            if (pdfInputRef.current) pdfInputRef.current.value = '';
            return;
        }

        // Validate file type
        const typeValidation = validateFileType(file, ['.pdf']);
        if (!typeValidation.valid) {
            setValidationErrors(prev => ({ ...prev, pdf: typeValidation.error }));
            setPdfFile(null);
            if (pdfInputRef.current) pdfInputRef.current.value = '';
            return;
        }

        // Clear error and set file
        setValidationErrors(prev => ({ ...prev, pdf: '' }));
        setPdfFile(file);
    };

    const handlePptFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size
        const sizeValidation = validateFileSize(file, 100, 'PPT');
        if (!sizeValidation.valid) {
            setValidationErrors(prev => ({ ...prev, ppt: sizeValidation.error }));
            setPptFile(null);
            if (pptInputRef.current) pptInputRef.current.value = '';
            return;
        }

        // Validate file type
        const typeValidation = validateFileType(file, ['.ppt', '.pptx']);
        if (!typeValidation.valid) {
            setValidationErrors(prev => ({ ...prev, ppt: typeValidation.error }));
            setPptFile(null);
            if (pptInputRef.current) pptInputRef.current.value = '';
            return;
        }

        // Clear error and set file
        setValidationErrors(prev => ({ ...prev, ppt: '' }));
        setPptFile(file);
    };

    const handleVideoUrlChange = (e) => {
        const url = e.target.value;
        setLessonData({...lessonData, videoUrl: url});

        // Only validate if URL is not empty
        if (url.trim() === '') {
            setValidationErrors(prev => ({ ...prev, videoUrl: '' }));
            return;
        }

        // Check if it's a YouTube URL or Google Drive URL
        const youtubeValidation = validateYouTubeUrl(url);
        const googleDriveValidation = validateGoogleDriveUrl(url);

        if (!youtubeValidation.valid && !googleDriveValidation.valid) {
            setValidationErrors(prev => ({ 
                ...prev, 
                videoUrl: 'Please enter a valid YouTube or Google Drive URL' 
            }));
        } else {
            setValidationErrors(prev => ({ ...prev, videoUrl: '' }));
        }
    };

    const handleAddLesson = (e) => {
        e.preventDefault();
        setLessonError('');

        // Check if there are any validation errors
        const hasValidationErrors = Object.values(validationErrors).some(error => error !== '');
        if (hasValidationErrors) {
            setLessonError('Please fix validation errors before submitting');
            return;
        }

        const formData = new FormData();
        formData.append('Title', lessonData.title);
        formData.append('Description', lessonData.description || '');
        formData.append('Order', lessonData.order);
        formData.append('CourseId', courseId);
        formData.append('IsFreePreview', lessonData.isFreePreview);
        if (lessonData.videoUrl) formData.append('VideoUrl', lessonData.videoUrl);
        if (videoFile) formData.append('VideoFile', videoFile);
        if (pdfFile) formData.append('PdfFile', pdfFile);
        if (pptFile) formData.append('PptFile', pptFile);
        createLessonMutation.mutate(formData);
    };
    const clearFile = (type) => {
        if (type === 'video') { 
            setVideoFile(null); 
            setValidationErrors(prev => ({ ...prev, video: '' }));
            if (videoInputRef.current) videoInputRef.current.value = ''; 
        }
        if (type === 'pdf') { 
            setPdfFile(null); 
            setValidationErrors(prev => ({ ...prev, pdf: '' }));
            if (pdfInputRef.current) pdfInputRef.current.value = ''; 
        }
        if (type === 'ppt') { 
            setPptFile(null); 
            setValidationErrors(prev => ({ ...prev, ppt: '' }));
            if (pptInputRef.current) pptInputRef.current.value = ''; 
        }
    };
    const createAssessmentMutation = useMutation({ mutationFn: ({ courseId, data }) => createAnnouncement(courseId, data), onSuccess: () => { setShowAddAssessment(false); setAssessmentData({ title: '', date: '', description: '' }); } });
    const handleAddAssessment = (e) => { e.preventDefault(); createAssessmentMutation.mutate({ courseId, data: { title: `[ASSESSMENT] ${assessmentData.title}`, content: `📅 Date: ${assessmentData.date}\n\n${assessmentData.description}` } }); };
    
    const handleMeetingLinkChange = (e) => {
        const url = e.target.value;
        setClassData({...classData, meetingLink: url});

        // Validate meeting link
        const validation = validateMeetingLink(url);
        if (!validation.valid) {
            setValidationErrors(prev => ({ ...prev, meetingLink: validation.error }));
        } else {
            setValidationErrors(prev => ({ ...prev, meetingLink: '' }));
        }
    };

    const handleAddLiveClass = (e) => { 
        e.preventDefault(); 
        
        // Check if there are any validation errors
        if (validationErrors.meetingLink) {
            return;
        }
        
        createClassMutation.mutate({ ...classData, courseId }); 
    };
    const handleSaveQuiz = (quizData) => { createQuizMutation.mutate(quizData); };



    if (!coursesLoading && !course) return <Container className="py-5"><Alert variant="warning">Course Not Found</Alert></Container>;

    const isEnrolled = enrollmentStatus?.isEnrolled;
    const isOwner = course?.instructorId === user?.id;

    return (
        <Container className="py-4" style={{ maxWidth: '900px' }}>
            {course && (
                <Helmet>
                    <title>{course.title} | Dawn Platform</title>
                    <meta name="description" content={course.description || "Master new skills with this course on Dawn Platform."} />
                    
                    {/* Open Graph / Facebook */}
                    <meta property="og:type" content="website" />
                    <meta property="og:title" content={course.title} />
                    <meta property="og:description" content={course.description} />
                    {course.thumbnailUrl && <meta property="og:image" content={getFileUrl(course.thumbnailUrl)} />}
                    
                    {/* Twitter */}
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content={course.title} />
                    <meta name="twitter:description" content={course.description} />
                    {course.thumbnailUrl && <meta name="twitter:image" content={getFileUrl(course.thumbnailUrl)} />}
                </Helmet>
            )}
            {(coursesLoading || checkLoading) ? (
                <div className="py-4">
                    {/* Course Header Skeleton */}
                    <Card className="border-0 shadow-sm overflow-hidden mb-4">
                        <div className="bg-primary bg-gradient text-white p-4 d-flex align-items-center mb-0">
                            <div className="bg-body bg-opacity-25 p-2 rounded-3 me-3">
                                <SkeletonLoader height="60px" width="60px" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <SkeletonLoader height="2rem" width="60%" className="mb-2" />
                                <div className="d-flex align-items-center gap-2">
                                    <SkeletonLoader height="1.5rem" width="80px" />
                                    <SkeletonLoader height="1rem" width="60px" />
                                </div>
                            </div>
                        </div>
                        <Card.Body className="p-4">
                            <SkeletonLoader height="0.875rem" width="100%" className="mb-2" />
                            <SkeletonLoader height="0.875rem" width="95%" className="mb-2" />
                            <SkeletonLoader height="0.875rem" width="85%" className="mb-3" />
                            <div className="d-flex gap-2">
                                <SkeletonLoader height="2.5rem" width="120px" />
                                <SkeletonLoader height="2.5rem" width="120px" />
                            </div>
                        </Card.Body>
                    </Card>
                    
                    {/* Lessons Skeleton */}
                    <SkeletonLessonList count={5} />
                </div>
            ) : (
                <>

            {/* Course Header */}
            <Card className="border-0 shadow-sm overflow-hidden mb-4">
                <div className="bg-primary bg-gradient text-white p-4 d-flex align-items-center mb-0">
                    <div className="bg-body bg-opacity-25 p-2 rounded-3 me-3">
                        {course.thumbnailUrl ? (
                            <img 
                                src={getFileUrl(course.thumbnailUrl)} 
                                alt={course.title} 
                                className="rounded-3" 
                                style={{ width: '60px', height: '60px', objectFit: 'cover' }} 
                            />
                        ) : (
                            <i className="bi bi-book" style={{ fontSize: '28px' }}></i>
                        )}
                    </div>
                    <div>
                        <h2 className="fw-bold mb-1">{course.title}</h2>
                        <div className="d-flex align-items-center mb-2">
                            <Badge bg="info" className="px-2 py-1 me-2">{course.category}</Badge>
                            <span className="text-warning d-flex align-items-center fw-bold me-2">
                                <i className="bi bi-star-fill me-1" style={{ fontSize: '16px' }}></i>
                                {course.averageRating > 0 ? course.averageRating.toFixed(1) : 'New'}
                            </span>
                            <span className="text-light opacity-75 small">({course.totalReviews} reviews)</span>
                        </div>
                    </div>
                </div>
                <Card.Body className="p-4">
                    <p className="text-muted mb-4">{course.description || 'No description provided.'}</p>
                    <div className="d-flex gap-2 mt-3 flex-wrap align-items-center">
                        {(!isOwner && userRole !== 'admin' && userRole !== 'staff') && !isEnrolled && <Badge bg="secondary" className="px-3 py-2 fs-6">Not assigned to this module</Badge>}
                        {isEnrolled && <Badge bg="success" className="px-3 py-2 fs-6"><i className="bi bi-mortarboard me-2" style={{ fontSize: '16px' }}></i> Enrolled / Assigned</Badge>}
                        {isOwner && <Badge bg="info" className="px-3 py-2 fs-6">You are assigned to teach this</Badge>}
                        {userRole === 'admin' && !isOwner && <Badge bg="dark" className="px-3 py-2 fs-6">Admin Mode: Viewing Module</Badge>}
                        {userRole === 'staff' && !isOwner && <Badge bg="dark" className="px-3 py-2 fs-6">Staff Mode: Viewing Module</Badge>}
                        
                        {/* Admin/Staff Management Buttons */}
                        {(userRole === 'admin' || userRole === 'staff') && (
                            <div className="ms-auto d-flex gap-2">
                                <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => navigate(`/edit-course/${course.id}`)}
                                >
                                    <i className="bi bi-pencil me-1"></i> Edit Course
                                </Button>
                                <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => {
                                        if (window.confirm(`Are you sure you want to PERMANENTLY DELETE "${course.title}"? This action cannot be undone and will remove all lessons, assignments, and enrollments.`)) {
                                            permanentDeleteCourseMutation.mutate(course.id);
                                        }
                                    }}
                                    disabled={permanentDeleteCourseMutation.isLoading}
                                >
                                    <i className="bi bi-trash me-1"></i> {permanentDeleteCourseMutation.isLoading ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        )}
                    </div>

                    {isEnrolled && (
                        <div className="mt-4 pt-3 border-top">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="small fw-bold text-muted">YOUR PROGRESS</span>
                                <span className="small fw-bold text-primary">{enrollmentStatus?.progress || 0}%</span>
                            </div>
                            <ProgressBar 
                                now={enrollmentStatus?.progress || 0} 
                                variant={enrollmentStatus?.progress === 100 ? "success" : "primary"} 
                                style={{ height: '8px' }}
                                className="bg-light shadow-none"
                            />
                        </div>
                    )}
                </Card.Body>
            </Card>


            {/* Content Tabs */}
            {canViewContent && (
                <Tabs defaultActiveKey="announcements" className="mb-4 fw-bold">
                    
                    {/* ANNOUNCEMENTS */}
                    <Tab eventKey="announcements" title={<><i className="bi bi-bell me-2 mb-1" style={{color: '#6f42c1', fontSize: '18px'}}></i>Updates</>}>
                        <CourseAnnouncements courseId={courseId} isOwner={isOwner} userRole={userRole} />
                    </Tab>

                    {/* RECORDED LESSONS */}
                    <Tab eventKey="lessons" title={<><i className="bi bi-camera-video me-2 mb-1" style={{ fontSize: '18px' }}></i>Lessons</>}>
                        <div className="p-3">
                            <div className="d-flex justify-content-between mb-4"><h4 className="fw-bold m-0">Course Material</h4>{isOwner && <Button size="sm" onClick={() => setShowAddLesson(!showAddLesson)}><i className="bi bi-plus me-1" style={{ fontSize: '16px' }}></i> {showAddLesson ? 'Cancel' : 'Upload Lesson'}</Button>}</div>
                            {isOwner && showAddLesson && (
                                <Card className="border-0 shadow-sm mb-4 bg-body-tertiary">
                                    <Card.Body className="p-4">
                                        <h5 className="fw-bold mb-3">Upload Lesson</h5>
                                        <Form onSubmit={handleAddLesson}>
                                            <Row>
                                                <Col md={8}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                                                        <Form.Control required value={lessonData.title} onChange={(e) => setLessonData({...lessonData, title: e.target.value})} placeholder="e.g. Introduction to React" />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Order</Form.Label>
                                                        <Form.Control type="number" required min={1} value={lessonData.order} onChange={(e) => setLessonData({...lessonData, order: parseInt(e.target.value)})} />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Form.Group className="mb-3">
                                                <Form.Label>Description</Form.Label>
                                                <Form.Control as="textarea" rows={2} value={lessonData.description} onChange={(e) => setLessonData({...lessonData, description: e.target.value})} placeholder="What will students learn in this lesson?" />
                                            </Form.Group>

                                            <Form.Group className="mb-4">
                                                <Form.Label>Video URL <span className="text-muted small">(YouTube / Google Drive link)</span></Form.Label>
                                                <Form.Control 
                                                    type="url" 
                                                    placeholder="https://www.youtube.com/watch?v=..." 
                                                    value={lessonData.videoUrl} 
                                                    onChange={handleVideoUrlChange}
                                                    isInvalid={!!validationErrors.videoUrl}
                                                />
                                                {validationErrors.videoUrl && (
                                                    <Alert variant="danger" className="mt-2 py-2 mb-0">
                                                        {validationErrors.videoUrl}
                                                    </Alert>
                                                )}
                                            </Form.Group>

                                            <Row className="mb-4 g-3">
                                                <Col md={4}>
                                                    <Form.Label className="fw-medium">Video File <span className="text-muted small">(Under 100 MB only)</span></Form.Label>
                                                    {videoFile ? (
                                                        <div className="d-flex align-items-center gap-2 border rounded-2 px-3 py-2 bg-body">
                                                            <span className="text-truncate small flex-grow-1" title={videoFile.name}>🎬 {videoFile.name}</span>
                                                            <Button variant="link" size="sm" className="p-0 text-danger fw-bold" style={{lineHeight:1}} onClick={() => clearFile('video')}>✕</Button>
                                                        </div>
                                                    ) : (
                                                        <Form.Control 
                                                            ref={videoInputRef} 
                                                            type="file" 
                                                            accept=".mp4,.mkv,.webm" 
                                                            onChange={handleVideoFileChange}
                                                            isInvalid={!!validationErrors.video}
                                                        />
                                                    )}
                                                    {validationErrors.video && (
                                                        <Alert variant="danger" className="mt-2 py-2 mb-0">
                                                            {validationErrors.video}
                                                        </Alert>
                                                    )}
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Label className="fw-medium">PDF <span className="text-muted small">(Under 100 MB only)</span></Form.Label>
                                                    {pdfFile ? (
                                                        <div className="d-flex align-items-center gap-2 border rounded-2 px-3 py-2 bg-body">
                                                            <span className="text-truncate small flex-grow-1" title={pdfFile.name}>📄 {pdfFile.name}</span>
                                                            <Button variant="link" size="sm" className="p-0 text-danger fw-bold" style={{lineHeight:1}} onClick={() => clearFile('pdf')}>✕</Button>
                                                        </div>
                                                    ) : (
                                                        <Form.Control 
                                                            ref={pdfInputRef} 
                                                            type="file" 
                                                            accept=".pdf" 
                                                            onChange={handlePdfFileChange}
                                                            isInvalid={!!validationErrors.pdf}
                                                        />
                                                    )}
                                                    {validationErrors.pdf && (
                                                        <Alert variant="danger" className="mt-2 py-2 mb-0">
                                                            {validationErrors.pdf}
                                                        </Alert>
                                                    )}
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Label className="fw-medium">PPT / Slides <span className="text-muted small">(Under 100 MB only)</span></Form.Label>
                                                    {pptFile ? (
                                                        <div className="d-flex align-items-center gap-2 border rounded-2 px-3 py-2 bg-body">
                                                            <span className="text-truncate small flex-grow-1" title={pptFile.name}>📊 {pptFile.name}</span>
                                                            <Button variant="link" size="sm" className="p-0 text-danger fw-bold" style={{lineHeight:1}} onClick={() => clearFile('ppt')}>✕</Button>
                                                        </div>
                                                    ) : (
                                                        <Form.Control 
                                                            ref={pptInputRef} 
                                                            type="file" 
                                                            accept=".ppt,.pptx" 
                                                            onChange={handlePptFileChange}
                                                            isInvalid={!!validationErrors.ppt}
                                                        />
                                                    )}
                                                    {validationErrors.ppt && (
                                                        <Alert variant="danger" className="mt-2 py-2 mb-0">
                                                            {validationErrors.ppt}
                                                        </Alert>
                                                    )}
                                                </Col>
                                            </Row>

                                            <Form.Group className="mb-4 d-flex align-items-center">
                                                <Form.Check 
                                                    type="switch"
                                                    id="free-preview-switch"
                                                    label="Allow Free Preview for Non-Enrolled Students"
                                                    checked={lessonData.isFreePreview}
                                                    onChange={(e) => setLessonData({...lessonData, isFreePreview: e.target.checked})}
                                                    className="fw-bold text-success"
                                                />
                                            </Form.Group>

                                            {lessonError && (
                                                <Alert variant="danger" className="py-2 mb-3">
                                                    <strong>Upload Failed:</strong> {String(lessonError)}
                                                </Alert>
                                            )}

                                            <Button variant="success" type="submit" className="fw-bold px-4" disabled={createLessonMutation.isPending}>
                                                {createLessonMutation.isPending ? (
                                                    <><Spinner size="sm" className="me-2" />Uploading...</>
                                                ) : 'Save Lesson'}
                                            </Button>
                                        </Form>
                                    </Card.Body>
                                </Card>
                            )}
                            {lessonsLoading && <Spinner animation="border" />}
                            {!lessonsLoading && lessons?.length === 0 && <p className="text-muted">No lessons yet.</p>}
                            {!lessonsLoading && lessons?.map(l => (
                                <div key={l.id} className="position-relative">
                                    {isOwner && <Button variant="danger" size="sm" className="position-absolute top-0 end-0 m-3 z-3 shadow" onClick={() => { if(window.confirm('Delete?')) deleteLessonMutation.mutate(l.id); }}><i className="bi bi-trash" style={{ fontSize: '16px' }}></i></Button>}
                                    <LessonViewer 
                                        lesson={l} 
                                        isStudent={isEnrolled}
                                        isCompleted={completedLessonIds?.includes(l.id)}
                                        onComplete={(lessonId) => completeLessonMutation.mutate(lessonId)}
                                    />
                                </div>
                            ))}

                        </div>
                    </Tab>
                    
                    {/* LIVE CLASSES */}
                    <Tab eventKey="live" title={<><i className="bi bi-broadcast me-2 mb-1 text-danger" style={{ fontSize: '18px' }}></i>Live Classes</>}>
                        <div className="p-3">
                            <div className="d-flex justify-content-between mb-4"><h4 className="fw-bold m-0 text-danger">Live Sessions</h4>{isOwner && <Button variant="danger" size="sm" onClick={() => setShowAddClass(!showAddClass)}><i className="bi bi-plus me-1" style={{ fontSize: '16px' }}></i> {showAddClass ? 'Cancel' : 'Schedule'}</Button>}</div>
                            {isOwner && showAddClass && (
                                <Card className="border-0 shadow-sm mb-4 border-start border-danger border-4 bg-body-tertiary"><Card.Body className="p-4"><h5 className="fw-bold mb-3 text-danger">Schedule Zoom/Meet</h5>
                                    <Form onSubmit={handleAddLiveClass}>
                                        <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Title</Form.Label><Form.Control required value={classData.title} onChange={(e) => setClassData({...classData, title: e.target.value})} /></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Topic</Form.Label><Form.Control required value={classData.topic} onChange={(e) => setClassData({...classData, topic: e.target.value})} /></Form.Group></Col></Row>
                                        <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Time</Form.Label><Form.Control required type="datetime-local" value={classData.startTime} onChange={(e) => setClassData({...classData, startTime: e.target.value})} /></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Duration (mins)</Form.Label><Form.Control required type="number" value={classData.durationMinutes} onChange={(e) => setClassData({...classData, durationMinutes: parseInt(e.target.value)})} /></Form.Group></Col></Row>
                                        <Row><Col md={8}><Form.Group className="mb-4"><Form.Label>Link</Form.Label><Form.Control required type="url" value={classData.meetingLink} onChange={handleMeetingLinkChange} isInvalid={!!validationErrors.meetingLink} /></Form.Group></Col><Col md={4}><Form.Group className="mb-4"><Form.Label>Password</Form.Label><Form.Control value={classData.meetingPassword} onChange={(e) => setClassData({...classData, meetingPassword: e.target.value})} /></Form.Group></Col></Row>
                                        {validationErrors.meetingLink && (
                                            <Alert variant="danger" className="py-2 mb-3">
                                                {validationErrors.meetingLink}
                                            </Alert>
                                        )}
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
                    <Tab eventKey="quizzes" title={<><i className="bi bi-clipboard-check me-2 mb-1 text-success" style={{ fontSize: '18px' }}></i>Assessments</>}>
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
                                            <Button variant="outline-success" size="sm" onClick={() => setShowAddAssessment(!showAddAssessment)}><i className="bi bi-plus me-1" style={{ fontSize: '16px' }}></i> {showAddAssessment ? 'Cancel' : 'Post Assessment Date'}</Button>
                                            <Button variant="success" size="sm" onClick={() => setShowQuizBuilder(true)}><i className="bi bi-plus me-1" style={{ fontSize: '16px' }}></i> Create Quiz</Button>
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
                                                    <Badge bg="light" text="success" className="mt-2"><i className="bi bi-pencil me-1" style={{ fontSize: '12px' }}></i> {quiz.totalQuestions} Questions</Badge>
                                                </div>
                                                <div>
                                                    {userRole === 'student' && (
                                                        <Button variant="success" className="fw-bold shadow-sm px-4 rounded-pill" onClick={() => setTakingQuizId(quiz.id)}>
                                                            Start Quiz
                                                        </Button>
                                                    )}
                                                    {isOwner && (
                                                        <Button variant="outline-danger" size="sm" className="ms-3" onClick={() => { if(window.confirm('Cannot be undone. Delete?')) deleteQuizMutation.mutate(quiz.id); }}>
                                                            <i className="bi bi-trash" style={{ fontSize: '16px' }}></i>
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

                    {/* ASSIGNMENTS */}
                    <Tab eventKey="assignments" title={<><i className="bi bi-file-text me-2 mb-1 text-primary" style={{ fontSize: '18px' }}></i>Assignments</>}>
                        <div className="p-4">
                            <CourseAssignments courseId={courseId} canViewContent={canViewContent} userRole={userRole} />
                        </div>
                    </Tab>

                    {/* DISCUSSIONS */}
                    <Tab eventKey="discussions" title={<><i className="bi bi-chat-square-text me-2 mb-1 text-primary" style={{ fontSize: '18px' }}></i>Discussions</>}>
                        <div className="p-3">
                            <DiscussionBoard courseId={courseId} currentUserId={user?.id} userRole={userRole} />
                        </div>
                    </Tab>

                </Tabs>
            )}
            
            {/* Show access denial message if not enrolled and not loading */}
            {!canViewContent && !checkLoading && (
                <Alert variant="warning" className="mt-4">
                    <strong>Enrollment Required</strong>
                    <p className="mb-0 mt-2">You must be enrolled in this course to view the content.</p>
                </Alert>
            )}
            
            {/* Payment Modal removed */}


                </>
            )}
        </Container>
    );
};

const CourseDetailWithBoundary = () => (
    <ErrorBoundary>
        <CourseDetail />
    </ErrorBoundary>
);

export default CourseDetailWithBoundary;
