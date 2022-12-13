import { useGlobal, useState, useEffect } from 'reactn';
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Container, Tabs, Tab, Image, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import './overview.scss';
import moment from 'moment'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

import DateRangePicker from 'react-bootstrap-daterangepicker';
import 'bootstrap-daterangepicker/daterangepicker.css';

const classnames = require("classnames");
const _ = require("lodash") 

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

    let [start, setStart] = useState()
    let [end, setEnd] = useState()

    let [royaltyData, setRoyaltyData] = useGlobal('royaltyData');

    let [activeKey, setKey] = useGlobal('activeTabKey');
    const [ rotate, toggle ] = useState(false);

    useEffect(() => {
        ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title); 
        getRoyaltyData(); 
    }, [])

    useEffect(() => {
        ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title); 
        if(activeKey==='overview')
            getRoyaltyData();
    }, [activeKey])

    const getRoyaltyData = async (start, end) => {
        try {

            toggle(true);

            console.error('Getting royalty data');
            let url = `https://api.regalia.live/v1/stats/royalties/by-collection`;
            if (!!start && !!end)
                url = `https://api.regalia.live/v1/stats/royalties/by-collection?start=${start.toISOString()}&end=${end.toISOString()}`;
            
            let session_id = window.localStorage.getItem('session');
            let config = {
                method: 'get',
                url,
                headers: {
                    Authorization: session_id
                }
            };

            let { data } = await axios(config); 

            setRoyaltyData(data.data);

            toggle(false); 

        } catch (err) {
            console.log(err);
        }
    }

    const bsf = (str, chars) => {
        return `${str.slice(0,chars)}...${str.slice(-1*+chars)}`
    }

    const isPaid = (sale) => { 
        let pct = sale.effectiveRoyaltyPaidPercent

        if(+pct === 0)
            return <Image height={21} src="/not-paid.png"/> 
        if(+pct===50)
            return <Image height={21} src="/half-paid.png" /> 
        if (+pct >= 100)
            return !!sale.linkedPayments.length ? <span><Image height={21} src="/paid.png" /><Image height={21} src="/paid.png" /></span> : <Image height={21} src="/paid.png" />
    }

    return (
        <Container className="overview-container" fluid> 

            {!!user.collections.length ? 

                !!royaltyData ?
                    <div className="stats">
                        <div className="date-range-selection">
                            <div className="refresh" onClick={()=>{getRoyaltyData(start, end)}}>
                                <img className={classnames({rotation:rotate})} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAEM0lEQVRoge2ZwU8cVRzHP7+ZZRViKbCsidXUNMS0XNQ01VCpaCuwQSGaaDhw92Q5aBpPNq4XExMvVVv/gvaA0sS22WZZrRYqbWLlQNo0PShWkmJlB2hJTFiW+Xko6Ox0Z3Z2dkk57Oc2v/n93vt+38x7b94u1KhRo8bDRKrV0J0UbaZJQpQDCnsQdgKNwCpgAX8jTKNcNG0uNvfxRzX6rciAjmBmmxgU5TDwUjmlwA8IJ2JLnJFB1sJqMMIWWmP0Wtu5LsopyhMP9weuG+V0dju/WufZ75c8nybp11BZzE5S37DMMYV3y631wUY4EWvhA9nHqvPGfJqkwMetieJayzIwlyJeZ5IC9nmkTInyna2Mi8FfeZhd3YbdsETMjtAmyn6FfoFOj/oLkVXeaepn0SkeoGID6+LHgT2uWwqMqs1H8T5uBmlr/jy7xeAoMOTWoDBtGnSt2by/Ib5iA7OT1NcvM45r5BVmDIOhWA9XgrTjxsrQYducEthV0K4yI1IY8zIQaBI3LHMMl3iB8UeivBhWPECshyuRKHuBCwVtu8T7UdKANUave8IKjLfcpafxINnAaj1oPshSLscALhNB8TWgI5iqfFEQg5m6KG/LILkwHRZjxwD/oFwNU+trINvEILDbEVLDYKgaI+9kPk0S4cMwtb4GRBl2hb6t5J0vhnOpDIOngTsp2oAOR0jV5mjYjopRqXjwMWCaJChcZqeCrvNBqIZ4gIjXDVEOqBRcn6m0MyfxBEnw/sYJiucTUNeOayvjlXa2GXhP4vvf8/9Tx+3NFhMGv1Vom/NCza1poGonsmpipWhUk7uO0EprgkeL5YY+0GwmtvCEK3TPK3dLGhCDJ12hP71yt6QBhS5X6IZXruc+kE2jQTsUSMYSfBI0PwBvOS8UJrwSK34C1RafzdAu8JwjpJE8aa/8igxswsiDzaeuPiaa3+CWV3poA5shfmGMTlyvD8JXfjWec2AD5cHNwhA+a+mtrvi5FHEbTrrC11omGfWrK/kEiu10tvLC7bM0lCPQDx0hGjUZRXnaGVabYUli+9WGfYUORaOcXfyRppD1/zGXIr6wne8VXi64IRyP9/FTqfrABgR+d4UO5XNMlfpZ0I+FMTrrIvzygHi4vJjnSJA2AhkQSIrBXoVpV3yXGvycTXMym6E9oG6yGdqzaU7byiXXawNwPWoy8MzrrATU5tHJ+kbmXG2WztGcj/ANwmseZZcRzukak4bBbys5rMhjGEaOp4AdCl0GvKnwvFd91GSgsRsriPiSBootlXqVOsvic+Aw1fsUUYTji3mOBB35DTwNzKdJrh/7imJl6MDma5/RDMo1tRkOMmGLUfEfHFYj/QjvAd1ltKcClxC+bJlktNRS6UfVDjQLGXbaa7yK8ArwLPA40ApEVLknwi3ghsJExGasWn8x1ahRo8bD5V8eIEwPnaECWAAAAABJRU5ErkJggg==" alt="refresh"/> 
                            </div>
                            <div className="title">Date range</div>
                            <DateRangePicker
                                onApply={(obj, {startDate, endDate}) => {
                                    setStart(startDate);
                                    setEnd(endDate);
                                    getRoyaltyData(startDate, endDate)
                                }}
                                initialSettings={{
                                    startDate: moment().subtract(7, 'd').format('MM/DD/YYYY'),
                                    endDate: moment().format('MM/DD/YYYY'),
                                    ranges: {
                                      Today: [moment().toDate(), moment().toDate()],
                                      Yesterday: [
                                        moment().subtract(1, 'days').toDate(),
                                        moment().subtract(1, 'days').toDate(),
                                      ],
                                      'Last 7 Days': [
                                        moment().subtract(6, 'days').toDate(),
                                        moment().toDate(),
                                      ],
                                      'Last 30 Days': [
                                        moment().subtract(29, 'days').toDate(),
                                        moment().toDate(),
                                      ],
                                      'This Month': [
                                        moment().startOf('month').toDate(),
                                        moment().endOf('month').toDate(),
                                      ],
                                      'Last Month': [
                                        moment().subtract(1, 'month').startOf('month').toDate(),
                                        moment().subtract(1, 'month').endOf('month').toDate(),
                                      ],
                                    },
                                    opens: "center",
                                    drops: "auto",
                                    
                                }}>
                                <input type="text" className="form-control" />
                            </DateRangePicker>
                        </div>
                        <div className="metrics-container">
                            <div className="metrics">
                                <Card className="sales">
                                    <div className="title">NFTs Sold</div>
                                    <div className="text">{royaltyData.count}</div>
                                    <div className="subtext"> </div> 
                                </Card> 
                                <Card className="earnings">
                                    <div className="title">Earnings</div>
                                    <div className="text">{(royaltyData.metrics?.earnings || 0).toFixed(2)}/{(royaltyData.metrics?.potentialEarnings || 1).toFixed(2)}</div> 
                                    <div className="subtext">{(royaltyData.metrics?.regaliaEarnings || 0).toFixed(2)} earned through Regalia</div> 
                                </Card>
                                <Card className="fulfillment-rate">
                                    <div className="title">Fulfillment Rate</div>
                                    <div className="text">{((royaltyData.metrics?.fulfillmentRate || 0) * 100).toFixed(3)}%</div>
                                    <div className="subtext"> </div> 
                                </Card>
                            </div>
                                <div className="marketplace-breakdown">
                                    <div className="sales">
                                    <Doughnut data={{
                                        ...template,
                                        labels: Object.keys(royaltyData.metrics?.marketplaceBreakdown||[]).map(i => _.startCase(i)),
                                        datasets: [{
                                                ...template.datasets[0],
                                                label: 'NFTs Sold',
                                                data: Object.values(royaltyData.metrics?.marketplaceBreakdown||[]).map(i => i.count)
                                            }]
                                    }} />
                                    </div>
                                <div className="earnings">
                                    <Doughnut data={{
                                        ...template,
                                        labels: Object.keys(royaltyData.metrics?.marketplaceBreakdown||[]).map(i => _.startCase(i)),
                                        datasets: [{
                                            ...template.datasets[0],
                                            label: 'Earnings',
                                            data: Object.values(royaltyData.metrics?.marketplaceBreakdown||[]).map(i => i.earnings)
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
                            <Col xs={2} className="tx d-flex">Mint Address</Col>
                                <Col xs={1} className="seller">Seller</Col> 
                                <Col xs={1} className="buyer">Buyer</Col> 
                                <Col xs={1} className="marketplace">Marketplace</Col>
                            <Col xs={1} className="sale-amount">Sale Price</Col>
                            <Col xs={1} className="royalty">Fee</Col> 
                                <Col xs={1} className="royalty-paid d-flex text-center">Paid</Col>
                                <Col xs={1} className="royalty-paid d-flex text-center">Regalia</Col>
                            <Col xs={1} className="fulfilled d-flex text-center">Fulfilled</Col>
                        </Row>
                        {(royaltyData?.sales||[]).map((sale) => {
                            return (
                                <Row className="sale">
                                    <Col xs={2} className="date">{moment.unix(sale.blocktime).format('ddd Do MMM hh:mm A')}</Col>
                                    <Col xs={2} className="tx justify-content-center" as='a' href={`https://solscan.io/token/${sale.mintAddress}`} target="_blank">{bsf(sale.mintAddress, 8)}</Col> 
                                    <Col xs={1} className="seller" as='a' href={`https://solscan.io/account/${sale.seller}`} target="_blank">{bsf(sale.seller, 4)}</Col>
                                    <Col xs={1} className="buyer" as='a' href={`https://solscan.io/account/${sale.buyer}`} target="_blank">{bsf(sale.buyer, 4)}</Col> 
                                    <Col xs={1} className="marketplace">{sale.marketplace.toUpperCase()}</Col>
                                    <Col xs={1} className="sale-amount" as='a' href={`https://solscan.io/tx/${sale.hash}`} target="_blank">{sale.saleAmount.toFixed(3)}</Col>
                                    <Col xs={1} className="royalty">{sale.royaltyAmount.toFixed(3)}</Col>
                                    <Col xs={1} className="royalty-paid">{sale.royaltyPaid > 0 ? sale.royaltyPaid.toFixed(3) : 0}</Col> 
                                    <Col xs={1} className="royalty-paid-r" as={sale.effectiveRoyaltyPaid - sale.royaltyPaid > 0 ? 'a' : 'div'} href={`https://solscan.io/tx/${sale.effectiveRoyaltyPaid - sale.royaltyPaid > 0 ? sale.linkedPayments[0].hash : null}`} target="_blank">{sale.effectiveRoyaltyPaid - sale.royaltyPaid > 0 ? (sale.effectiveRoyaltyPaid - sale.royaltyPaid).toFixed(3) : 0}</Col> 
                                    <Col xs={1} className="fulfilled">{isPaid(sale)}</Col>
                                </Row>
                            )
                        })} 
                        </div>
                        <div className="bottom-spacer"></div>
                    </div>
                    :null
                :
                <div className="cta"><span onClick={() => { setKey('settings')}}>LINK A COLLECTION</span> TO GET STARTED</div>
            }

        </Container>
    );
};