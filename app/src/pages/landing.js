import { Outlet, useNavigate } from "react-router-dom";
import { Container, Alert, Button } from 'react-bootstrap';
import { Header } from '../components/header';
import './landing.scss' 

export const Landing = () => { 
    const navigate = useNavigate();
    
    return ( 
        <Container fluid className='landing-container'> 

            <div className="login"
                onClick={() => {
                    window.location.href = 'https://discord.com/api/oauth2/authorize?client_id=1049138074015256576&redirect_uri=https%3A%2F%2Fregalia.live%2Fauth&response_type=code&scope=identify%20guilds' 
                }}
            >
                <img src="/discord-logo.png" height='30' alt="" />
            </div>

            <div className="logo-container">
            <div className="image">
                <img src="/logo.png" alt="Regalia Logo" />
            </div>
                <div className="text">Regalia</div>
                <div className="description">NFT ROYALTY TRACKING</div> 
            </div> 

            </Container> 
    );
};
