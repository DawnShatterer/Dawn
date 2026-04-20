import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { askTutor } from '../api/aiTutorService';

const AITutorChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        { 
            text: "Hey! 👋 I'm here to help you with anything on Dawn. Ask away!", 
            sender: 'ai',
            time: new Date(),
            suggestions: ["How do I enroll?", "Study tips", "Programming help", "My progress", "Tell me a joke"]
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const location = useLocation();

    // Dynamically extract CourseID if user is inside a course page
    const courseMatch = location.pathname.match(/\/courses\/(\d+)/);
    const courseId = courseMatch ? parseInt(courseMatch[1]) : null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [messages, isOpen, isMinimized, isTyping]);

    // Format markdown-like text
    const formatMessage = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.*?)`/g, '<code style="background:#e9ecef;padding:2px 6px;border-radius:4px;font-size:0.85em">$1</code>')
            .replace(/\n/g, '<br/>')
            .replace(/• /g, '&nbsp;&nbsp;• ');
    };

    const handleSend = async (messageText) => {
        const text = typeof messageText === 'string' ? messageText : input.trim();
        if (!text) return;

        setInput('');
        setMessages(prev => [...prev, { text, sender: 'user', time: new Date() }]);
        setIsTyping(true);

        try {
            const response = await askTutor(text, courseId);
            const aiText = typeof response === 'string' ? response : response.response || response;
            const suggestions = typeof response === 'object' ? response.suggestions : null;

            setMessages(prev => [...prev, { 
                text: aiText, 
                sender: 'ai', 
                time: new Date(),
                suggestions: suggestions || []
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { 
                text: "Oops! I'm having trouble connecting right now. Please check if the backend server is running and try again! 🔧", 
                sender: 'ai', 
                isError: true,
                time: new Date(),
                suggestions: ["Try again", "Dashboard"]
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleQuickReply = (text) => {
        handleSend(text);
    };

    const handleClearChat = () => {
        setMessages([{ 
            text: "Chat cleared! 🧹 What's on your mind?", 
            sender: 'ai', 
            time: new Date(),
            suggestions: ["How do I enroll?", "Study tips", "Programming help", "Tell me a joke"]
        }]);
    };

    const formatTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // FAB Button State
    if (!isOpen) {
        return (
            <div className="position-fixed" style={{ bottom: '30px', right: '30px', zIndex: 1050 }}>
                <Button 
                    className="rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0"
                    style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)', border: 'none', fontSize: '1.6rem' }}
                    onClick={() => setIsOpen(true)}
                >
                    💬
                </Button>
            </div>
        );
    }

    // Minimized State
    if (isMinimized) {
        return (
            <Button 
                className="position-fixed shadow d-flex align-items-center px-4 py-2"
                style={{ bottom: '30px', right: '30px', zIndex: 1050, borderRadius: '30px', background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)', border: 'none', color: 'white' }}
                onClick={() => setIsMinimized(false)}
            >
                💬 <span className="ms-2 fw-bold">Resume Chat</span>
                <Badge bg="light" text="dark" className="ms-2">{messages.length}</Badge>
            </Button>
        );
    }

    // Full Chat State
    return (
        <Card className="position-fixed shadow-lg border-0 overflow-hidden" 
              style={{ bottom: '30px', right: '30px', width: '400px', height: '580px', zIndex: 1050, borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            
            <Card.Header className="text-white p-3 border-0 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)' }}>
                <div className="d-flex align-items-center">
                    <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}>
                        💬
                    </div>
                    <div>
                        <h6 className="m-0 fw-bold">Dawn Help Desk</h6>
                        <small className="opacity-75" style={{ fontSize: '11px' }}>
                            Ask anything about the platform
                        </small>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-1">
                    <Button variant="link" className="text-white p-1 opacity-75" onClick={handleClearChat} title="Clear Chat" style={{ fontSize: '1rem', textDecoration: 'none' }}>
                        🗑️
                    </Button>
                    <Button variant="link" className="text-white p-1 opacity-75 fw-bold" onClick={() => setIsMinimized(true)} style={{ fontSize: '1.2rem', textDecoration: 'none', lineHeight: 1 }}>
                        −
                    </Button>
                    <Button variant="link" className="text-white p-1 opacity-75 fw-bold" onClick={() => setIsOpen(false)} style={{ fontSize: '1.2rem', textDecoration: 'none', lineHeight: 1 }}>
                        ×
                    </Button>
                </div>
            </Card.Header>

            <Card.Body className="bg-body-tertiary p-3 flex-grow-1" style={{ overflowY: 'auto' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className="mb-3">
                        <div className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                            {msg.sender === 'ai' && (
                                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2 mt-auto mb-auto flex-shrink-0" style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
                                    🎓
                                </div>
                            )}
                            <div>
                                <div 
                                    className={`p-3 border-0 shadow-sm ${msg.sender === 'user' ? 'bg-primary text-white' : msg.isError ? 'bg-danger bg-opacity-10 text-danger' : 'bg-body text-body'}`} 
                                    style={{ 
                                        maxWidth: '280px', 
                                        fontSize: '0.85rem', 
                                        borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                        lineHeight: '1.5'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                                />
                                <div className={`d-flex align-items-center mt-1 ${msg.sender === 'user' ? 'justify-content-end' : ''}`}>
                                    <small className="text-muted" style={{ fontSize: '10px' }}>{formatTime(msg.time)}</small>
                                </div>
                            </div>
                        </div>

                        {/* Quick Reply Chips */}
                        {msg.sender === 'ai' && msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && (
                            <div className="d-flex flex-wrap gap-1 mt-2 ms-5">
                                {msg.suggestions.map((suggestion, sIdx) => (
                                    <Button 
                                        key={sIdx}
                                        variant="outline-primary" 
                                        size="sm" 
                                        className="rounded-pill px-3 py-1 fw-medium"
                                        style={{ fontSize: '0.75rem', borderWidth: '1.5px' }}
                                        onClick={() => handleQuickReply(suggestion)}
                                        disabled={isTyping}
                                    >
                                        {suggestion}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                
                {isTyping && (
                    <div className="d-flex mb-3 justify-content-start align-items-center ms-2">
                        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2 flex-shrink-0" style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
                            🎓
                        </div>
                        <div className="bg-body shadow-sm p-3 d-flex align-items-center" style={{ borderRadius: '16px 16px 16px 4px' }}>
                            <div className="typing-dots d-flex align-items-center gap-1">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        </div>
                        <style>{`
                            .typing-dots .dot {
                                width: 8px; height: 8px; border-radius: 50%;
                                background: #0d6efd; animation: dotBounce 1.4s infinite ease-in-out;
                            }
                            .typing-dots .dot:nth-child(1) { animation-delay: 0s; }
                            .typing-dots .dot:nth-child(2) { animation-delay: 0.2s; }
                            .typing-dots .dot:nth-child(3) { animation-delay: 0.4s; }
                            @keyframes dotBounce {
                                0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                                40% { transform: scale(1); opacity: 1; }
                            }
                        `}</style>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </Card.Body>

            <Card.Footer className="bg-body p-3 border-top">
                <Form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="d-flex position-relative">
                    <Form.Control
                        type="text"
                        placeholder="Ask me anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="rounded-pill border-secondary pe-5 shadow-none focus-ring focus-ring-primary"
                        style={{ fontSize: '0.9rem' }}
                        disabled={isTyping}
                    />
                    <Button 
                        type="submit" 
                        className="position-absolute end-0 top-50 translate-middle-y rounded-circle me-1 p-0 d-flex align-items-center justify-content-center border-0 shadow-sm"
                        style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)', fontSize: '0.9rem' }}
                        disabled={!input.trim() || isTyping}
                    >
                        <span className="text-white" style={{ marginLeft: '2px' }}>→</span>
                    </Button>
                </Form>
            </Card.Footer>
        </Card>
    );
};

export default AITutorChatbot;
