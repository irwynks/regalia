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

    useEffect(() => {
        setMode('user');

        if (!!user) {
            let t = [];
            let o = [];
            for (let nft of user.nfts) {
                !!nft.tx ? t.push(nft) : o.push(nft);
            }
            setTracked(t);
            setOthers(o);
        }

    }, []) 

    const payRoyalty = async (nft) => {
     
        console.log(process.env.REACT_APP_ORACLE_API_KEY) 

        console.log(nft);

        let { data } = await axios({
            method: 'post',
            url: 'https://oracle.regalia.live/v1/royalties/generateTX',
            headers: {
                Authorization: process.env.REACT_APP_ORACLE_API_KEY
            },
            data: {
                pubkey: user.pubkey,
                mintAddress:nft.mintAddress
            }
        }) 

        let { transaction } = data.data; 

        let message =  Message.from(transaction.data)
        let tx = Transaction.populate(message)

        const {
            context: { slot: minContextSlot },
            value: { blockhash, lastValidBlockHeight }
        } = await connection.getLatestBlockhashAndContext();

        const signature = await wallet.sendTransaction(tx, connection, { minContextSlot }); 

        let confirmed = await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });

        console.log(signature); 
        console.log(confirmed);

        let { data: processed } = await axios({
            method: 'post',
            url: 'https://oracle.regalia.live/v1/royalties/processTX',
            headers: {
                Authorization: process.env.REACT_APP_ORACLE_API_KEY
            },
            data: {
                signature,
                mintAddress: nft.mintAddress
            }
        }) 

        console.log(processed.data); 

    }

    return (
        <Container className="user-container" fluid>

            <Container className="user-interface"> 
                
                <div className="main-title">
                    <h4>NFTs</h4>
                </div>
                <div className="tracked-nfts">
                    {tracked.map(nft => { 
                        return (
                            <div className="nft">
                               
                                {!!nft.tx.fulfilled ? 
                                    <div className="badge"><Image width="50" src="/paid.png" title="Royalty Fulfilled" /></div>
                                    : null
                                } 
                                <Image src={nft.image_url} rounded/>
                                <div className="info"> 
                                    <div className="marketplace">{nft.tx.marketplace}</div>
                                    <div className="name">{nft.name}</div>
                                    <div className="price">{nft.tx.saleAmount}◎</div>
                                    <div className="royalty-fee">FEE: {nft.tx.royaltyAmount}◎
                                        {!!nft.tx.fulfilled ?
                                            <span className="paid">Royalty Paid</span> : <span className="unpaid" onClick={() => { payRoyalty(nft) }}>Pay Royalty</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        ) 
                    })}
                </div>
                
                <div className="other-nfts">
                    <div className="title">Other NFTS</div>
                </div>
                
            </Container>

        </Container>
    );
};
