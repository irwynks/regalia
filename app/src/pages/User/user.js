import { useGlobal, useState, useEffect } from 'reactn';
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Container, Alert, Image } from 'react-bootstrap';

export const User = () => {
    const navigate = useNavigate();
    let [user, setUser] = useGlobal('user')
    let [mode, setMode] = useGlobal('mode')
    
    useEffect(() => {
        setMode('user');
    }, []) 

    return (
        <Container className="user-container" fluid>

        </Container>
    );
};
