import { useGlobal, useState, useEffect, useMemo } from 'reactn';
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Container, Tabs, Tab, Accordion, Form, Button, Image, Row, Col, Modal } from 'react-bootstrap';
import { useWallet } from '@solana/wallet-adapter-react'; 
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import './settings.scss';

import axios from 'axios';

const { decodeUTF8 } = require("tweetnacl-util");
const bs58 = require('bs58')

const bsf = (str, chars) => {
    return `${str.slice(0, chars)}...${str.slice(-1 * +chars)}`
}

export const Settings = (props) => {

    const wallet = useWallet();
    const navigate = useNavigate();
    let [user, setUser] = useGlobal('user');
    let [selectedGuild, setSelectedGuild] = useGlobal('mode');

    let [pubkey, setPubkey] = useState(wallet.publicKey);

    const [showSettings, setShowSettings] = useState(false); 
    const handleCloseSettings = () => {
        setShowSettings(false)
        setLinking(false);
        setCheckingLinkage(false);
        setLinked(false);
    };
    const handleShowSettings = () => setShowSettings(true);

    const [linking, setLinking] = useState(false);
    const [linked, setLinked] = useState(false);
    const [checkingLinkage, setCheckingLinkage] = useState(false);

    useEffect(() => { 

        if (linking.status === 'pending_transaction') {
            setLinked(false);
            setCheckingLinkage(true);
        }

        if (linking.status === 'confirmed') { 
            refresh();
            setLinked(true);
            setCheckingLinkage(false);
        }

    }, [linking])

    useEffect(() => { 
        let interval;
        if (!!checkingLinkage) {
            interval = setInterval(() => {
                getLinkageStatus();
            }, 1000);
        } else {
            clearInterval(interval);
        }

        return () => clearInterval(interval);

    }, [checkingLinkage]) 

    let [newCollection, setNewCollection] = useState({
        name: "",
        firstCreatorAddress: "",
        symbol: "",
        updateAuthority: "",
    });

    const getLinkageStatus = async () => {
        let config = {
            method: 'get',
            url: `https://oracle.regalia.live/v1/creator/onboard/status/${pubkey}`,
            headers: {
                Authorization: user.apikey,
            }
        };

        let { data } = await axios(config); 

        if (!!data.success && !!data.data.status) { 
                setLinking(data.data); 
        } 
    }

    const initiateLinking = async (mintAddress) => { 
        let config = {
            method: 'post',
            url: `https://oracle.regalia.live/v1/creator/onboard`,
            headers: {
                Authorization: user.apikey,
            },
            data: { pubkey, mintAddress }
        };

        let { data } = await axios(config); 

        if(!!data.success)
            setLinking(data.data);

    }

    const editCollection = (e, firstCreatorAddress) => { 
        let key = e.target.id;
        let val = e.target.value; 
        if (key === 'vault') { key = 'vaults'; val = [val]; } 
        let collections = [...user.collections]; 
        let index = collections.findIndex(i => i.firstCreatorAddress === firstCreatorAddress);
        collections[index][key] = val; 
        let update = { ...user, collections } 
        setUser(update)
    }

    const refresh = async () => {

        try {
            let session_id = window.localStorage.getItem('session');

            let config = {
                method: 'get',
                url: `{process.env.REACT_APP_DOMAIN}/v1/user`,
                headers: {
                    Authorization: session_id,
                }
            };

            let { data } = await axios(config); 

            if (!!data.success && !!data.data) {
                let update = { ...data.data }
                setUser(update)
            }
        } catch (err) {
            console.log(err);
        }
    }

    const updateCollections = async () => {
        
        try {
            let session_id = window.localStorage.getItem('session'); 

            let config = {
                method: 'put',
                url: `{process.env.REACT_APP_DOMAIN}/v1/user`,
                headers: {
                    Authorization: session_id,
                },
                data: { collections: user.collections }
            };

            let { data } = await axios(config); 

            setUser({...user, collections:data.data.collections}); 

        } catch (err) {
            console.log(err);
        }

    }

    return (
        <Container className="settings-container" fluid> 

            <Accordion defaultActiveKey={['0', '1', '2', '3']} flush alwaysOpen>
                <Accordion.Item eventKey="0" >
                    <Accordion.Header>Linked Collections</Accordion.Header>
                    <Accordion.Body>
                        <div className="collections">
                            {(user.collections || []).map((collection, i) => { 
                                return (
                                    <div className="collection" key={i}> 
                                        <div>
                                            <div className="title">SYMBOL</div>
                                            <div className="text">{collection.symbol}</div>
                                            <div className="spacer"></div>
                                        </div>
                                        <div>
                                            <div className="title">FIRST CREATOR ADDRESS</div>
                                            <div className="text">{bsf(collection.firstCreatorAddress, 8)}</div>
                                            <div className="spacer"></div>
                                        </div>
                                        <div>
                                            <div className="title">UPDATE AUTHORITY</div>
                                            <div className="text">{bsf(collection.updateAuthority, 8)}</div>
                                            <div className="spacer"></div>
                                        </div>
                                        <div>
                                            <div className="title">NAME</div>
                                            <Form.Control size="sm" style={{ width: "140" }} type="text" id="name" placeholder="Name" value={collection.name} onChange={(e) => { editCollection(e, collection.firstCreatorAddress) }} /> 
                                            <div className="spacer"></div>
                                        </div>
                                        <div>
                                            <div className="title">VAULT</div>
                                            <Form.Control size="sm" style={{ width: "255px" }} type="text" id="vault" placeholder="Vault" value={collection.vaults[0]} onChange={(e) => { editCollection(e, collection.firstCreatorAddress) }} />
                                            <Form.Text className="text-muted">
                                                Wallet for royalty payments
                                            </Form.Text>
                                        </div>
                                        <div>
                                            <div className="title">WEBHOOK URL</div>
                                            <Form.Control size="sm" style={{ width: "255px" }} type="text" id="webhook_url" placeholder="URL" value={collection.webhook_url} onChange={(e) => { editCollection(e, collection.firstCreatorAddress) }} />
                                            <Form.Text className="text-muted">
                                               Event postbacks
                                            </Form.Text>
                                        </div>
                                        <div className="actions">
                                            <div></div>
                                            <Button variant="outline-primary" size="sm" onClick={()=>{updateCollections()}}>UPDATE</Button>
                                        </div>
                                    </div>
                                ) 
                            })}

                            <Button variant="warning" style={{ margin: '0 auto', display: 'block' }} onClick={handleShowSettings}>Link Collection</Button>


                        </div>
                    </Accordion.Body>
                </Accordion.Item> 
                <Accordion.Item eventKey="1" >
                    <Accordion.Header>Discord Integration</Accordion.Header>
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
                    <Accordion.Header>Oracle API</Accordion.Header>
                    <Accordion.Body> 
                        <div className="api">
                            <div>
                                <div className="title">POSTMAN API DOCS</div>
                                <a className="text" href="https://documenter.getpostman.com/view/19486091/2s8YzUwMBb" target="__blank">https://documenter.getpostman.com/view/19486091/2s8YzUwMBb</a>
                                <div className="spacer"></div>
                            </div>
                            <div>
                            <div className="title">API KEY</div>
                            <div className="text">{user.apikey}</div>
                                <div className="spacer"></div>
                            </div>
                        </div>
                    </Accordion.Body>
                </Accordion.Item> 
            </Accordion> 

            <Modal className="modal link-collection" size='lg' centered show={showSettings} onHide={handleCloseSettings}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        LINK COLLECTION
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="explanation">
                    </div>
                    <div className="input">
                        <Row className="justify-content-center">

                            {!!linked ?
                                <div>
                                    <div className='text'>
                                        COLLECTION HAS BEEN LINKED TO YOUR ACCOUNT
                                    </div>
                                    <div className="identified">
                                        <div>
                                            <Form.Text className="">SYMBOL</Form.Text>
                                            <Form.Label>{linking.symbol}</Form.Label>
                                        </div>
                                        <div>
                                            <Form.Text className="">FIRST CREATOR ADDRESS</Form.Text>
                                            <Form.Label>{bsf(linking.firstCreatorAddress, 8)}</Form.Label>
                                        </div>
                                        <div>
                                            <Form.Text className="">UPDATE AUTHORITY</Form.Text>
                                            <Form.Label>{bsf(linking.updateAuthority, 8)}</Form.Label>
                                        </div>
                                    </div> 
                                </div> 
                                : !!linking ? 
                                <div className="linking">
                                    <div className="identified"> 
                                        <div>
                                            <Form.Text className="">SYMBOL</Form.Text>
                                            <Form.Label>{linking.symbol}</Form.Label>
                                        </div>
                                        <div>
                                            <Form.Text className="">FIRST CREATOR ADDRESS</Form.Text>
                                            <Form.Label>{bsf(linking.firstCreatorAddress, 8)}</Form.Label>
                                        </div>
                                        <div>
                                            <Form.Text className="">UPDATE AUTHORITY</Form.Text>
                                            <Form.Label>{bsf(linking.updateAuthority, 8)}</Form.Label>
                                        </div>
                                    </div>
                                    <div className="payers">
                                        <div className="text">AWAITING TRANSFER OF<br /><span>{linking.amount}SOL</span>
                                            <br />TO<br />
                                            <span>oRACLFPN2PUwHD8QVF1wyiVygUSkijSypNeKmsLZQ9R
                                                <img onClick={() => { navigator.clipboard.writeText('oRACLFPN2PUwHD8QVF1wyiVygUSkijSypNeKmsLZQ9R') }} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAAdklEQVRYhe2VSwrAIAxE09J9L9TjeyFPoNtSgphPnRbmLRXicwxRhBAwm7ZYi7Ro4fPSaz/ZowdFOUabs7e4Y03v2wl4sKY2LfBWY/7vCbIbE54ABShAgaFALdIyJqBbYAXqJPRMOy/wBOAC5s8ouynhCRACpwPfGhTsZuiA3wAAAABJRU5ErkJggg==" alt="copy"/>
                                            </span>
                                            <br />FROM</div>
                                        <div className="wallets">
                                            {linking.payer_wallets.map(wallet => {
                                                return <div>{bsf(wallet, 5)}</div>
                                            })}
                                        </div>
                                    </div>
                                </div> : 
                            <Col xs={8}>
                                <Form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target); 
                                    let data = Object.fromEntries(formData.entries());
                                    initiateLinking(data.mintAddress)
                                }}>
                                    <Form.Group className="mb-3" controlId="notificationWebhook">
                                        <Form.Label>NFT Mint Address</Form.Label>
                                        <Form.Control size="sm" type="text" name="mintAddress"/>
                                        <Form.Text className="text-muted">
                                            Provide the mint address of a NFT in the collection you wish to add.
                                        </Form.Text>
                                    </Form.Group> 
                                    <Button variant="outline-warning" type="submit">Link</Button>
                                </Form> 
                                </Col> 
                            }
                            </Row>
                    </div> 
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseSettings}>Close</Button>
                    <Button variant="warning" onClick={handleCloseSettings}>Done</Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
};