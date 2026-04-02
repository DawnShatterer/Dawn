import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FileText, PlayCircle, FileSpreadsheet } from 'lucide-react';

const LessonViewer = ({ lesson }) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5159';

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

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

    const videoUrl = getFullUrl(lesson.videoUrl);
    const pdfUrl = getFullUrl(lesson.pdfUrl);
    const pptUrl = getFullUrl(lesson.pptUrl);

    return (
        <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-body border-bottom-0 pt-4 px-4 pb-0">
                <h4 className="fw-bold d-flex align-items-center mb-1">
                    <PlayCircle className="text-primary me-2" size={24} /> 
                    {lesson.title}
                </h4>
            </Card.Header>
            <Card.Body className="p-4">
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
                        <div className="bg-primary bg-opacity-10 p-2 rounded me-3 text-primary"><PlayCircle size={24} /></div>
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
                            <FileText size={24} />
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
                            <FileSpreadsheet size={24} />
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
            </Card.Body>
        </Card>
    );
};

export default LessonViewer;
