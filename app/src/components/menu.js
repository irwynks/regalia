import { useGlobal, useState } from 'reactn';
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Container, Navbar, Nav, Image } from 'react-bootstrap';
import './menu.scss';

export const Menu = () => {

    const navigate = useNavigate();
    const location = useLocation();

    let [user, setUser] = useGlobal('user');
    let [mode] = useGlobal('mode');

    return (
        <div className="menu">
            MENU
        </div>
    );
};
