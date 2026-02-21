import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; 
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import CreateCourse from './pages/CreateCourse';
import RoleRoute from './components/RoleRoute';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />

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

                    <Route path="*" element={<div className="p-5 text-center">404 - Not Found</div>} />

                    <Route
                        path="/create-course"
                        element={
                            <ProtectedRoute>
                                <RoleRoute allowedRoles={['Teacher']}>
                                    <Layout>
                                        <CreateCourse />
                                    </Layout>
                                </RoleRoute>
                            </ProtectedRoute>
                        }
                    />

                </Routes>
            </Router>
        </QueryClientProvider>
    );
}

export default App;