import { useGlobal, useState, useEffect } from 'reactn';
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Container, Tabs, Tab, Image, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import './overview.scss';
import moment from 'moment'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

import DateRangePicker from 'react-bootstrap-daterangepicker';
import 'bootstrap-daterangepicker/daterangepicker.css';

const _ = require("lodash")

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title); 

let template = { 
    datasets: [
        {
            label: '',
            data: [],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
        },
    ],
};

const barOptions = { 
        indexAxis: 'y',
        elements: {
            bar: {
                borderWidth: 1,
            },
        },
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: false, 
            },
        }, 
}

export const Overview = (props) => { 

    const navigate = useNavigate();
    let [user, setUser] = useGlobal('user') 
    let [selectedGuild, setSelectedGuild] = useGlobal('mode') 

    let [royaltyData, setRoyaltyData] = useGlobal('royaltyData');

    let [activeKey, setKey] = useGlobal('activeTabKey');

    let firing = false;

    useEffect(() => {
        getRoyaltyData(); 
    }, [])

    const getRoyaltyData = async () => {
        try {
            console.error('Getting royalty data');
            let session_id = window.localStorage.getItem('session');
            let config = {
                method: 'get',
                url: `https://api.regalia.live/v1/stats/royalties/by-collection`,
                headers: {
                    Authorization: session_id
                }
            };

            let { data } = await axios(config);

            setRoyaltyData(data.data);

            console.log({
                ...template,
                labels: Object.keys(royaltyData.metrics.marketplaceBreakdown).map(i => _.startCase(i)),
                datasets: [{
                    ...template.datasets[0],
                    label: 'NFTs Sold',
                    data: Object.values(royaltyData.metrics.marketplaceBreakdown).map(i => i.count)
                }]
            })
            
            firing = false;

        } catch (err) {
            console.log(err);
        }
    }

    const bsf = (str, chars) => {
        return `${str.slice(0,chars)}...${str.slice(-1*+chars)}`
    }

    const isPaid = (pct) => { 
        if(+pct === 0)
            return <Image height={21} src="/not-paid.png"/> 
        if(+pct===50)
            return <Image height={21} src="/half-paid.png" /> 
        if (+pct >= 100)
            return <Image height={21} src="/paid.png" /> 
    }

    return (
        <Container className="overview-container" fluid> 

            {!!user.collections.length ? 

                !!royaltyData.count ?
                    <div className="stats">
                        <div className="date-range-selection">
                            <div className="title">Date range</div>
                            <DateRangePicker
                                initialSettings={{
                                    startDate: moment().subtract(7, 'd').format('MM/DD/YYYY'),
                                    endDate: moment().format('MM/DD/YYYY'),
                                    opens: "center",
                                    drops: "auto"
                                }}>
                                <input type="text" className="form-control" />
                            </DateRangePicker>
                        </div>
                        <div className="metrics-container">
                            <div className="metrics">
                                <div className="sales">
                                    <div className="title">NFTs Sold</div>
                                    <div className="text">{royaltyData.count}</div>
                                </div> 
                                <div className="earnings">
                                    <div className="title">Earnings</div>
                                    <div className="text">{(royaltyData.metrics.earnings).toFixed(2)}/{(royaltyData.metrics.potentialEarnings).toFixed(2)}</div> 
                                </div>
                                <div className="fulfillment-rate">
                                    <div className="title">Fulfillment Rate</div>
                                    <div className="text">{(royaltyData.metrics.fulfillmentRate*100).toFixed(3)}%</div>
                                </div>
                            </div>
                                <div className="marketplace-breakdown">
                                    <div className="sales">
                                    <Doughnut data={{
                                        ...template,
                                        labels: Object.keys(royaltyData.metrics.marketplaceBreakdown).map(i => _.startCase(i)),
                                        datasets: [{
                                                ...template.datasets[0],
                                                label: 'NFTs Sold',
                                                data: Object.values(royaltyData.metrics.marketplaceBreakdown).map(i => i.count)
                                            }]
                                    }} />
                                    </div>
                                <div className="earnings">
                                    <Doughnut data={{
                                        ...template,
                                        labels: Object.keys(royaltyData.metrics.marketplaceBreakdown).map(i => _.startCase(i)),
                                        datasets: [{
                                            ...template.datasets[0],
                                            label: 'Earnings',
                                            data: Object.values(royaltyData.metrics.marketplaceBreakdown).map(i => i.earnings)
                                        }]
                                    }} />
                                    </div>
                                {/*<div className="fulfillment-rate">
                                    <Bar options={barOptions} data={{
                                        labels: [""],
                                        datasets: Object.entries(royaltyData.metrics.marketplaceBreakdown).map(([label, obj], i) => {
                                            return {
                                                label: _.startCase(label),
                                                data: [obj.fulfillmentRate * 100],
                                                borderColor: template.datasets[0].borderColor[i],
                                                backgroundColor: template.datasets[0].backgroundColor[i],
                                            }
                                        })
                                    }} />
                                    </div> */}
                                </div>
                        </div>
                    <div className="sales-container"> 
                        <Row className="sale-headers">
                            <Col xs={2} className="tx d-flex justify-content-center">Transaction Date</Col>
                            <Col xs={2} className="tx d-flex justify-content-center">Mint Address</Col>
                            <Col xs={2} className="seller">Seller</Col>
                            <Col xs={2} className="buyer">Buyer</Col> 
                            <Col xs={1} className="sale-amount">Sale Price</Col>
                            <Col xs={1} className="royalty">Fee</Col> 
                            <Col xs={1} className="royalty-paid d-flex text-center">Paid</Col>
                            <Col xs={1} className="fulfilled d-flex text-center">Fulfilled</Col>
                        </Row>
                        {royaltyData.sales.map((sale) => {
                            return (
                                <Row className="sale">
                                    <Col xs={2} className="tx">{moment.unix(sale.blocktime).format('ddd Do MMM hh:mm A')}</Col>
                                    <Col xs={2} className="tx">{bsf(sale.mintAddress, 8)}</Col>
                                    <Col xs={2} className="seller">{bsf(sale.seller, 4)}</Col>
                                    <Col xs={2} className="buyer">{bsf(sale.buyer, 4)}</Col> 
                                    <Col xs={1} className="sale-amount">{sale.saleAmount.toFixed(3)}</Col>
                                    <Col xs={1} className="royalty">{sale.royaltyAmount.toFixed(3)}</Col> 
                                    <Col xs={1} className="royalty-paid">{sale.royaltyPaid > 0 ? sale.royaltyPaid.toFixed(3) : 0}</Col> 
                                    <Col xs={1} className="fulfilled">{isPaid(sale.royaltyPaidPercent)}</Col>
                                </Row>
                            )
                        })} 
                        </div>
                        <div className="bottom-spacer"></div>
                    </div>
                    :null
                :
                <div className="cta"><span onClick={() => { console.log('settings'); setKey('settings')}}>ADD A COLLECTION</span> TO GET STARTED</div>
            }

        </Container>
    );
};