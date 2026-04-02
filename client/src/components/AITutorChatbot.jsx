import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { Bot, Send, X, MessageSquare, Minimize2, Trash2, Clock } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { askTutor } from '../api/aiTutorService';

const AITutorChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        { 
            text: "Namaste! 🙏 I'm Dawn, your AI learning assistant. Ask me anything about your studies, courses, or programming concepts!", 
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
            text: "Chat cleared! 🧹 How can I help you?", 
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
                    className="rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 position-relative"
                    style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)', border: 'none', animation: 'pulse-glow 2s infinite' }}
                    onClick={() => setIsOpen(true)}
                >
                    <Bot size={30} className="text-white" />
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '9px' }}>
                        AI
                    </span>
                </Button>
                <style>{`
                    @keyframes pulse-glow {
                        0%, 100% { box-shadow: 0 4px 15px rgba(13,110,253,0.4); }
                        50% { box-shadow: 0 4px 25px rgba(102,16,242,0.6); }
                    }
                `}</style>
            </div>
        );
    }

    // Minimized State
    if (isMinimized) {
        return (
            <Button 
                className="position-fixed shadow d-flex align-items-center px-4 py-2"
                style={{ bottom: '30px', right: '30px', zIndex: 1050, borderRadius: '30px', background: 'linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)', border: 'none', color: 'white' }}
                onClick={() => setIsMinimized(false)}
            >
                <MessageSquare size={18} className="me-2" /> Resume Chat
                <Badge bg="light" text="dark" className="ms-2">{messages.length}</Badge>
            </Button>
        );
    }

    // Full Chat State
    return (
        <Card className="position-fixed shadow-lg border-0 overflow-hidden" 
              style={{ bottom: '30px', right: '30px', width: '400px', height: '580px', zIndex: 1050, borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            
            <Card.Header className="text-white p-3 border-0 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)' }}>
                <div className="d-flex align-items-center">
                    <div className="bg-body bg-opacity-25 rounded-circle p-2 me-2">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h6 className="m-0 fw-bold">Dawn AI Tutor</h6>
                        <small className="opacity-75" style={{ fontSize: '11px' }}>
                            <span className="me-1" style={{ color: '#4ade80' }}>●</span>
                            Online — Always here to help
                        </small>
                    </div>
                </div>
                <div className="d-flex align-items-center">
                    <Button variant="link" className="text-white p-1 opacity-75" onClick={handleClearChat} title="Clear Chat">
                        <Trash2 size={16} />
                    </Button>
                    <Button variant="link" className="text-white p-1 opacity-75" onClick={() => setIsMinimized(true)}>
                        <Minimize2 size={16} />
                    </Button>
                    <Button variant="link" className="text-white p-1 opacity-75" onClick={() => setIsOpen(false)}>
                        <X size={18} />
                    </Button>
                </div>
            </Card.Header>

            <Card.Body className="bg-body-tertiary p-3 flex-grow-1" style={{ overflowY: 'auto' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className="mb-3">
                        <div className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                            {msg.sender === 'ai' && (
                                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2 mt-auto mb-auto flex-shrink-0" style={{ width: '30px', height: '30px' }}>
                                    <Bot size={16} className="text-primary" />
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
                                    <Clock size={10} className="text-muted me-1" />
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
                        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2 flex-shrink-0" style={{ width: '30px', height: '30px' }}>
                            <Bot size={16} className="text-primary" />
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
                        style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)' }}
                        disabled={!input.trim() || isTyping}
                    >
                        <Send size={14} className="text-white ms-1" />
                    </Button>
                </Form>
            </Card.Footer>
        </Card>
    );
};

export default AITutorChatbot;
