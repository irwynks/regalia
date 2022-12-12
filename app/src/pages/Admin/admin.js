import { useGlobal, useState, useEffect } from 'reactn'; 
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Container, Tabs, Tab, Image } from 'react-bootstrap';
import { Overview } from './tabs/overview';
import { Community } from './tabs/community';
import { Settings } from './tabs/settings';

import './admin.scss';

export const Admin = () => {

    const navigate = useNavigate();
    let [user, setUser] = useGlobal('user');
    let [mode, setMode] = useGlobal('mode');

    let [selectedGuild, setSelectedGuild] = useGlobal('selectedGuild');
    let [activeKey, setKey] = useGlobal('activeTabKey');

    useEffect(() => {
        setMode('admin');
    }, [])

    useEffect(() => {
        console.log('ACTIVE KEY CHANGED', activeKey)
    }, [activeKey])
    

    return (
        <Container className="admin-container" fluid> 
            <Container className="admin-interface"> 
                <Tabs activeKey={activeKey} onSelect={(k) => setKey(k)} className="mb-3" fill >
                        <Tab eventKey="overview" title="Royalty Stats">
                            <Overview />
                        </Tab> 
                        <Tab eventKey="community" title="Community Stats">
                            <Community />
                    </Tab>
                        <Tab eventKey="sentinel" title="Sentinel">
                            <Community />
                        </Tab>
                        <Tab eventKey="settings" title="Settings">
                        <Settings />
                        </Tab>
                    </Tabs> 
            </Container> 
        </Container>
    );
};
