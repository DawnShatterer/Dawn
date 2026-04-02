import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Video, Calendar, Clock, Link as LinkIcon } from 'lucide-react';

const LiveClassCard = ({ liveClass, isOwner, onDelete }) => {
    const startTime = new Date(liveClass.startTime);
    const isUpcoming = startTime > new Date();

    return (
        <Card className={`border-0 shadow-sm mb-3 ${isUpcoming ? 'border-start border-4 border-primary' : ''}`}>
            <Card.Body className="p-4 position-relative">
                {isOwner && (
                    <Button 
                        variant="link" 
                        className="text-danger position-absolute top-0 end-0 p-3"
                        onClick={() => onDelete(liveClass.id)}
                    >
                        Delete
                    </Button>
                )}
                
                <div className="d-flex align-items-center mb-3">
                    <div className={`${isUpcoming ? 'bg-primary' : 'bg-secondary'} bg-opacity-10 p-3 rounded-circle me-3`}>
                        <Video size={24} className={isUpcoming ? 'text-primary' : 'text-secondary'} />
                    </div>
                    <div>
                        <h5 className="fw-bold mb-1">{liveClass.title}</h5>
                        <Badge bg={isUpcoming ? 'primary' : 'secondary'} className="rounded-pill">
                            {isUpcoming ? 'Upcoming' : 'Past Session'}
                        </Badge>
                    </div>
                </div>

                <p className="text-muted mb-4">{liveClass.topic}</p>

                <div className="d-flex flex-wrap gap-4 mb-4 bg-body-tertiary p-3 rounded-3">
                    <div className="d-flex align-items-center">
                        <Calendar size={18} className="text-primary me-2" />
                        <span className="fw-medium">{startTime.toLocaleDateString()}</span>
                    </div>
                    <div className="d-flex align-items-center">
                        <Clock size={18} className="text-primary me-2" />
                        <span className="fw-medium">{startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="d-flex align-items-center">
                        <span className="fw-bold text-muted me-2">Duration:</span>
                        <span className="fw-medium">{liveClass.durationMinutes} mins</span>
                    </div>
                </div>

                <Button 
                    variant={isUpcoming ? "primary" : "outline-secondary"} 
                    className="fw-bold px-4 shadow-sm"
                    href={liveClass.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <LinkIcon size={18} className="me-2" /> 
                    {isUpcoming ? "Join Meeting" : "Meeting Link"}
                </Button>

                {liveClass.meetingPassword && (
                    <span className="ms-3 text-muted small border rounded px-2 py-1">
                        Passcode: <strong className="text-body">{liveClass.meetingPassword}</strong>
                    </span>
                )}
            </Card.Body>
        </Card>
    );
};

export default LiveClassCard;
