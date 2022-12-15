import React, {setGlobal} from 'reactn';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';

import './index.scss';
import App from './App';

setGlobal({

  user: null,
  collections:[],
  guilds: null,
  settings: null,
  session: null,
  royaltyData: {},
  activeTabKey:'overview',
  mode: 'user',
  nfts:[]

})

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);