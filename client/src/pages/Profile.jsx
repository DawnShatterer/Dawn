import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Nav, Table, Badge } from 'react-bootstrap';
import { User, Shield, CreditCard, Gift, LayoutDashboard, Camera, Star, Zap, Tag } from 'lucide-react';
import { getUserInfo } from '../utils/authUtils';
import api from '../api/axios';

const Profile = () => {
    const user = getUserInfo();
    const [activeTab, setActiveTab] = useState('identity');

    // Role mappings
    const isStudent = user?.role?.toLowerCase() === 'student';
    const isTeacher = user?.role?.toLowerCase() === 'teacher';
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    // -- State for Personal Identity
    const [identityData, setIdentityData] = useState({
        FullName: user?.name || '',
        NickName: user?.nickName || '',
        Email: user?.email || '',
        Phone: user?.phone || '',
        Location: user?.location || '',
        Grade: user?.grade || ''
    });
    const [isSavingIdentity, setIsSavingIdentity] = useState(false);
    const [identityMessage, setIdentityMessage] = useState({ type: '', text: '' });
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleIdentityChange = (e) => {
        setIdentityData({ ...identityData, [e.target.name]: e.target.value });
    };

    const handleSaveIdentity = async (e) => {
        e.preventDefault();
        setIsSavingIdentity(true);
        setIdentityMessage({ type: '', text: '' });
        try {
            const res = await api.put('/Auth/profile', identityData);
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
            }
            setIdentityMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error('Update failed', error);
            setIdentityMessage({ type: 'danger', text: 'Failed to update profile.' });
        } finally {
            setIsSavingIdentity(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);

        setIsUploadingAvatar(true);
        setIdentityMessage({ type: '', text: '' });

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
            console.error('Avatar upload failed', error);
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
        prefOthers: true,
        guideLearn: true,
        guideTest: true,
        guideMock: true
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
                    prefOthers: res.data.prefOthers,
                    guideLearn: res.data.guideLearn,
                    guideTest: res.data.guideTest,
                    guideMock: res.data.guideMock
                });
            } catch (err) {
                console.error("Failed to load user settings", err);
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
                    console.error('Failed to load payment history', err);
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
            console.error("Failed to sync structural configuration.", err);
        }
    };

    return (
        <Container fluid className="py-4 font-sans bg-body-tertiary" style={{ minHeight: '100vh' }}>
            <div className="d-flex align-items-center mb-4 ps-1">
                <h4 className="fw-bolder text-body mb-0">My Profile</h4>
            </div>

            <Row className="g-4">
                {/* ─── LEFT NAVIGATION TABS ─── */}
                <Col lg={3} md={4}>
                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-3">
                        <Card.Body className="p-0">
                            <Nav className="flex-column profile-nav">
                                <Nav.Link 
                                    className={`py-3 px-4 d-flex align-items-center ${activeTab === 'identity' ? 'bg-primary bg-opacity-10 text-primary border-start border-4 border-primary fw-bold' : 'text-body hover-bg-light'}`}
                                    onClick={() => setActiveTab('identity')}
                                    style={{ cursor: 'pointer', borderStart: '4px solid transparent' }}>
                                    <User size={18} className="me-3" /> Personal Identity
                                </Nav.Link>

                                <Nav.Link 
                                    className={`py-3 px-4 d-flex align-items-center ${activeTab === 'security' ? 'bg-primary bg-opacity-10 text-primary border-start border-4 border-primary fw-bold' : 'text-body hover-bg-light border-top'}`}
                                    onClick={() => setActiveTab('security')}
                                    style={{ cursor: 'pointer', borderStart: '4px solid transparent' }}>
                                    <Shield size={18} className="me-3" /> Security & Settings
                                </Nav.Link>

                                {isStudent && (
                                    <>
                                        <Nav.Link 
                                            className={`py-3 px-4 d-flex align-items-center ${activeTab === 'subscriptions' ? 'bg-primary bg-opacity-10 text-primary border-start border-4 border-primary fw-bold' : 'text-body hover-bg-light border-top'}`}
                                            onClick={() => setActiveTab('subscriptions')}
                                            style={{ cursor: 'pointer', borderStart: '4px solid transparent' }}>
                                            <LayoutDashboard size={18} className="me-3" /> Active Subscriptions
                                        </Nav.Link>

                                        <Nav.Link 
                                            className={`py-3 px-4 d-flex align-items-center ${activeTab === 'billing' ? 'bg-primary bg-opacity-10 text-primary border-start border-4 border-primary fw-bold' : 'text-body hover-bg-light border-top'}`}
                                            onClick={() => setActiveTab('billing')}
                                            style={{ cursor: 'pointer', borderStart: '4px solid transparent' }}>
                                            <CreditCard size={18} className="me-3" /> Billing History
                                        </Nav.Link>

                                        <Nav.Link 
                                            className={`py-3 px-4 d-flex align-items-center ${activeTab === 'coupons' ? 'bg-primary bg-opacity-10 text-primary border-start border-4 border-primary fw-bold' : 'text-body hover-bg-light border-top'}`}
                                            onClick={() => setActiveTab('coupons')}
                                            style={{ cursor: 'pointer', borderStart: '4px solid transparent' }}>
                                            <Gift size={18} className="me-3" /> Reward Coupons
                                        </Nav.Link>
                                    </>
                                )}

                                {isTeacher && (
                                    <Nav.Link 
                                        className={`py-3 px-4 d-flex align-items-center ${activeTab === 'payouts' ? 'bg-primary bg-opacity-10 text-primary border-start border-4 border-primary fw-bold' : 'text-body hover-bg-light border-top'}`}
                                        onClick={() => setActiveTab('payouts')}
                                        style={{ cursor: 'pointer', borderStart: '4px solid transparent' }}>
                                        <CreditCard size={18} className="me-3" /> Payout History
                                    </Nav.Link>
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
                                                <Form.Control type="text" name="NickName" value={identityData.NickName} onChange={handleIdentityChange} placeholder="e.g. Dawnless 4237" className="py-2 px-3 bg-body-tertiary border-0 shadow-none text-body" />
                                            </Form.Group>

                                            <Form.Group className="mb-4">
                                                <Form.Label className="small text-muted mb-1">Email Address</Form.Label>
                                                <Form.Control type="email" name="Email" value={identityData.Email} readOnly className="py-2 px-3 bg-body-secondary border-0 shadow-none text-muted" />
                                                <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.75rem' }}>
                                                    This is your primary email address. <span className="text-primary" style={{ cursor: 'pointer' }}>Change Email Address</span>
                                                </Form.Text>
                                            </Form.Group>

                                            <Form.Group className="mb-4">
                                                <Form.Label className="small text-muted mb-1">Phone Number</Form.Label>
                                                <Form.Control type="text" name="Phone" value={identityData.Phone} onChange={handleIdentityChange} placeholder="Phone Number" className="py-2 px-3 border-opacity-25" />
                                            </Form.Group>

                                            <Form.Group className="mb-4">
                                                <Form.Label className="small text-muted mb-1">Location</Form.Label>
                                                <Form.Control type="text" name="Location" value={identityData.Location} onChange={handleIdentityChange} placeholder="e.g. Nepal" className="py-2 px-3 bg-body-tertiary border-0 text-body" />
                                            </Form.Group>

                                            <Form.Group className="mb-5">
                                                <Form.Label className="small text-muted mb-1">Grade</Form.Label>
                                                <Form.Control type="text" name="Grade" value={identityData.Grade} onChange={handleIdentityChange} placeholder="Grade" className="py-2 px-3 border-opacity-25" />
                                            </Form.Group>

                                            <div className="d-flex align-items-center border-top pt-4">
                                                <Button type="submit" variant="primary" disabled={isSavingIdentity} className="px-4 py-2 mt-4 ms-auto rounded-3 fw-bold">
                                                    {isSavingIdentity ? <><Spinner size="sm" className="me-2"/> Saving...</> : 'Save Changes'}
                                                </Button>
                                            </div>
                                        </Col>
                                        
                                        <Col lg={4} className="d-flex flex-column align-items-center pt-3">
                                            <div className="position-relative mb-2">
                                                {user?.profilePictureUrl ? (
                                                    <div className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center shadow-sm" style={{ width: '120px', height: '120px', border: '3px solid white' }}>
                                                        <img src={user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${user.profilePictureUrl}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                ) : (
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                                                        <User size={50} />
                                                    </div>
                                                )}
                                                
                                                <div 
                                                    className="position-absolute bg-white rounded-circle shadow-sm p-2 d-flex align-items-center justify-content-center" 
                                                    style={{ right: 0, bottom: 5, border: '1px solid #eee', cursor: isUploadingAvatar ? 'wait' : 'pointer' }}
                                                    onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                                                >
                                                    {isUploadingAvatar ? <Spinner size="sm" animation="border" variant="primary" /> : <Camera size={16} className="text-muted" />}
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
                                            
                                            <Form.Check type="checkbox" id="email-notif" label="Enable Email Notifications" checked={notifications.prefEmailNotif} onChange={() => handleNotifToggle('prefEmailNotif')} className="mb-3 fw-medium text-body" />
                                            <Form.Check type="checkbox" id="app-notif" label="Enable In-app Notifications" checked={notifications.prefInAppNotif} onChange={() => handleNotifToggle('prefInAppNotif')} className="mb-2 fw-medium text-body text-success" />
                                            
                                            <div className="ms-4">
                                                <Form.Check type="checkbox" id="sess-notif" label={<span className="text-muted">Sessions</span>} checked={notifications.prefSessions} onChange={() => handleNotifToggle('prefSessions')} className="mb-2" />
                                                <Form.Check type="checkbox" id="ass-notif" label={<span className="text-muted">Assignments</span>} checked={notifications.prefAssignments} onChange={() => handleNotifToggle('prefAssignments')} className="mb-2" />
                                                <Form.Check type="checkbox" id="ann-notif" label={<span className="text-muted">Announcements</span>} checked={notifications.prefAnnouncements} onChange={() => handleNotifToggle('prefAnnouncements')} className="mb-2" />
                                                <Form.Check type="checkbox" id="oth-notif" label={<span className="text-body fw-medium">Others</span>} checked={notifications.prefOthers} onChange={() => handleNotifToggle('prefOthers')} className="mb-4" />
                                            </div>
                                        </div>

                                        <div>
                                            <h5 className="fw-bold mb-1">Popup Guides Settings</h5>
                                            <p className="small text-muted mb-4">Show or hide the popup guides of MST.</p>

                                            <Form.Check type="checkbox" id="guide-learn" label="Show &quot;Learn/Revise&quot; Guide" checked={notifications.guideLearn} onChange={() => handleNotifToggle('guideLearn')} className="mb-3 fw-medium text-body" />
                                            <Form.Check type="checkbox" id="guide-test" label="Show &quot;Test how good you are&quot; Guide" checked={notifications.guideTest} onChange={() => handleNotifToggle('guideTest')} className="mb-3 fw-medium text-body" />
                                            <Form.Check type="checkbox" id="guide-mock" label="Show &quot;Mock Papers&quot; Guide" checked={notifications.guideMock} onChange={() => handleNotifToggle('guideMock')} className="mb-3 fw-medium text-body" />
                                        </div>
                                    </Col>
                                </Row>
                            )}

                            {/* 3. SUBSCRIPTIONS TAB (STUDENT ONLY) */}
                            {isStudent && activeTab === 'subscriptions' && (
                                <div className="text-center py-5">
                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                                        <LayoutDashboard size={32} />
                                    </div>
                                    <h5 className="fw-bold text-body">Active Subscriptions</h5>
                                    <p className="text-muted">You do not have any active subscriptions right now. Integrate Khalti/eSewa in the next update to view plans.</p>
                                </div>
                            )}

                            {/* 4. BILLING TAB (STUDENT ONLY) */}
                            {isStudent && activeTab === 'billing' && (
                                <div>
                                    <h5 className="fw-bold mb-4">Billing History</h5>
                                    {paymentsLoading && <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>}
                                    {!paymentsLoading && payments.length === 0 && (
                                        <div className="text-center py-5">
                                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                                                <CreditCard size={32} />
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

                            {/* 5. DAWN REWARDS CENTER (STUDENT ONLY) */}
                            {isStudent && activeTab === 'coupons' && (
                                <DawnRewardsCenter />
                            )}

                            {/* 6. PAYOUTS TAB (TEACHER ONLY) */}
                            {isTeacher && activeTab === 'payouts' && (
                                <InstructorPayouts />
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

// ── Dawn Rewards Center Component ──
const DawnRewardsCenter = () => {
    const [pointsData, setPointsData] = useState(null);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState(false);
    const [earning, setEarning] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [balRes, coupRes] = await Promise.all([
                api.get('/Points/balance'),
                api.get('/Points/coupons')
            ]);
            setPointsData(balRes.data);
            setCoupons(coupRes.data);
        } catch (err) {
            console.error('Failed to load rewards data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleEarn = async (action, detail) => {
        setEarning(true);
        setFeedback(null);
        try {
            const res = await api.post('/Points/earn', { action, detail });
            setFeedback({ type: 'success', msg: `+${res.data.pointsEarned} points! ${res.data.reason}` });
            fetchData();
        } catch (err) {
            setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to earn points.' });
        } finally {
            setEarning(false);
        }
    };

    const handleRedeem = async () => {
        if (!window.confirm('Redeem 2500 Dawn Points for a 20% discount coupon?')) return;
        setRedeeming(true);
        setFeedback(null);
        try {
            const res = await api.post('/Points/redeem');
            setFeedback({ type: 'success', msg: `Coupon generated: ${res.data.couponCode} (${res.data.discountPercent}% off!)` });
            fetchData();
        } catch (err) {
            setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to redeem.' });
        } finally {
            setRedeeming(false);
        }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

    const total = pointsData?.totalPoints || 0;
    const progress = Math.min((total / 2500) * 100, 100);

    return (
        <div>
            <Row className="g-4 mb-4">
                {/* Points Balance Card */}
                <Col md={5}>
                    <Card className="border-0 shadow-sm rounded-4 h-100 text-center p-4">
                        <div className="position-relative d-inline-block mx-auto mb-3" style={{ width: 120, height: 120 }}>
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="#e9ecef" strokeWidth="8" />
                                <circle cx="60" cy="60" r="52" fill="none" stroke="#6f42c1" strokeWidth="8"
                                    strokeDasharray={`${progress * 3.27} 327`} strokeLinecap="round"
                                    transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                            </svg>
                            <div className="position-absolute top-50 start-50 translate-middle text-center">
                                <div className="fw-bold fs-4" style={{ color: '#6f42c1' }}>{total}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>DAWN PTS</div>
                            </div>
                        </div>
                        <p className="text-muted small mb-2">{total >= 2500 ? 'You can redeem a coupon!' : `${2500 - total} pts until your next coupon`}</p>
                        <Button variant="primary" className="rounded-pill fw-bold px-4" disabled={total < 2500 || redeeming} onClick={handleRedeem}
                            style={{ background: '#6f42c1', borderColor: '#6f42c1' }}>
                            {redeeming ? <Spinner size="sm" /> : <><Gift size={16} className="me-2" />Redeem 20% Coupon</>}
                        </Button>
                    </Card>
                </Col>

                {/* Ways to Earn */}
                <Col md={7}>
                    <Card className="border-0 shadow-sm rounded-4 h-100 p-4">
                        <h6 className="fw-bold mb-3"><Zap size={18} className="me-2 text-warning" />Ways to Earn Dawn Points</h6>
                        {feedback && <Alert variant={feedback.type} className="py-2 small" dismissible onClose={() => setFeedback(null)}>{feedback.msg}</Alert>}
                        <div className="d-flex flex-column gap-2">
                            <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-body-tertiary">
                                <span className="small"><Star size={14} className="text-warning me-2" />Daily Login (15 min activity)</span>
                                <Button size="sm" variant="outline-success" className="rounded-pill px-3 fw-bold" disabled={earning} onClick={() => handleEarn('daily_login')}>+50 pts</Button>
                            </div>
                            <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-body-tertiary">
                                <span className="small"><Star size={14} className="text-success me-2" />Purchase a Course</span>
                                <Badge bg="secondary" className="rounded-pill px-3">+500 pts (auto)</Badge>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Active Coupons */}
            {coupons.length > 0 && (
                <Card className="border-0 shadow-sm rounded-4 p-4 mb-4">
                    <h6 className="fw-bold mb-3"><Tag size={18} className="me-2 text-success" />Your Coupons</h6>
                    <Row className="g-3">
                        {coupons.map((c, i) => (
                            <Col md={4} key={i}>
                                <Card className={`border rounded-3 p-3 text-center ${c.isUsed || c.expired ? 'opacity-50' : ''}`}>
                                    <div className="fw-bold text-primary" style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '1px' }}>{c.code}</div>
                                    <div className="text-success fw-bold">{c.discountPercent}% OFF</div>
                                    <small className="text-muted">Max Rs. {c.maxDiscountAmount}</small>
                                    <div className="mt-2">
                                        {c.isUsed ? <Badge bg="secondary">Used</Badge> : c.expired ? <Badge bg="danger">Expired</Badge> : <Badge bg="success">Active</Badge>}
                                    </div>
                                    <small className="text-muted mt-1 d-block">Expires: {new Date(c.expiresAt).toLocaleDateString()}</small>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card>
            )}

            {/* Points History */}
            {pointsData?.transactions?.length > 0 && (
                <Card className="border-0 shadow-sm rounded-4 p-4">
                    <h6 className="fw-bold mb-3"><CreditCard size={18} className="me-2 text-info" />Points History</h6>
                    <Table responsive hover size="sm" className="align-middle mb-0">
                        <thead className="bg-body-tertiary"><tr><th className="small">Points</th><th className="small">Reason</th><th className="small">Date</th></tr></thead>
                        <tbody>
                            {pointsData.transactions.slice(0, 15).map((t, i) => (
                                <tr key={i}>
                                    <td><Badge bg={t.points > 0 ? 'success' : 'danger'} className="px-2">{t.points > 0 ? `+${t.points}` : t.points}</Badge></td>
                                    <td className="small">{t.reason}</td>
                                    <td className="small text-muted">{new Date(t.date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            )}
        </div>
    );
};

// ── Instructor Payouts Component ──
const InstructorPayouts = () => {
    const [payoutData, setPayoutData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [formData, setFormData] = useState({ amount: '', paymentMethod: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Payout/my-payouts');
            setPayoutData(res.data);
        } catch (err) {
            console.error('Failed to load payouts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleRequest = async (e) => {
        e.preventDefault();
        setRequesting(true);
        setFeedback(null);
        try {
            await api.post('/Payout/request', {
                amount: Number(formData.amount),
                paymentMethod: formData.paymentMethod
            });
            setFeedback({ type: 'success', msg: 'Payout requested successfully. Admin will review it shortly.' });
            setFormData({ amount: '', paymentMethod: '' });
            fetchData();
        } catch (err) {
            setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to request payout.' });
        } finally {
            setRequesting(false);
        }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

    const net = Number(payoutData?.netEarnings || 0);
    const withdrawn = Number(payoutData?.withdrawnOrPending || 0);
    const available = Number(payoutData?.availableBalance || 0);

    return (
        <div>
            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="border shadow-sm rounded-4 h-100 p-4 text-center" style={{ background: 'var(--bs-body-bg)' }}>
                        <h6 style={{ color: '#198754' }} className="fw-bold">Available Balance</h6>
                        <h2 className="fw-bold mb-0" style={{ color: 'var(--bs-emphasis-color, #212529)' }}>Rs. {available.toFixed(2)}</h2>
                        <small style={{ color: 'var(--bs-secondary-color, #6c757d)' }}>Ready to withdraw</small>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border shadow-sm rounded-4 h-100 p-4 text-center" style={{ background: 'var(--bs-body-bg)' }}>
                        <h6 style={{ color: '#0d6efd' }} className="fw-bold">Total Net Earnings</h6>
                        <h2 className="fw-bold mb-0" style={{ color: 'var(--bs-emphasis-color, #212529)' }}>Rs. {net.toFixed(2)}</h2>
                        <small style={{ color: 'var(--bs-secondary-color, #6c757d)' }}>80% cut of gross sales</small>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border shadow-sm rounded-4 h-100 p-4 text-center" style={{ background: 'var(--bs-body-bg)' }}>
                        <h6 style={{ color: '#6c757d' }} className="fw-bold">Withdrawn/Pending</h6>
                        <h2 className="fw-bold mb-0" style={{ color: 'var(--bs-emphasis-color, #212529)' }}>Rs. {withdrawn.toFixed(2)}</h2>
                        <small style={{ color: 'var(--bs-secondary-color, #6c757d)' }}>Requested so far</small>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm rounded-4 p-4 mb-4">
                <h6 className="fw-bold mb-3"><CreditCard size={18} className="me-2 text-primary" />Request Payout</h6>
                {feedback && <Alert variant={feedback.type} className="py-2 small">{feedback.msg}</Alert>}
                <Form onSubmit={handleRequest}>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Amount (Rs.)</Form.Label>
                                <Form.Control required type="number" min="1000" max={Math.floor(available)} step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="Min 1,000" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">eSewa ID / Bank Details</Form.Label>
                                <Form.Control required type="text" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} placeholder="e.g. eSewa: 9840000000" />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Button type="submit" variant="primary" className="w-100 fw-bold rounded-3" disabled={requesting || available < 1000}>
                                {requesting ? <Spinner size="sm" /> : 'Withdraw'}
                            </Button>
                        </Col>
                    </Row>
                    {available < 1000 && <small className="text-danger mt-2 d-block">Minimum withdrawal is Rs. 1,000.</small>}
                </Form>
            </Card>

            {payoutData?.payoutHistory?.length > 0 && (
                <Card className="border-0 shadow-sm rounded-4 p-4">
                    <h6 className="fw-bold mb-3">Withdrawal History</h6>
                    <Table responsive hover size="sm" className="align-middle mb-0">
                        <thead className="bg-body-tertiary">
                            <tr><th className="small">Date</th><th className="small">Amount</th><th className="small">Destination</th><th className="small">Status</th><th className="small">Admin Notes</th></tr>
                        </thead>
                        <tbody>
                            {payoutData.payoutHistory.map((p, i) => (
                                <tr key={i}>
                                    <td className="small">{new Date(p.createdAt).toLocaleDateString()}</td>
                                    <td className="fw-bold">Rs. {p.amount.toFixed(2)}</td>
                                    <td className="small text-muted">{p.paymentMethod}</td>
                                    <td>
                                        <Badge bg={p.status === 'Paid' ? 'success' : p.status === 'Rejected' ? 'danger' : 'warning'}>{p.status}</Badge>
                                    </td>
                                    <td className="small text-muted">{p.adminNotes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            )}
        </div>
    );
};
