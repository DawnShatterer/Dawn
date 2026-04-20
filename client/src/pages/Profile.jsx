import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Nav, Table, Badge } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getUserInfo } from '../utils/authUtils';
import { getFileUrl } from '../utils/fileUtils';
import { validatePhoneNumber, validateFileSize, validateFileType } from '../utils/validationUtils';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const Profile = () => {
    const user = getUserInfo();
    const [activeTab, setActiveTab] = useState('identity');

    // Role mappings
    const isStudent = user?.role?.toLowerCase() === 'student';
    const isTeacher = user?.role?.toLowerCase() === 'teacher';
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const navigate = useNavigate();

    // Logout Logic
    const handleLogoutClick = () => {
        localStorage.clear();
        navigate('/login');
    };

    // -- State for Personal Identity
    const [identityData, setIdentityData] = useState({
        FullName: user?.name || '',
        NickName: user?.nickName || '',
        // Email is NOT included in editable state (institutional email is read-only)
        Phone: user?.phone || '',
        Location: user?.location || '',
        Grade: user?.grade || '',
        // Optional: Personal email for notifications
        PersonalEmail: user?.personalEmail || ''
    });
    const [isSavingIdentity, setIsSavingIdentity] = useState(false);
    const [identityMessage, setIdentityMessage] = useState({ type: '', text: '' });
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = React.useRef(null);
    
    // Validation state
    const [phoneError, setPhoneError] = useState('');
    const [profilePictureError, setProfilePictureError] = useState('');

    const handleIdentityChange = (e) => {
        const { name, value } = e.target;
        setIdentityData({ ...identityData, [name]: value });
        
        // Validate phone number on change
        if (name === 'Phone') {
            const validation = validatePhoneNumber(value);
            if (!validation.valid) {
                setPhoneError(validation.error);
            } else {
                setPhoneError('');
            }
        }
    };

    const handleSaveIdentity = async (e) => {
        e.preventDefault();
        
        // Validate phone number before submission
        const phoneValidation = validatePhoneNumber(identityData.Phone);
        if (!phoneValidation.valid) {
            setPhoneError(phoneValidation.error);
            setIdentityMessage({ type: 'danger', text: 'Please fix validation errors before saving.' });
            return;
        }
        
        setIsSavingIdentity(true);
        setIdentityMessage({ type: '', text: '' });
        try {
            const updatePayload = {
                FullName: identityData.FullName,
                NickName: identityData.NickName,
                Phone: identityData.Phone,
                Location: identityData.Location,
                Grade: identityData.Grade,
                PersonalEmail: identityData.PersonalEmail
            };
            
            const res = await api.put('/Auth/profile', updatePayload);
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
            }
            
            const updatedUser = {
                ...user,
                name: identityData.FullName,
                nickName: identityData.NickName,
                phone: identityData.Phone,
                location: identityData.Location,
                grade: identityData.Grade,
                personalEmail: identityData.PersonalEmail
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setIdentityMessage({ type: 'success', text: 'Profile updated successfully!' });
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            setIdentityMessage({ type: 'danger', text: 'Failed to update profile.' });
        } finally {
            setIsSavingIdentity(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Clear previous errors
        setProfilePictureError('');
        setIdentityMessage({ type: '', text: '' });
        
        // Validate file size (1MB limit)
        const sizeValidation = validateFileSize(file, 1, 'Profile picture');
        if (!sizeValidation.valid) {
            setProfilePictureError(sizeValidation.error);
            setIdentityMessage({ type: 'danger', text: sizeValidation.error });
            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }
        
        // Validate file type (.jpg, .jpeg, .png, .webp)
        const typeValidation = validateFileType(file, ['.jpg', '.jpeg', '.png', '.webp']);
        if (!typeValidation.valid) {
            setProfilePictureError(typeValidation.error);
            setIdentityMessage({ type: 'danger', text: typeValidation.error });
            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);

        setIsUploadingAvatar(true);

        try {
            const res = await api.post('/Auth/upload-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Update local user object
            const updatedUser = { ...user, profilePictureUrl: res.data.url };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Force reload to update navigation bars
            window.location.reload();
        } catch (error) {
            setIdentityMessage({ type: 'danger', text: 'Failed to upload custom avatar.' });
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // -- Real State for Security (Change Password)
    const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isChangingPwd, setIsChangingPwd] = useState(false);
    const [pwdError, setPwdError] = useState('');
    const [pwdSuccess, setPwdSuccess] = useState('');

    const handlePwdChange = (e) => setPwdData({ ...pwdData, [e.target.name]: e.target.value });

    const handleSubmitPwd = async (e) => {
        e.preventDefault();
        setPwdError(''); setPwdSuccess('');
        if (pwdData.newPassword !== pwdData.confirmPassword) return setPwdError("New passwords do not match.");
        setIsChangingPwd(true);
        try {
            await api.post('/Auth/change-password', {
                currentPassword: pwdData.currentPassword,
                newPassword: pwdData.newPassword
            });
            setPwdSuccess("Password updated successfully.");
            setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwdError(err.response?.data?.message || "Failed to change password. Please verify current password.");
        } finally {
            setIsChangingPwd(false);
        }
    };

    // -- State for Notification Preferences
    const [notifications, setNotifications] = useState({
        prefEmailNotif: true,
        prefInAppNotif: true,
        prefSessions: false,
        prefAssignments: false,
        prefAnnouncements: false,
        prefOthers: true
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/Auth/settings');
                // Ensure lowercase camelCase mapping from raw C# PascalCase
                setNotifications({
                    prefEmailNotif: res.data.prefEmailNotif,
                    prefInAppNotif: res.data.prefInAppNotif,
                    prefSessions: res.data.prefSessions,
                    prefAssignments: res.data.prefAssignments,
                    prefAnnouncements: res.data.prefAnnouncements,
                    prefOthers: res.data.prefOthers
                });
            } catch (err) {
            }
        };
        fetchSettings();
    }, []);

    // -- Payment History (Billing Tab)
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'billing' && isStudent) {
            const fetchPayments = async () => {
                setPaymentsLoading(true);
                try {
                    const res = await api.get('/Payment/history');
                    setPayments(res.data);
                } catch (err) {
                } finally {
                    setPaymentsLoading(false);
                }
            };
            fetchPayments();
        }
    }, [activeTab, isStudent]);

    const handleNotifToggle = async (field) => {
        const newSetting = !notifications[field];
        setNotifications((prev) => ({ ...prev, [field]: newSetting }));

        // Fire implicit save logic immediately against the active identity
        try {
            await api.put('/Auth/settings', { ...notifications, [field]: newSetting });
        } catch (err) {
        }
    };

    // -- Admin: Platform Configuration Removed per user request.

    return (
        <Container fluid className="py-4 font-sans bg-body-tertiary" style={{ minHeight: '100vh' }}>
            <div className="d-flex align-items-center mb-4 ps-1">
                <h4 className="fw-bolder mb-0">My Profile</h4>
            </div>

            <Row className="g-4">
                {/* ─── LEFT NAVIGATION TABS ─── */}
                <Col lg={3} md={4}>
                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-3">
                        <Card.Body className="p-0">
                            <Nav className="flex-column profile-nav">
                                <Nav.Link 
                                    className={`py-3 px-4 d-flex align-items-center ${activeTab === 'identity' ? 'bg-primary bg-opacity-10 text-primary border-start border-4 border-primary fw-bold' : 'hover-bg-light'}`}
                                    onClick={() => setActiveTab('identity')}
                                    style={{ cursor: 'pointer', borderStart: '4px solid transparent' }}>
                                    <i className="bi bi-person me-3" style={{ fontSize: '18px' }}></i> Personal Identity
                                </Nav.Link>

                                <Nav.Link 
                                    className={`py-3 px-4 d-flex align-items-center ${activeTab === 'security' ? 'bg-primary bg-opacity-10 text-primary border-start border-4 border-primary fw-bold' : 'hover-bg-light border-top'}`}
                                    onClick={() => setActiveTab('security')}
                                    style={{ cursor: 'pointer', borderStart: '4px solid transparent' }}>
                                    <i className="bi bi-shield me-3" style={{ fontSize: '18px' }}></i> Security & Settings
                                </Nav.Link>

                                {isStudent && (
                                    <>
                                        <Nav.Link 
                                            className={`py-3 px-4 d-flex align-items-center ${activeTab === 'billing' ? 'bg-primary bg-opacity-10 text-primary border-start border-4 border-primary fw-bold' : 'hover-bg-light border-top'}`}
                                            onClick={() => setActiveTab('billing')}
                                            style={{ cursor: 'pointer', borderStart: '4px solid transparent' }}>
                                            <i className="bi bi-credit-card me-3" style={{ fontSize: '18px' }}></i> Billing History
                                        </Nav.Link>

                                    </>
                                )}

                            </Nav>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ─── RIGHT CONTENT AREA ─── */}
                <Col lg={9} md={8}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Body className="p-4 p-lg-5">
                            
                            {/* 1. PERSONAL IDENTITY TAB */}
                            {activeTab === 'identity' && (
                                <Form onSubmit={handleSaveIdentity}>
                                    <Row>
                                        <Col lg={8}>
                                            {identityMessage.text && (
                                                <Alert variant={identityMessage.type} className="py-2 px-3 text-sm mb-3">
                                                    {identityMessage.text}
                                                </Alert>
                                            )}
                                            <Form.Group className="mb-4">
                                                <Form.Label className="small text-muted mb-1">Full Name</Form.Label>
                                                <Form.Control type="text" name="FullName" value={identityData.FullName} onChange={handleIdentityChange} className="py-2 px-3 border-opacity-50" style={{ borderColor: 'var(--bs-primary)' }} />
                                            </Form.Group>

                                            <Form.Group className="mb-4">
                                                <Form.Label className="small text-muted mb-1">Nick Name</Form.Label>
                                                <Form.Control type="text" name="NickName" value={identityData.NickName} onChange={handleIdentityChange} placeholder="e.g. Dawnless 4237" className="py-2 px-3 bg-body-tertiary border-0 shadow-none" />
                                            </Form.Group>

                                            <Form.Group className="mb-4">
                                                <Form.Label className="small text-muted mb-1">
                                                    Institutional Email Address
                                                </Form.Label>
                                                <Form.Control 
                                                    type="email" 
                                                    name="Email" 
                                                    value={user?.email || ''} 
                                                    readOnly 
                                                    className="py-2 px-3 bg-body-secondary border-0 shadow-none text-muted" 
                                                    style={{ cursor: 'not-allowed' }}
                                                />
                                                <Form.Text className="text-muted">
                                                    This is your institutional identifier and cannot be changed.
                                                </Form.Text>
                                            </Form.Group>
                                            
                                            {/* Optional: Personal email field */}
                                            <Form.Group className="mb-4">
                                                <Form.Label className="small text-muted mb-1">
                                                    Personal Email (Optional)
                                                </Form.Label>
                                                <Form.Control 
                                                    type="email" 
                                                    name="PersonalEmail" 
                                                    value={identityData.PersonalEmail} 
                                                    onChange={handleIdentityChange}
                                                    placeholder="your.personal@email.com"
                                                    className="py-2 px-3 border-opacity-25" 
                                                />
                                                <Form.Text className="text-muted">
                                                    Receive notifications at your preferred email address.
                                                </Form.Text>
                                            </Form.Group>

                                            <Form.Group className="mb-4">
                                                <Form.Label className="small text-muted mb-1">Phone Number</Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    name="Phone" 
                                                    value={identityData.Phone} 
                                                    onChange={handleIdentityChange} 
                                                    placeholder="Phone Number" 
                                                    className={`py-2 px-3 border-opacity-25 ${phoneError ? 'is-invalid' : ''}`}
                                                />
                                                {phoneError && (
                                                    <Alert variant="danger" className="py-2 px-3 text-sm mt-2 mb-0">
                                                        {phoneError}
                                                    </Alert>
                                                )}
                                            </Form.Group>

                                            <Form.Group className="mb-4">
                                                <Form.Label className="small text-muted mb-1">Location</Form.Label>
                                                <Form.Control type="text" name="Location" value={identityData.Location} onChange={handleIdentityChange} placeholder="e.g. Nepal" className="py-2 px-3 bg-body-tertiary border-0" />
                                            </Form.Group>

                                            {isStudent && (
                                                <Form.Group className="mb-5">
                                                    <Form.Label className="small text-muted mb-1">Educational Level / Grade</Form.Label>
                                                    <Form.Select 
                                                        name="Grade" 
                                                        value={identityData.Grade} 
                                                        onChange={handleIdentityChange} 
                                                        className="py-2 px-3 border-opacity-25 bg-body-tertiary shadow-none"
                                                    >
                                                        <option value="">Select your Grade/Level</option>
                                                        {[...Array(10)].map((_, i) => (
                                                            <option key={i+1} value={`Class ${i+1}`}>Class {i+1}</option>
                                                        ))}
                                                        <option value="+2 (High School)">+2 (High School)</option>
                                                        <option value="Bachelors">Bachelors Degree</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            )}

                                            <div className="d-flex align-items-center border-top pt-4">
                                                <Button type="submit" variant="primary" disabled={isSavingIdentity} className="px-4 py-2 mt-4 ms-auto rounded-3 fw-bold">
                                                    {isSavingIdentity ? <><Spinner size="sm" className="me-2"/> Saving...</> : 'Save Changes'}
                                                </Button>
                                            </div>
                                        </Col>
                                        
                                        <Col lg={4} className="d-flex flex-column align-items-center pt-3">
                                            {profilePictureError && (
                                                <Alert variant="danger" className="py-2 px-3 text-sm mb-3 w-100">
                                                    {profilePictureError}
                                                </Alert>
                                            )}
                                            <div className="position-relative mb-2">
                                                {user?.profilePictureUrl ? (
                                                    <div className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center shadow-sm" style={{ width: '120px', height: '120px', border: '3px solid white' }}>
                                                        <img src={getFileUrl(user.profilePictureUrl)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                ) : (
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                                                        <i className="bi bi-person" style={{ fontSize: '50px' }}></i>
                                                    </div>
                                                )}
                                                
                                                <div 
                                                    className="position-absolute bg-body rounded-circle shadow-sm p-2 d-flex align-items-center justify-content-center" 
                                                    style={{ right: 0, bottom: 5, border: '1px solid var(--bs-border-color)', cursor: isUploadingAvatar ? 'wait' : 'pointer' }}
                                                    onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                                                >
                                                    {isUploadingAvatar ? <Spinner size="sm" animation="border" variant="primary" /> : <i className="bi bi-camera text-muted" style={{ fontSize: '16px' }}></i>}
                                                </div>
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    onChange={handleAvatarUpload} 
                                                    style={{ display: 'none' }} 
                                                    accept="image/png, image/jpeg, image/webp" 
                                                />
                                            </div>
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>Max Image Size = 1MB</small>
                                        </Col>
                                    </Row>
                                </Form>
                            )}

                            {/* 2. SECURITY & SETTINGS TAB */}
                            {activeTab === 'security' && (
                                <Row>
                                    <Col lg={6} className="border-end pe-lg-5">
                                        <h5 className="fw-bold mb-4">Update Password</h5>
                                        {pwdError && <Alert variant="danger" className="py-2 px-3 text-sm">{pwdError}</Alert>}
                                        {pwdSuccess && <Alert variant="success" className="py-2 px-3 text-sm">{pwdSuccess}</Alert>}
                                        
                                        <Form onSubmit={handleSubmitPwd}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small text-muted">Current Password</Form.Label>
                                                <Form.Control type="password" name="currentPassword" value={pwdData.currentPassword} onChange={handlePwdChange} required className="py-2 border-opacity-25" />
                                            </Form.Group>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small text-muted">New Password</Form.Label>
                                                <Form.Control type="password" name="newPassword" value={pwdData.newPassword} onChange={handlePwdChange} required minLength={6} className="py-2 border-opacity-25" />
                                            </Form.Group>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="small text-muted">Confirm New Password</Form.Label>
                                                <Form.Control type="password" name="confirmPassword" value={pwdData.confirmPassword} onChange={handlePwdChange} required minLength={6} className="py-2 border-opacity-25" />
                                            </Form.Group>
                                            <Button type="submit" variant="primary" disabled={isChangingPwd} className="px-4 py-2 w-100 rounded-3">
                                                {isChangingPwd ? <><Spinner size="sm" className="me-2"/> Updating...</> : 'Save Password'}
                                            </Button>
                                        </Form>
                                    </Col>

                                    <Col lg={6} className="ps-lg-5 pt-5 pt-lg-0">
                                        <div className="mb-5">
                                            <h5 className="fw-bold mb-1">Notification Settings</h5>
                                            <p className="small text-muted mb-4">Manage your notification settings according to your preferences.</p>
                                            
                                            <Form.Check type="checkbox" id="app-notif" label="Enable In-app Notifications" checked={notifications.prefInAppNotif} onChange={() => handleNotifToggle('prefInAppNotif')} className="mb-2 fw-medium text-success" />
                                            
                                            <div className="ms-4">
                                                <Form.Check type="checkbox" id="sess-notif" label={<span className="text-muted">Sessions</span>} checked={notifications.prefSessions} onChange={() => handleNotifToggle('prefSessions')} className="mb-2" />
                                                <Form.Check type="checkbox" id="ass-notif" label={<span className="text-muted">Assignments</span>} checked={notifications.prefAssignments} onChange={() => handleNotifToggle('prefAssignments')} className="mb-2" />
                                                <Form.Check type="checkbox" id="ann-notif" label={<span className="text-muted">Announcements</span>} checked={notifications.prefAnnouncements} onChange={() => handleNotifToggle('prefAnnouncements')} className="mb-2" />
                                                <Form.Check type="checkbox" id="oth-notif" label={<span className="fw-medium">Others</span>} checked={notifications.prefOthers} onChange={() => handleNotifToggle('prefOthers')} className="mb-4" />
                                            </div>
                                        </div>

                                        <div>
                                            <h5 className="fw-bold mb-3 text-danger"><i className="bi bi-box-arrow-right me-2" style={{ fontSize: '20px' }}></i> Account Action</h5>
                                            <Button variant="danger" className="w-100 py-3 rounded-3 fw-bold d-flex justify-content-center align-items-center" onClick={handleLogoutClick}>
                                                Sign Out Safely
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            )}

                            {/* 4. BILLING TAB (STUDENT ONLY) */}
                            {isStudent && activeTab === 'billing' && (
                                <div>
                                    <h5 className="fw-bold mb-4">Billing History</h5>
                                    {paymentsLoading && <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>}
                                    {!paymentsLoading && payments.length === 0 && (
                                        <div className="text-center py-5">
                                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                                                <i className="bi bi-credit-card" style={{ fontSize: '32px' }}></i>
                                            </div>
                                            <h6 className="text-muted">No transactions found yet.</h6>
                                            <p className="text-muted small">Your payment history will appear here after you enroll in a paid course.</p>
                                        </div>
                                    )}
                                    {!paymentsLoading && payments.length > 0 && (
                                        <Table responsive hover className="align-middle">
                                            <thead className="bg-body-tertiary">
                                                <tr>
                                                    <th className="small text-muted fw-bold">Course</th>
                                                    <th className="small text-muted fw-bold">Amount</th>
                                                    <th className="small text-muted fw-bold">Gateway</th>
                                                    <th className="small text-muted fw-bold">Status</th>
                                                    <th className="small text-muted fw-bold">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payments.map(p => (
                                                    <tr key={p.id}>
                                                        <td className="fw-medium">{p.courseName}</td>
                                                        <td>Rs. {Number(p.amount).toFixed(2)}</td>
                                                        <td><Badge bg={p.gateway === 'esewa' ? 'success' : 'primary'} className="text-capitalize px-2">{p.gateway}</Badge></td>
                                                        <td>
                                                            <Badge bg={p.status === 'Completed' ? 'success' : p.status === 'Failed' ? 'danger' : 'warning'} className="px-2">
                                                                {p.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="small text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </div>
                            )}



                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <style>{`
                .cursor-pointer { cursor: pointer; }
                .hover-bg-light:hover { background-color: rgba(0,0,0,0.02); }
                [data-bs-theme="dark"] .hover-bg-light:hover { background-color: rgba(255,255,255,0.05); }
                
                /* Custom Checkbox Styling to match Image 2 */
                .form-check-input:checked {
                    background-color: var(--bs-success);
                    border-color: var(--bs-success);
                }
            `}</style>
        </Container>
    );
};

export default Profile;

