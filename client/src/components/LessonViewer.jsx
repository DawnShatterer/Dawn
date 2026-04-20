import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getFileUrl } from '../utils/fileUtils';

const LessonViewer = ({ lesson, isCompleted, onComplete, isStudent }) => {

    const isYouTubeUrl = (url) => {
        if (!url) return false;
        return url.includes('youtube.com') || url.includes('youtu.be');
    };

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        let videoId = null;
        if (url.includes('youtube.com/watch')) {
            const urlObj = new URL(url);
            videoId = urlObj.searchParams.get('v');
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    };

    const isExternalVideoLink = (url) => {
        if (!url) return false;
        return url.startsWith('http') && !isYouTubeUrl(url);
    };

    const videoUrl = getFileUrl(lesson.videoUrl);
    const pdfUrl = getFileUrl(lesson.pdfUrl);
    const pptUrl = getFileUrl(lesson.pptUrl);

    return (
        <Card className={`border-0 shadow-sm mb-4 ${isCompleted ? 'border-start border-success border-4' : ''}`}>
            <Card.Header className="bg-body border-bottom-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-start">
                <h4 className="fw-bold d-flex align-items-center mb-1 text-truncate">
                    {lesson.isLocked ? (
                        <div className="bg-secondary bg-opacity-10 p-2 rounded-circle me-3 text-secondary d-flex">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                    ) : (
                        <i className="bi bi-play-circle text-primary me-2 flex-shrink-0" style={{ fontSize: '24px' }}></i> 
                    )}
                    <span className={lesson.isLocked ? 'text-muted' : ''}>{lesson.title}</span>
                    {lesson.isFreePreview && <Badge bg="info" className="ms-2 small fw-bold" style={{ fontSize: '0.65rem' }}>FREE PREVIEW</Badge>}
                    {isCompleted && <Badge bg="success" pill className="ms-2 small fw-normal" style={{ fontSize: '0.7rem' }}>Completed</Badge>}
                </h4>
                
                {isStudent && !lesson.isLocked && (
                    <Button 
                        variant={isCompleted ? "success" : "outline-primary"} 
                        size="sm" 
                        className="rounded-pill d-flex align-items-center fw-bold text-nowrap ms-3"
                        onClick={() => onComplete(lesson.id)}
                        disabled={isCompleted}
                    >
                        {isCompleted ? <><i className="bi bi-check-circle me-1" style={{ fontSize: '14px' }}></i> Finished</> : <><i className="bi bi-circle me-1" style={{ fontSize: '14px' }}></i> Mark Complete</>}
                    </Button>
                )}
            </Card.Header>
            <Card.Body className="p-4">
                {lesson.isLocked ? (
                    <div className="text-center py-5 my-3 bg-secondary bg-opacity-10 rounded">
                        <p className="text-muted mb-0 fw-bold">This lesson is locked.</p>
                        {isStudent ? (
                            <small className="text-muted">Please complete the previous lesson to unlock this content.</small>
                        ) : (
                            <small className="text-primary fw-bold">Enroll in this course to unlock all lessons.</small>
                        )}
                    </div>
                ) : (
                    <>
                        <p className="text-muted mb-4">{lesson.description}</p>

                {/* YouTube Embed */}
                {videoUrl && isYouTubeUrl(videoUrl) && (
                    <div className="ratio ratio-16x9 bg-black rounded overflow-hidden shadow mb-4">
                        <iframe
                            src={getYouTubeEmbedUrl(videoUrl)}
                            title={lesson.title}
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            className="w-100 h-100"
                            style={{ border: 'none' }}
                        />
                    </div>
                )}

                {/* External Video Link (Google Drive, etc) */}
                {videoUrl && isExternalVideoLink(videoUrl) && (
                    <div className="d-flex align-items-center p-3 bg-body-tertiary rounded border mb-4">
                        <div className="bg-primary bg-opacity-10 p-2 rounded me-3 text-primary"><i className="bi bi-play-circle" style={{ fontSize: '24px' }}></i></div>
                        <div className="flex-grow-1">
                            <h6 className="mb-0 fw-bold">Video Lecture</h6>
                            <small className="text-muted">External Link</small>
                        </div>
                        <Button variant="primary" size="sm" href={videoUrl} target="_blank" rel="noopener noreferrer">
                            Watch Video
                        </Button>
                    </div>
                )}

                {/* Self-hosted Video */}
                {videoUrl && !videoUrl.startsWith('http') && (
                    <div className="ratio ratio-16x9 bg-black rounded overflow-hidden shadow mb-4">
                        <video 
                            controls 
                            controlsList="nodownload" 
                            src={videoUrl}
                            className="w-100 h-100 object-fit-contain"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )}

                {/* Self-hosted video with full URL (from getFullUrl) */}
                {videoUrl && videoUrl.startsWith('http') && !isYouTubeUrl(lesson.videoUrl) && !isExternalVideoLink(lesson.videoUrl) && (
                    <div className="ratio ratio-16x9 bg-black rounded overflow-hidden shadow mb-4">
                        <video 
                            controls 
                            controlsList="nodownload" 
                            src={videoUrl}
                            className="w-100 h-100 object-fit-contain"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )}

                {/* PDF Download */}
                {pdfUrl && (
                    <div className="d-flex align-items-center p-3 bg-body-tertiary rounded border mb-3">
                        <div className="bg-danger bg-opacity-10 p-2 rounded me-3 text-danger">
                            <i className="bi bi-file-text" style={{ fontSize: '24px' }}></i>
                        </div>
                        <div className="flex-grow-1">
                            <h6 className="mb-0 fw-bold">PDF Document</h6>
                            <small className="text-muted">Lesson Material</small>
                        </div>
                        <Button variant="primary" size="sm" href={pdfUrl} target="_blank" rel="noopener noreferrer">
                            View / Download
                        </Button>
                    </div>
                )}

                {/* PPT Download */}
                {pptUrl && (
                    <div className="d-flex align-items-center p-3 bg-body-tertiary rounded border">
                        <div className="bg-warning bg-opacity-10 p-2 rounded me-3 text-warning">
                            <i className="bi bi-file-earmark-slides" style={{ fontSize: '24px' }}></i>
                        </div>
                        <div className="flex-grow-1">
                            <h6 className="mb-0 fw-bold">Presentation</h6>
                            <small className="text-muted">PowerPoint File</small>
                        </div>
                        <Button variant="warning" size="sm" href={pptUrl} target="_blank" rel="noopener noreferrer" className="text-dark fw-bold">
                            Download PPT
                        </Button>
                    </div>
                )}
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default LessonViewer;
