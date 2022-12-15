import { useGlobal, useState, useEffect, useMemo } from 'reactn'; 
import { Outlet, useNavigate } from "react-router-dom";
import { Container, Alert, Button } from 'react-bootstrap';
import { Header } from '../components/header';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import './landing.scss' 

import axios from 'axios'; 
const { decodeUTF8 } = require("tweetnacl-util");
const bs58 = require('bs58')

export const Landing = () => { 
    const navigate = useNavigate();
    const wallet = useWallet();
    
    let [user, setUser] = useGlobal('user');
    let [nfts, setNFTs] = useGlobal('nfts');
    let [session, setSession] = useGlobal('session');
    let [guilds, setGuilds] = useGlobal('guilds');
    let [collections, setCollections] = useGlobal('collections'); 

    useEffect(() => {
        if (!!wallet.publicKey) {
            connectWallet();
        }
    }, [wallet.publicKey]);

    const connectWallet = async () => { 
        if (!!wallet.publicKey) {
            const pubkey = wallet.publicKey.toBase58();
            let { data } = await axios.get(`https://api.regalia.live/v1/auth/nonce?pubkey=${pubkey}`);
            const { nonce } = data.data;
            wallet.signMessage(decodeUTF8(nonce)).then(async signed => {
                let encoded = bs58.encode(signed);
                let { data: response } = await axios({
                    method: 'post',
                    url: 'https://api.regalia.live/v1/auth/signed',
                    data: { encoded, pubkey }
                }) 

                if (!response.success) {
                    wallet.disconnect();
                } else {
                    let { user, guilds, session_id } = response.data;
                    if (!!user) { 
                        setUser(user);
                        setNFTs(user.nfts);
                        setGuilds(guilds);
                        setCollections(user.collections);
                        setSession(session_id);
                        window.localStorage.setItem('session', session_id)
                    }
                }
            }).catch((err) => {
                console.error(err); 
            });
        } else {
            console.log('Not connected');
        }

    }

    return ( 
        <Container fluid className='landing-container'> 
            <div className="login">
                <WalletMultiButton />
            </div>

            <div className="logo-container">
            <div className="image">
                <img src="/logo.png" alt="Regalia Logo" />
            </div>
                <div className="text">Regalia</div>
                <div className="description">NFT ROYALTY TRACKING SUITE</div> 
            </div> 

            </Container> 
    );
};
