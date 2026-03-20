import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import AppLayout from '../components/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import RouteGuard from '../components/RouteGuard';
import { routes } from '../config/routes';
import { authStore } from '../stores/authStore';

// Import the DefaultDashboard component (with role-based routing)
const DefaultDashboard = React.lazy(() => import('../pages/common/DefaultDashboard'));

const AppRouter: React.FC = () => {
  // Reactive auth check - updates when localStorage changes
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return authStore.isAuthenticated();
  });

  // Listen for storage changes (login/logout in same tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const authenticated = authStore.isAuthenticated();
      setIsAuthenticated(authenticated);
    };

    // Check initially
    handleStorageChange();
    
    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab changes  
    window.addEventListener('auth-change', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, []);

  // Filter routes based on user role
  const getAccessibleRoutes = () => {
    const currentRole = authStore.getRole();
    if (!currentRole) return [];
    
    return routes.filter(route => 
      !route.roles || route.roles.includes(currentRole)
    );
  };

  return (
    <Router>
      <Routes>
        {/* Login route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />
        
        {/* Protected routes with layout */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <AppLayout>
                <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}><Spin size="large" /></div>}>
                  <Routes>
                    <Route 
                      path="/dashboard" 
                      element={
                        <RouteGuard allowedRoles={['SUPER_ADMIN', 'HOTEL_ADMIN']}>
                          <DefaultDashboard />
                        </RouteGuard>
                      } 
                    />
                    
                    {/* Dynamic routes with role guards */}
                    {routes.map((route) => {
                      const Component = route.element;
                      return (
                        <Route
                          key={route.path}
                          path={route.path}
                          element={
                            <RouteGuard allowedRoles={route.roles || ['SUPER_ADMIN', 'HOTEL_ADMIN']}>
                              <Component />
                            </RouteGuard>
                          }
                        />
                      );
                    })}
                    
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
