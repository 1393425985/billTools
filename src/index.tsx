import React from 'react';
import { render } from 'react-dom';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import { Router, Switch, Route } from 'react-router-dom';
import 'antd/dist/antd.css';
import './index.global.less';
import './global.ts';
import * as reducers from './reducers';
import rootSaga from './sagas';
import history from '@utils/history';
import Exception from '@panel/Exception';
import UserLayout from '@layouts/UserLayout';
import BaseLayout from '@layouts/BaseLayout';

const { ipcRenderer } = require('electron');
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
    <Router history={history}>
      <Switch>
        <Route path="/user/:url" component={UserLayout} />
        <Route path="/exception/:status" component={Exception} />
        <Route path="/" component={BaseLayout} />
      </Switch>
    </Router>
  </Provider>,
  document.getElementById('root'),
);

ipcRenderer.on('checkVersionStatus', (e, data) => {
  store.dispatch({
    type: 'version/update',
    payload: data,
  });
});
