import React from 'react';
import { render } from 'react-dom';
// import { Router, Route, Switch } from "react-router";
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import 'antd/dist/antd.css';
import './index.global.less';
import './global.ts';
import * as reducers from './reducers';
import rootSaga from './sagas';
import MenuPanel from '@panel/MenuPanel';
import { getConfig,writeConfig } from '@utils/utils';

const {ipcRenderer} = require('electron');
const sagaMiddleware = createSagaMiddleware();
export const store = createStore(
  combineReducers({
    ...reducers,
  }),
  applyMiddleware(sagaMiddleware),
);
sagaMiddleware.run(rootSaga);
render(
  <Provider store={store}>
    <MenuPanel />
  </Provider>,
  document.getElementById('root'),
);
getConfig().then(rs => {
  if (rs) {
    store.dispatch({
      type: 'project/update',
      payload: rs.project,
    });
  }else{
    writeConfig(store.getState());
  }
});
ipcRenderer.on('checkVersionStatus',(e,data)=>{
  store.dispatch({
    type: 'version/update',
    payload: data,
  });
});
