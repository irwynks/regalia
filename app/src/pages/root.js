import * as React from "react";
import { Outlet } from "react-router-dom";
import { Container, Typography } from 'react-bootstrap';

export const Root = () => {
    return (
        <Container>
                ROOT
                <Outlet/> 
        </Container>
    );
};
