import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import web3Util from './util/web3Util'
import { _initConfigs } from './util/config'

web3Util.getWeb3
  .then(_web3 => {
      _initConfigs(_web3)
        .then(() => ReactDOM.render(<App/>, document.getElementById('root'))
        )
    }
  )

