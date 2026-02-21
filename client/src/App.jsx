import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={
                        <div className="container mt-5 text-center">
                            <h1>Welcome to your Dashboard</h1>
                            <p>You have successfully connected the React frontend to the .NET API!</p>
                        </div>
                    } />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <div className="container mt-5 text-center">
                                    <h1>Welcome to your Dashboard</h1>
                                    <p>This is a secure area!</p>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => { localStorage.clear(); window.location.reload(); }}>
                                        Logout
                                    </button>
                                </div>
                            </ProtectedRoute>
                        }

                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <h2>Welcome back, {getUserInfo()?.name || 'User'}!</h2>
                                    <p className="text-muted">Here is what is happening with your courses today.</p>
                                    {/* Your Course Cards will go here */}
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Router>
        </QueryClientProvider>
    );
}
export default App;