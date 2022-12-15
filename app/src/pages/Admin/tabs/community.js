import { Component, useGlobal, useState, useEffect } from 'reactn';
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

export const Community = (props) => {

    const navigate = useNavigate();
    let [user, setUser] = useGlobal('user')
    let [selectedGuild, setSelectedGuild] = useGlobal('mode')

    let [communityData, setCommunityData] = useGlobal('communityData');

    let [activeKey, setKey] = useGlobal('activeTabKey');

    let firing = false;

    useEffect(() => {
        getCommunityData();
    }, [])

    const getCommunityData = async () => {
        try {
            console.error('Getting royalty data');
            let session_id = window.localStorage.getItem('session');
            let config = {
                method: 'get',
                url: `{process.env.REACT_APP_DOMAIN}/v1/stats/community/by-user`,
                headers: {
                    Authorization: session_id
                }
            };

            let { data } = await axios(config);

            setCommunityData(data.data); 


            firing = false;

        } catch (err) {
            console.log(err);
        }
    }

    const bsf = (str, chars) => {
        return `${str.slice(0, chars)}...${str.slice(-1 * +chars)}`
    }

    const isPaid = (pct) => {
        if (+pct === 0)
            return <Image height={21} src="/not-paid.png" />
        if (+pct === 50)
            return <Image height={21} src="/half-paid.png" />
        if (+pct >= 100)
            return <Image height={21} src="/paid.png" />
    }

    return (
        <Container className="overview-container" fluid>

                <div className="cta">COMING SOON</div>
       

        </Container>
    );
};