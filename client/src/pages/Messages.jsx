import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Spinner } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
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
            .then(() => {})
            .catch(err => {});

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

    const getRoleBadgeStyle = (role) => {
        if (role === 'Teacher') return { background: 'rgba(59,130,246,0.08)', color: '#3b82f6' };
        if (role === 'Admin') return { background: 'rgba(220,38,38,0.08)', color: '#dc2626' };
        return { background: 'rgba(52,130,82,0.08)', color: '#348252' };
    };

    return (
        <div className="msg-wrapper">
            <div className="msg-container">

                {/* ── Sidebar ── */}
                <div className={`msg-sidebar ${selectedUser ? 'd-none d-md-flex' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="msg-sidebar-header">
                        <h4>
                            <i className="bi bi-chat-dots" style={{ fontSize: '18px', color: '#348252' }}></i>
                            Direct Messages
                        </h4>
                        <div style={{ position: 'relative' }}>
                            <i className="bi bi-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.35, fontSize: '14px' }}></i>
                            <input
                                className="msg-search-input"
                                placeholder="Find someone to chat..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true); }}
                                onFocus={() => setIsSearching(true)}
                            />
                        </div>
                    </div>

                    <div className="msg-contact-list">
                        {/* Search results */}
                        {isSearching && searchResults.length > 0 && (
                            <div style={{ padding: '0.5rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.35, marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Found Users</div>
                                {searchResults.map(u => (
                                    <div key={u.userId} className="msg-contact" onClick={() => selectConversation(u)}>
                                        <div className="msg-avatar">{u.fullName.charAt(0).toUpperCase()}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <span className="msg-contact-name">{u.fullName}</span>
                                                <span className="rc-badge" style={getRoleBadgeStyle(u.role)}>{u.role}</span>
                                            </div>
                                            <div className="msg-contact-preview">{u.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Conversations list */}
                        {!isSearching && (
                            <>
                                {isLoading ? (
                                    <div style={{ textAlign: 'center', padding: '2.5rem', opacity: 0.3 }}>
                                        <Spinner animation="border" size="sm" />
                                    </div>
                                ) : conversations?.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                        <i className="bi bi-chat-dots" style={{ fontSize: '28px', opacity: 0.15, marginBottom: '0.5rem' }}></i>
                                        <h6 style={{ fontWeight: 700, fontSize: '0.85rem' }}>No Active Chats</h6>
                                        <p style={{ fontSize: '0.72rem', opacity: 0.4 }}>Use the search bar above to start a new conversation.</p>
                                    </div>
                                ) : (
                                    conversations?.map(c => {
                                        const isActive = selectedUser?.userId === c.userId;
                                        return (
                                            <div key={c.userId} className={`msg-contact ${isActive ? 'active' : ''}`} onClick={() => selectConversation(c)}>
                                                <div className="msg-avatar">{c.fullName.charAt(0).toUpperCase()}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span className="msg-contact-name">{c.fullName}</span>
                                                        <span className="msg-contact-time">{formatTime(c.lastMessageTime)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span className="msg-contact-preview">{c.lastMessage}</span>
                                                        {c.unreadCount > 0 && !isActive && (
                                                            <span className="msg-unread-badge">{c.unreadCount}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── Chat Area ── */}
                <div className={`msg-chat-area ${!selectedUser ? 'd-none d-md-flex' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
                    {!selectedUser ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                            <i className="bi bi-chat-dots" style={{ fontSize: '40px', opacity: 0.08, marginBottom: '1rem' }}></i>
                            <h5 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Dawn Messenger</h5>
                            <p style={{ fontSize: '0.82rem', opacity: 0.4, maxWidth: '280px' }}>
                                Select a conversation from the sidebar or start a new chat.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="msg-chat-header">
                                <button onClick={() => setSelectedUser(null)} className="d-md-none" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', marginRight: '0.25rem' }}>
                                    <i className="bi bi-arrow-left" style={{ fontSize: '20px' }}></i>
                                </button>
                                <div className="msg-avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem', background: 'rgba(52,130,82,0.1)', color: '#348252', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                                    {selectedUser.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="msg-chat-name">{selectedUser.fullName}</div>
                                    <div className="msg-chat-status">
                                        <span className="msg-online-dot"></span>
                                        Active now
                                        {selectedUser.role && (
                                            <span className="rc-badge" style={{ ...getRoleBadgeStyle(selectedUser.role), marginLeft: '0.35rem' }}>{selectedUser.role}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="msg-messages">
                                {chatMessages.length === 0 ? (
                                    <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
                                        <span className="rc-badge" style={{ background: 'rgba(52,130,82,0.08)', color: '#348252', padding: '0.3rem 0.8rem' }}>
                                            This is the beginning of your chat history.
                                        </span>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, idx) => {
                                        const isMine = msg.senderId === user?.id;
                                        return (
                                            <div key={msg.id || idx} className={`msg-bubble-row ${isMine ? 'mine' : 'theirs'}`}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                                                    <div className={`msg-bubble ${isMine ? 'mine' : 'theirs'}`}>
                                                        {msg.content}
                                                    </div>
                                                    <div className={`msg-bubble-meta ${isMine ? '' : ''}`}>
                                                        {formatTime(msg.createdAt)}
                                                        {isMine && <i className="bi bi-check-circle" style={{ fontSize: '10px', color: msg.isRead ? '#348252' : undefined }}></i>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="msg-input-area">
                                <form onSubmit={handleSend} className="msg-input-form">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className="msg-text-input"
                                        placeholder="Write your message here..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                    />
                                    <button type="submit" className={`msg-send-btn ${messageInput.trim() ? 'active' : 'inactive'}`} disabled={!messageInput.trim()}>
                                        <i className="bi bi-send" style={{ fontSize: '16px', marginLeft: '1px' }}></i>
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
