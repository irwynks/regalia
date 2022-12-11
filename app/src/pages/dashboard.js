import {useMemo} from "reactn";
import { Outlet } from "react-router-dom";
import { Container, Row, Col } from 'react-bootstrap';
import { Header } from '../components/header';
import { Footer } from '../components/footer';
import { Menu } from '../components/menu';

import './dashboard.scss' 

export const Dashboard = () => { 
    return (         
        <Container fluid> 
            <Header /> 
            <Outlet />
            <Footer />                   
        </Container>
    );
};
