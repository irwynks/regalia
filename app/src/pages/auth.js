import {useState, useEffect, useGlobal} from 'reactn';
import { Navigate, Outlet, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Container, Alert, Button, Image } from 'react-bootstrap';

import './auth.scss'
import axios from 'axios';

export const Auth = () => {
    const navigate = useNavigate();
    let [searchParams, setSearchParams] = useSearchParams();
    let [user, setUser] = useGlobal('user');
    let [nfts, setNFTs] = useGlobal('nfts');
    let [session, setSession] = useGlobal('session');
    let [guilds, setGuilds] = useGlobal('guilds');
    let [collections, setCollections] = useGlobal('collections'); 

    const authUser = async (code) => {
        const { data:response } = await axios({
            method: 'get',
            url: `{process.env.REACT_APP_DOMAIN}/v1/auth`,
            params: { code }, 
        }) 
        if (response.success) {
            
            let { data } = response;
            let { user, guilds, session_id } = data; 

            if (!!user) {
                setUser(user);
                setNFTs(user.nfts);
                setGuilds(guilds);
                setCollections(user.collections);
                setSession(session_id);
                window.localStorage.setItem('session', session_id)
            }

        } else { 
        }
    }

    let fired = false;

    useEffect(() => {
        const code = searchParams.get('code');
        //searchParams.delete('code');
        //setSearchParams(searchParams);
        if (!!code && !fired) {
            fired = true;
            authUser(code);
        }
    }, [])

    useEffect(() => {
        if(!!user && !!user.discriminator)
            navigate('/dash/admin') 
    }, [user])

    return (
        <Container fluid className='auth-container'> 

        </Container>
    );
};
