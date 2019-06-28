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
  const defaultStore = store.getState();
  if (rs) {
    store.dispatch({
      type: 'project/update',
      payload: rs.project || defaultStore.project,
    });
    store.dispatch({
      type: 'color/update',
      payload: rs.color || defaultStore.color,
    });
    store.dispatch({
      type: 'bezier/update',
      payload: rs.bezier || defaultStore.bezier,
    });
  }else{
    writeConfig(defaultStore);
  }
});
ipcRenderer.on('checkVersionStatus',(e,data)=>{
  store.dispatch({
    type: 'version/update',
    payload: data,
  });
});
