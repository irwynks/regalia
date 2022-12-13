import { useGlobal, useState, useEffect } from 'reactn';
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Container, Alert, Image, Card, Row, Col } from 'react-bootstrap';
import { useWallet, useConnection } from '@solana/wallet-adapter-react'; 
import {Transaction, Message, sendAndConfirmTransaction} from '@solana/web3.js';
import axios from 'axios';

import "./user.scss" 

export const User = () => {
    const navigate = useNavigate();
    const wallet = useWallet();
    const { connection } = useConnection();

    let [user, setUser] = useGlobal('user');
    let [mode, setMode] = useGlobal('mode');
    let [tracked, setTracked] = useState([])
    let [others, setOthers] = useState([])
    let [mintAddress, setMintAddress] = useState(false)

    useEffect(() => {
        
        let interval;
        if (!!mintAddress) { 
            interval = setInterval(() => {
                getPaymentStatus();
            }, 1000);
        } else {
            clearInterval(interval);
        }

        return () => clearInterval(interval);

    }, [mintAddress]);

    useEffect(() => {
        setMode('user');

        if (!!user) {
            let t = [];
            let o = [];
            for (let nft of user.nfts) {
                !!nft.tracked ? t.push(nft) : o.push(nft);
            }
            setTracked(t.sort((a, b) => a.firstCreatorAddress > b.firstCreatorAddress ? -1 : 1));
            setOthers(o.sort((a, b) => a.firstCreatorAddress > b.firstCreatorAddress ? -1 : 1));
        }

        let interval = setInterval(() => {
                refresh();
            }, 2000);

        return () => clearInterval(interval); 
    }, []) 

    const payRoyalty = async (nft) => { 

        try {
            let { data } = await axios({
                method: 'post',
                url: 'https://oracle.regalia.live/v1/royalties/tx/generate',
                headers: {
                    Authorization: user.apikey
                },
                data: {
                    pubkey: user.pubkey,
                    mintAddress: nft.mintAddress
                }
            })

            let { transaction } = data.data;

            let message = Message.from(transaction.data)
            let tx = Transaction.populate(message)

            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight }
            } = await connection.getLatestBlockhashAndContext();

            const signature = await wallet.sendTransaction(tx, connection, { minContextSlot });

            let confirmed = await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }); 

            let { data: processed } = await axios({
                method: 'post',
                url: 'https://oracle.regalia.live/v1/royalties/tx/process',
                headers: {
                    Authorization: user.apikey
                },
                data: {
                    signature,
                    mintAddress: nft.mintAddress
                }
            })

        } catch (err) {
            console.log(err)
        } finally {
            setMintAddress(nft.mintAddress);
        }

    }

    const getPaymentStatus = async () => {
        let config = {
            method: 'get',
            url: `https://oracle.regalia.live/v1/royalties/nft/status?mintAddress=${mintAddress}`,
            headers: {
                Authorization: user.apikey,
            }
        };

        let { data } = await axios(config); 

        console.log('Getting payment status');

        if (!!data.success && !!data.data.tx.fulfilled) {
            refresh()
            setMintAddress(false);
        }
    }

    const refresh = async () => {

        try {
            let session_id = window.localStorage.getItem('session');

            let config = {
                method: 'get',
                url: `https://api.regalia.live/v1/user`,
                headers: {
                    Authorization: session_id,
                }
            };

            let { data } = await axios(config); 

            if (!!data.success && !!data.data) { 
                setUser({ ...data.data })
            }
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <Container className="user-container" fluid>

            <Container className="user-interface"> 
                
                <div className="tracked-nfts">
                    <div className="title">
                        Tracked NFTs
                    </div>
                    <div className="nfts">
                        {tracked.map(nft => { 
                        
                            console.log(nft);
                            
                        return (
                            <div className="nft">
                               
                                {!!nft.tx?.fulfilled ? 
                                    <div className="badge"><Image width="50" src="/paid.png" title="Royalty Fulfilled" /></div>
                                    : null
                                } 
                                <Image src={nft.image_url} onError="this.onerror=null;this.src='/placeholder.png';" rounded/>
                                <div className="info"> 
                                    <div className="marketplace">{nft.tx.marketplace}</div>
                                    <a className="name" href={`https://solscan.io/token/${nft.mintAddress}`} target="_blank" rel="noreferrer">{nft.name}</a>
                                    <div className="price">{nft.tx.saleAmount}◎</div>
                                    <div className="royalty-fee">FEE: {(nft.tx?.royaltyAmount||0).toFixed(3)}◎
                                        {!!nft.tx.fulfilled ?
                                            <span className="paid">Royalty Paid</span> : <span className="unpaid" onClick={() => { payRoyalty(nft) }}>Pay Royalty</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        ) 
                    })}
                    </div>
                </div>
                
                <div className="other-nfts">
                    <div className="title">UnTracked NFTs</div>
                    <div className="nfts">
                        {others.map(nft => {
                            return (
                                <div className="nft"> 
                                    <Image src={nft.image_url} rounded />
                                    <div className="info"> 
                                        <div className="name">{nft.name}</div> 
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="bottom-spacer"></div>
            </Container>

        </Container>
    );
};
