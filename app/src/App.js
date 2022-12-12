import React, {useState, useEffect, useGlobal, useMemo} from "reactn"; 
import { createBrowserRouter, RouterProvider, } from "react-router-dom"; 
import { Navigate, Outlet } from 'react-router-dom';

import { Dashboard } from './pages/dashboard';
import { Landing } from './pages/landing';
import { Admin } from './pages/Admin/admin';
import { User } from './pages/User/user';
import { Auth } from './pages/auth';

import './App.scss'; 

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import "@solana/wallet-adapter-react-ui/styles.css"
import { clusterApiUrl } from '@solana/web3.js'; 

const App = () => {
    
    let [session] = useGlobal('session');
    
    console.log('RENDER APP', session);

    console.log(process.env.REACT_APP_RPC)

    const router = createBrowserRouter([
        {
            path: '/',
            element: !!!session ? <Landing /> : <Navigate to="/dash/user" />,
        },
        {
            path: '/auth',
            element: <Auth />,
        },
        {
            path: '/dash',
            element: !!session ? <Dashboard /> : <Navigate to="/" />,
            children: [
                { path: '/dash/admin', element: !!session ? <Admin /> : <Navigate to="/" /> },
                { path: '/dash/user', element: !!session ? <User /> : <Navigate to="/" /> },
                { path: '', element: !!session ? <Navigate to="/dash/user" /> : <Navigate to="/" /> },
            ],
        },
    ]);

    const network = WalletAdapterNetwork.Mainnet;

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SlopeWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new SolletWalletAdapter({ network }),
            new SolletExtensionWalletAdapter({ network }),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={process.env.REACT_APP_RPC}>
            <WalletProvider wallets={wallets} autoConnect={true}>
                <WalletModalProvider>
                    <RouterProvider router={router} /> 
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider> 
    )

};    

export default App;