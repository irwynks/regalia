import { useGlobal, useState, useEffect, useMemo } from 'reactn';
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Container, Tabs, Tab, Accordion, Form, Button, Image, Row, Col } from 'react-bootstrap';
import { useWallet } from '@solana/wallet-adapter-react'; 
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import './settings.scss';

import axios from 'axios';

const { decodeUTF8 } = require("tweetnacl-util");
const bs58 = require('bs58')

export const Settings = (props) => {

    const wallet = useWallet();
    const navigate = useNavigate();
    let [user, setUser] = useGlobal('user');
    let [selectedGuild, setSelectedGuild] = useGlobal('mode'); 

    let [newCollection, setNewCollection] = useState({
        name: "",
        firstCreatorAddress: "",
        symbol: "",
        updateAuthority: "",
    });

    useEffect(() => { 
        if (!!wallet.publicKey) { connectWallet(); } 
    }, [wallet.publicKey]);

    const connectWallet = async () => { 

        if (!!wallet.publicKey) {
            console.log(wallet.publicKey);
            const pubKey = wallet.publicKey.toBase58();
            let session_id = window.sessionStorage.getItem('session_id');
            wallet.signMessage(decodeUTF8('abcdefhijkl')).then(async signed => {
                console.log(signed);
                await addWallet(bs58.encode(signed), pubKey, session_id);
            }).catch((err) => {
                console.error(err);
                wallet.disconnect()
            });
        } else {
            console.log('Not connected');
        }

    }

    const addWallet = async (signature, wallet, session_id) => {
        try { 

            let config = {
                method: 'post',
                url: `https://regalia.live/v1/user/add-wallet`,
                data: { signature, wallet, session_id }
            }

            let { data } = await axios(config);

            console.log(data);

            if (data.success) {
                let updated = { ...user, ...data.data }
                setUser(updated);
            }

        } catch (err) {
            console.log(err);
        }
    }

    const editNewCollection = (e) => { 
        let key = e.target.id;
        let val = e.target.value; 
        let update = { ...newCollection, [key]: val } 
        setNewCollection(update)
    }

    const addCollection = async () => {
        
        try {
            console.log('Adding new collection')
            let session_id = window.localStorage.getItem('session');

            user.collections = [...user.collections, newCollection];

            let config = {
                method: 'put',
                url: `https://api.regalia.live/v1/user`,
                headers: {
                    Authorization: session_id,
                },
                data: { collections: user.collections }
            };

            let {data} = await axios(config); 
            
            console.log(data); 

            setNewCollection({
                name: "",
                firstCreatorAddress: "",
                symbol: "",
                updateAuthority: "",
            })
            setUser(data.data); 

        } catch (err) {
            console.log(err);
        }

    }

    const updateUser = async (update) => {
        try {
            let session_id = window.localStorage.getItem('session');
            let config = {
                method: 'put',
                url: `https://api.regalia.live/v1/user`,
                headers: {
                    Authorization: session_id,
                },
                data: update
            };

            let { data } = await axios(config);

            console.log(data);

            setUser(data.data); 
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <Container className="settings-container" fluid> 

            <Accordion defaultActiveKey={['0', '1', '2', '3']} flush alwaysOpen>
                <Accordion.Item eventKey="0" >
                    <Accordion.Header>Collections</Accordion.Header>
                    <Accordion.Body>
                        <div className="collections">
                            {user.collections.map((collection, i) => {
                                
                                return (
                                    <div className="collection" key={i}>
                                        
                                        <Row className="mb-3 existing">
                                            <Col xs={2}>
                                                <Form.Label>Name</Form.Label>
                                                <div className="text" size="sm" type="text" id="name" placeholder="Name" >{collection.name}</div>
                                            </Col>
                                            <Col xs={4}>
                                                <Form.Label>FCA</Form.Label>
                                                <div className="text" size="sm" type="text" id="firstCreatorAddress" placeholder="FCA" >{collection.firstCreatorAddress}</div>
                                            </Col>
                                            <Col xs={1}>
                                                <Form.Label>Symbol</Form.Label>
                                                <div className="text" size="sm" type="text" id="symbol" >{collection.symbol}</div>
                                            </Col>
                                            <Col xs={4}>
                                                <Form.Label>Update Authority</Form.Label>
                                                <div className="text" size="sm" type="text" id="updateAuthority" placeholder="Update Authority" >{collection.updateAuthority}</div>
                                            </Col>
                                            <Col>
                                                <div className="collection-actions">
                                                    <Button variant="outline-danger" id={i} onClick={(e) => {
                                                        let index = e.target.id;
                                                        let update = { ...user }; 
                                                        update.collections.splice(index, 1);
                                                        setUser(update);
                                                        updateUser(update)
                                                    }}>
                                                    DEL
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row> 

                                    </div>
                                ) 

                            })} 

                            <Row className="mb-3">
                                <Col xs={2}>
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control size="sm" type="text" id="name" placeholder="Name" value={newCollection.name} onChange={(e) => { editNewCollection(e) }} />
                                </Col>
                                <Col xs={4}>
                                    <Form.Label>FCA</Form.Label>
                                    <Form.Control size="sm" type="text" id="firstCreatorAddress" placeholder="FCA" value={newCollection.firstCreatorAddress} onChange={(e) => { editNewCollection(e) }} />
                                </Col>
                                <Col xs={1}>
                                    <Form.Label>Symbol</Form.Label>
                                    <Form.Control size="sm" type="text" id="symbol" value={newCollection.symbol} onChange={(e) => { editNewCollection(e) }} />
                                </Col>
                                <Col xs={4}>
                                    <Form.Label>Update Authority</Form.Label>
                                    <Form.Control size="sm" type="text" id="updateAuthority" placeholder="Update Authority" value={newCollection.updateAuthority} onChange={(e) => {editNewCollection(e)}} />
                                </Col> 
                                <Col>
                                    <div className="collection-actions">
                                        <Button variant="outline-success" onClick={()=>{ addCollection()}}>
                                        ADD
                                    </Button>
                                    </div>
                                </Col>
                            </Row> 

                        </div>
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="0" >
                    <Accordion.Header>Linked Wallets</Accordion.Header>
                    <Accordion.Body>
                        <WalletMultiButton /> 
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1" >
                    <Accordion.Header>Discord Server</Accordion.Header>
                    <Accordion.Body>
                        <Form>
                            <Form.Group className="mb-3" controlId="notificationWebhook">
                                <Form.Label>Notifications Webhook</Form.Label>
                                <Form.Control size="sm" type="text" placeholder="Enter webhook url" />
                                <Form.Text className="text-muted">
                                    Add in the webhook URL for the channel you want notifications to go to.
                                </Form.Text>
                            </Form.Group> 
                        </Form> 
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2" >
                    <Accordion.Header>Collections</Accordion.Header>
                    <Accordion.Body>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                        eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                        minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                        aliquip ex ea commodo consequat. Duis aute irure dolor in
                        reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                        culpa qui officia deserunt mollit anim id est laborum.
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="3" >
                    <Accordion.Header>Royalty Management</Accordion.Header>
                    <Accordion.Body>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                        eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                        minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                        aliquip ex ea commodo consequat. Duis aute irure dolor in
                        reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                        culpa qui officia deserunt mollit anim id est laborum.
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>

        </Container>
    );
};