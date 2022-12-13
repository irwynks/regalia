import { useGlobal, useState, useMemo } from 'reactn'; 
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Container, Navbar, Nav, Image, } from 'react-bootstrap';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import './header.scss'; 

const bsf = (str, chars) => {
    return `${str.slice(0, chars)}...${str.slice(-1 * +chars)}`
}

export const Header = () => {

    const navigate = useNavigate();

    let [user, setUser] = useGlobal('user');
    let [mode] = useGlobal('mode');

    let memoified_user = useMemo(() => user, [user]); 

    return ( 
        <Navbar className="header"> 
            <Container fluid style={{position:'relative'}}> 
            <Navbar.Brand onClick={(e) => {
                    e.preventDefault();
                    navigate('/');
                }}> 
                <div className="logo">
                    <div className="image">
                        <img src="/logo.png" alt="Regalia Logo"/>
                    </div>
                </div>
                </Navbar.Brand> 
                
                <Navbar.Toggle /> 
                <Link className="nav-link switch" onClick={(e) => { e.preventDefault(); navigate('/dash/' + (mode === 'admin' ? 'user' : 'admin'), { replace: true }) }}> {mode === 'admin' ? 'Switch to user mode' : 'Switch to creator mode'} </Link>
                <div className="justify-content-end"> 
            <Navbar.Text collapse>
                        <div className="user">
                            <div className="avatar">
                                <Image src={
                                    //`https://source.boringavatars.com/bauhaus/200/${user.pubkey}?colors=FB6F24,EECB22,5191C1,1E6495,0A4B75`
                                    `https://avatars.dicebear.com/api/identicon/${user.pubkey}.svg`
                                } rounded />
                            </div> 
                            <div className="username"><WalletMultiButton /></div>
                           
                        </div> 
            </Navbar.Text>
            </div>
        </Container>
    </Navbar> 
    );
};
