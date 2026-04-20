import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard'; 
import AboutUs from './pages/AboutUs';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';
import CourseDetail from './pages/CourseDetail';
import RoleRoute from './components/RoleRoute';
import AllCourses from './pages/AllCourses';
import StudentProgress from './pages/StudentProgress';
import AdminDashboard from './pages/AdminDashboard';
import AdminHome from './pages/AdminHome';
import PlatformAnalytics from './pages/PlatformAnalytics';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import StudentDetail from './pages/StudentDetail';
import MyCourses from './pages/MyCourses';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import NotFound from './pages/NotFound';

import FAQ from './pages/FAQ';
import Support from './pages/Support';
import Blog from './pages/Blog';

import ForcePasswordChange from './pages/ForcePasswordChange';
import DashboardSupport from './pages/DashboardSupport';
import StaffAdmissions from './pages/StaffAdmissions';
import MyTuition from './pages/MyTuition';
import AdminSupportMessages from './pages/AdminSupportMessages';
import AdminInvoices from './pages/AdminInvoices';

import { ThemeProvider } from './contexts/ThemeContext';

import GlobalLoader from './components/GlobalLoader';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <ErrorBoundary>
                    <Router>
                        <GlobalLoader>
                            <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />
                            
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />

                            <Route path="/force-password-change" element={<ForcePasswordChange />} />
                            
                            <Route path="/faq" element={<FAQ />} />
                            <Route path="/blog" element={<Blog />} />
                            <Route path="/about-us" element={<AboutUs />} />
                            <Route path="/contact" element={<Support />} />
                            <Route path="/payment-success" element={<PaymentSuccess />} />
                            <Route path="/payment-failed" element={<PaymentFailed />} />
                            <Route path="/my-courses" element={<ProtectedRoute><Layout><MyCourses /></Layout></ProtectedRoute>} />
                            <Route path="/support" element={<ProtectedRoute><Layout><DashboardSupport /></Layout></ProtectedRoute>} />
                            <Route path="/tuition" element={<ProtectedRoute><Layout><MyTuition /></Layout></ProtectedRoute>} />

                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <Dashboard />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/courses"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <AllCourses />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/courses/:id"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <CourseDetail />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <Profile />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/create-course"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute allowedRoles={['Admin', 'Staff']}>
                                            <Layout>
                                                <CreateCourse />
                                            </Layout>
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/admin-queries"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute allowedRoles={['Admin', 'Staff']}>
                                            <Layout>
                                                <AdminSupportMessages />
                                            </Layout>
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/edit-course/:id"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute allowedRoles={['Admin', 'Staff']}>
                                            <Layout>
                                                <EditCourse />
                                            </Layout>
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/admin-home"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute allowedRoles={['Admin', 'Staff']}>
                                            <Layout>
                                                <AdminHome />
                                            </Layout>
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/admissions"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute allowedRoles={['Staff']}>
                                            <Layout>
                                                <StaffAdmissions />
                                            </Layout>
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/platform-analytics"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute allowedRoles={['Admin', 'Staff']}>
                                            <Layout>
                                                <PlatformAnalytics />
                                            </Layout>
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute allowedRoles={['Admin']}>
                                            <Layout>
                                                <AdminDashboard />
                                            </Layout>
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/admin-invoices"
                                element={
                                    <ProtectedRoute>
                                        <RoleRoute allowedRoles={['Admin', 'Staff']}>
                                            <Layout>
                                                <AdminInvoices />
                                            </Layout>
                                        </RoleRoute>
                                    </ProtectedRoute>
                                }
                            />



                            <Route
                                path="/progress"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <StudentProgress />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />




                            <Route
                                path="/messages"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <Messages />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/student/:id"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <StudentDetail />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />

                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </GlobalLoader>
                </Router>
            </ErrorBoundary>
        </ThemeProvider>
    </QueryClientProvider>
    );
}

export default App;