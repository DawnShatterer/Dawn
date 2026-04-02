import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, InputGroup, ListGroup } from 'react-bootstrap';
import { Send, Search, MessageCircle, User, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';
import { getConversations, getHistory, markMessagesRead, searchUsers } from '../api/messageService';
import { getUserInfo } from '../utils/authUtils';

const Messages = () => {
    const user = getUserInfo();
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [connection, setConnection] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const { data: conversations, isLoading } = useQuery({
        queryKey: ['conversations'],
        queryFn: getConversations,
        refetchInterval: 10000
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5159';
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiBase}/chathub?access_token=${token}`)
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        newConnection.start()
            .then(() => console.log('SignalR Connected'))
            .catch(err => console.error('SignalR Error:', err));

        setConnection(newConnection);
        return () => newConnection.stop();
    }, []);

    useEffect(() => {
        if (!connection) return;

        connection.on('ReceiveMessage', (message) => {
            if (selectedUser && (message.senderId === selectedUser.userId || message.senderId === user?.id)) {
                setChatMessages(prev => {
                    if (prev.find(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            }
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
        });

        return () => connection.off('ReceiveMessage');
    }, [connection, selectedUser, user, queryClient]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const selectConversation = useCallback(async (conversationUser) => {
        setSelectedUser(conversationUser);
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);

        try {
            const history = await getHistory(conversationUser.userId);
            setChatMessages(history);
            await markMessagesRead(conversationUser.userId);
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
        } catch (err) {
            console.error('Failed to load history:', err);
        }

        setTimeout(() => inputRef.current?.focus(), 100);
    }, [queryClient]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedUser || !connection) return;

        try {
            await connection.invoke('SendMessage', selectedUser.userId, messageInput.trim());
            setMessageInput('');
        } catch (err) {
            console.error('Send failed:', err);
        }
    };

    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const results = await searchUsers(searchQuery);
                setSearchResults(results);
            } catch (err) {
                console.error('Search failed:', err);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const diffHrs = (new Date() - d) / (1000 * 60 * 60);
        if (diffHrs < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffHrs < 168) return d.toLocaleDateString([], { weekday: 'short' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getRoleBadge = (role) => {
        const colors = { Teacher: 'primary', Student: 'success', Admin: 'danger' };
        return <Badge bg={colors[role] || 'secondary'} className="ms-2" style={{ fontSize: '0.65rem' }}>{role}</Badge>;
    };

    return (
        <Container fluid className="py-4 h-100 font-sans">
            <Row className="justify-content-center h-100">
                <Col xl={10} className="h-100">
                    <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-body">
                        <Row className="g-0 h-100">
                            
                            {/* Left Sidebar */}
                            <Col md={4} className={`h-100 d-flex flex-column border-end border-opacity-50 ${selectedUser ? 'd-none d-md-flex' : ''}`}>
                                <div className="p-4 border-bottom border-opacity-50 bg-body-tertiary">
                                    <h4 className="fw-bolder mb-3 d-flex align-items-center text-body">
                                        <MessageCircle size={24} className="text-primary me-2" /> Direct Messages
                                    </h4>
                                    <InputGroup>
                                        <InputGroup.Text className="bg-body border-end-0">
                                            <Search size={16} className="text-muted" />
                                        </InputGroup.Text>
                                        <Form.Control
                                            placeholder="Find someone to chat..."
                                            className="bg-body border-start-0 shadow-none text-body"
                                            value={searchQuery}
                                            onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true); }}
                                            onFocus={() => setIsSearching(true)}
                                            style={{ fontSize: '0.95rem' }}
                                        />
                                    </InputGroup>
                                </div>

                                <div className="flex-grow-1 overflow-auto bg-body">
                                    {isSearching && searchResults.length > 0 && (
                                        <div className="p-3">
                                            <small className="text-muted fw-bold px-2 text-uppercase mb-2 d-block" style={{letterSpacing: '1px', fontSize: '0.7rem'}}>Found Users</small>
                                            <ListGroup variant="flush">
                                                {searchResults.map(u => (
                                                    <ListGroup.Item
                                                        key={u.userId} action
                                                        className="d-flex align-items-center px-3 py-3 border-0 rounded-3 mb-1 bg-body hover-bg-tertiary transition-all"
                                                        onClick={() => selectConversation(u)}
                                                    >
                                                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-3 shadow-sm" style={{width: '42px', height: '42px'}}>
                                                            <span className="fw-bold fs-5">{u.fullName.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <div className="flex-grow-1 min-w-0">
                                                            <div className="d-flex align-items-center">
                                                                <span className="fw-bold text-truncate text-body">{u.fullName}</span>
                                                                {getRoleBadge(u.role)}
                                                            </div>
                                                            <small className="text-muted text-truncate d-block">{u.email}</small>
                                                        </div>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </div>
                                    )}

                                    {!isSearching && (
                                        <ListGroup variant="flush" className="p-2">
                                            {isLoading ? (
                                                <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>
                                            ) : conversations?.length === 0 ? (
                                                <div className="text-center p-5 mt-4">
                                                    <div className="bg-body-tertiary rounded-circle p-4 d-inline-block mb-3">
                                                        <MessageCircle size={32} className="text-muted" />
                                                    </div>
                                                    <h6 className="fw-bold text-body">No Active Chats</h6>
                                                    <p className="text-muted small">Use the search bar above to start a new conversation.</p>
                                                </div>
                                            ) : (
                                                conversations?.map(c => {
                                                    const isActive = selectedUser?.userId === c.userId;
                                                    return (
                                                        <ListGroup.Item
                                                            key={c.userId} action
                                                            active={isActive}
                                                            className={`d-flex align-items-center px-3 py-3 mb-2 rounded-3 border-0 transition-all ${isActive ? 'bg-primary text-white shadow' : 'bg-body hover-bg-tertiary'}`}
                                                            onClick={() => selectConversation(c)}
                                                        >
                                                            <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-3 shadow-sm ${isActive ? 'bg-body bg-opacity-25 text-white' : 'bg-primary bg-opacity-10 text-primary'}`} style={{width: '48px', height: '48px'}}>
                                                                <span className="fw-bold fs-5">{c.fullName.charAt(0).toUpperCase()}</span>
                                                            </div>
                                                            <div className="flex-grow-1 min-w-0">
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <span className={`fw-bold text-truncate ${isActive ? 'text-white' : 'text-body'}`}>{c.fullName}</span>
                                                                    <small className={`flex-shrink-0 ms-2 ${isActive ? 'text-white-50' : 'text-muted'}`} style={{fontSize: '0.75rem'}}>{formatTime(c.lastMessageTime)}</small>
                                                                </div>
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <small className={`text-truncate ${isActive ? 'text-white-50' : 'text-muted'}`}>{c.lastMessage}</small>
                                                                    {c.unreadCount > 0 && !isActive && (
                                                                        <Badge pill bg="danger" className="ms-2 shadow-sm">{c.unreadCount}</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </ListGroup.Item>
                                                    );
                                                })
                                            )}
                                        </ListGroup>
                                    )}
                                </div>
                            </Col>

                            {/* Right active chat container */}
                            <Col md={8} className={`h-100 d-flex flex-column bg-body-tertiary ${!selectedUser ? 'd-none d-md-flex' : ''}`}>
                                {!selectedUser ? (
                                    <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-5">
                                        <div className="bg-body shadow-sm rounded-circle p-4 mb-4" style={{width: '100px', height: '100px'}}>
                                            <img src="/logo.png" alt="Dawn" style={{width: '100%', opacity: '0.1', filter: 'grayscale(100%)'}} />
                                        </div>
                                        <h4 className="fw-bolder text-body">Dawn Messenger</h4>
                                        <p className="text-muted Lead mx-auto" style={{maxWidth: '300px'}}>
                                            Select a conversation from the sidebar or start a new seamless chat.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Chat Dashboard Header */}
                                        <div className="bg-body p-3 px-4 border-bottom border-opacity-50 d-flex align-items-center shadow-sm z-1">
                                            <Button variant="link" className="text-body d-md-none p-0 me-3" onClick={() => setSelectedUser(null)}>
                                                <ArrowLeft size={24} />
                                            </Button>
                                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-3 shadow-sm" style={{width: '42px', height: '42px'}}>
                                                <span className="fw-bold fs-5">{selectedUser.fullName.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <h5 className="m-0 fw-bold text-body">{selectedUser.fullName}</h5>
                                                <div className="d-flex align-items-center">
                                                    <span className="bg-success rounded-circle d-inline-block me-1" style={{width: '8px', height: '8px'}}></span>
                                                    <small className="text-muted fw-medium">Active now</small>
                                                    <span className="mx-2 text-muted opacity-50">•</span>
                                                    {getRoleBadge(selectedUser.role)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Seamless Chat Messages UI */}
                                        <div className="flex-grow-1 p-4 overflow-auto px-md-5" style={{ scrollBehavior: 'smooth' }}>
                                            {chatMessages.length === 0 ? (
                                                <div className="text-center mt-5">
                                                    <Badge bg="primary" className="bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-medium border border-primary border-opacity-25">
                                                        This is the beginning of your chat history.
                                                    </Badge>
                                                </div>
                                            ) : (
                                                chatMessages.map((msg, idx) => {
                                                    const isMine = msg.senderId === user?.id;
                                                    return (
                                                        <div key={msg.id || idx} className={`d-flex mb-4 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                                                            {!isMine && (
                                                                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-2 align-self-end shadow-sm" style={{width: '28px', height: '28px', fontSize: '0.75rem'}}>
                                                                    <span className="fw-bold">{selectedUser.fullName.charAt(0).toUpperCase()}</span>
                                                                </div>
                                                            )}
                                                            <div className={`d-flex flex-column ${isMine ? 'align-items-end' : 'align-items-start'}`} style={{maxWidth: '75%'}}>
                                                                <div
                                                                    className={`px-4 py-2 shadow-sm ${isMine ? 'text-white' : 'bg-body text-body border'}`}
                                                                    style={{
                                                                        borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                                        fontSize: '0.95rem',
                                                                        lineHeight: '1.5',
                                                                        background: isMine ? 'linear-gradient(135deg, #0d6efd, #6610f2)' : undefined
                                                                    }}
                                                                >
                                                                    {msg.content}
                                                                </div>
                                                                <div className="d-flex align-items-center mt-1" style={{ opacity: 0.7 }}>
                                                                    <small className="text-muted fw-medium" style={{ fontSize: '0.7rem' }}>
                                                                        {formatTime(msg.createdAt)}
                                                                    </small>
                                                                    {isMine && <CheckCircle2 size={12} className={`ms-1 ${msg.isRead ? 'text-success' : 'text-muted'}`} />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Premium Message Input Box */}
                                        <div className="bg-body p-3 px-md-4 border-top border-opacity-50">
                                            <Form onSubmit={handleSend} className="position-relative">
                                                <Form.Control
                                                    ref={inputRef}
                                                    type="text"
                                                    placeholder="Write your message here..."
                                                    value={messageInput}
                                                    onChange={(e) => setMessageInput(e.target.value)}
                                                    className="rounded-4 border-light bg-body-tertiary shadow-none py-3 px-4 text-body pe-5"
                                                    style={{ fontSize: '0.95rem', transition: 'all 0.2s', border: '1px solid transparent' }}
                                                    onFocus={(e) => e.target.style.borderColor = '#0d6efd'}
                                                    onBlur={(e) => e.target.style.borderColor = 'transparent'}
                                                />
                                                <Button
                                                    type="submit"
                                                    className="position-absolute end-0 top-50 translate-middle-y rounded-circle p-0 d-flex align-items-center justify-content-center border-0 shadow-sm me-2 btn-hover-scale"
                                                    style={{ width: '40px', height: '40px', background: messageInput.trim() ? 'linear-gradient(135deg, #0d6efd, #6610f2)' : '#e9ecef', transition: '0.3s' }}
                                                    disabled={!messageInput.trim()}
                                                >
                                                    <Send size={16} className={messageInput.trim() ? 'text-white ms-1' : 'text-muted ms-1'} />
                                                </Button>
                                            </Form>
                                        </div>
                                    </>
                                )}
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            <style>{`
                .hover-bg-tertiary:hover { background-color: var(--bs-secondary-bg) !important; }
                .transition-all { transition: all 0.2s ease-in-out; }
                .btn-hover-scale:hover { transform: translateY(-50%) scale(1.05) !important; }
            `}</style>
        </Container>
    );
};

export default Messages;
