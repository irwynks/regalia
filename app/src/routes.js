import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom'; 
import { Dashboard } from './pages/dashboard';
import { Landing } from './pages/landing';
import { Admin } from './pages/admin'; 
import localforage from 'localforage';


const routes = (isLoggedIn, isAdmin) => { 
    return [
        {
            path: '/dash',
            element: isLoggedIn ? <Dashboard /> : <Navigate to="/login" />,
            children: [
                { path: 'admin', element: isAdmin ? <Admin /> : <Navigate to="/" /> },
                { path: '', element: <Navigate to="/app/dash" /> },
            ],
        },
        {
            path: '/',
            element: !isLoggedIn ? <Landing /> : isAdmin ? <Navigate to="/dash/admin" /> : <Navigate to="/dash/admin" />,
        },
    ]
};

export default routes;