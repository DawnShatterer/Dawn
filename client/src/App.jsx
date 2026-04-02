import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard'; 
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';
import CourseDetail from './pages/CourseDetail';
import RoleRoute from './components/RoleRoute';
import AllCourses from './pages/AllCourses';
import StudentProgress from './pages/StudentProgress';
import TeacherAnalytics from './pages/TeacherAnalytics';
import AdminDashboard from './pages/AdminDashboard';
import AdminHome from './pages/AdminHome';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import StudentDetail from './pages/StudentDetail';
import Subscriptions from './pages/Subscriptions';
import MyCourses from './pages/MyCourses';
import Leaderboard from './pages/Leaderboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import NotFound from './pages/NotFound';

import DawnPlatform from './pages/DawnPlatform';
import Help from './pages/Help';
import ContentPage from './pages/ContentPage';
import AboutUs from './pages/AboutUs';

import { ThemeProvider } from './contexts/ThemeContext';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        
                        <Route path="/dawn-platform" element={<DawnPlatform />} />
                        <Route path="/help" element={<Help />} />
                        <Route path="/content" element={<ContentPage />} />
                        <Route path="/about-us" element={<AboutUs />} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/payment-failed" element={<PaymentFailed />} />

                        <Route path="/subscriptions" element={<ProtectedRoute><Layout><Subscriptions /></Layout></ProtectedRoute>} />
                        <Route path="/my-courses" element={<ProtectedRoute><Layout><MyCourses /></Layout></ProtectedRoute>} />
                        <Route path="/leaderboard" element={<ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>} />

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
                                    <RoleRoute allowedRoles={['Teacher', 'Admin']}>
                                        <Layout>
                                            <CreateCourse />
                                        </Layout>
                                    </RoleRoute>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/edit-course/:id"
                            element={
                                <ProtectedRoute>
                                    <RoleRoute allowedRoles={['Teacher', 'Admin']}>
                                        <Layout>
                                            <EditCourse />
                                        </Layout>
                                    </RoleRoute>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/analytics"
                            element={
                                <ProtectedRoute>
                                    <RoleRoute allowedRoles={['Teacher', 'Admin']}>
                                        <Layout>
                                            <TeacherAnalytics />
                                        </Layout>
                                    </RoleRoute>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin-home"
                            element={
                                <ProtectedRoute>
                                    <RoleRoute allowedRoles={['Admin']}>
                                        <Layout>
                                            <AdminHome />
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
                            path="/my-courses"
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
                </Router>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;