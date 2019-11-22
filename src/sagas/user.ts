import {
  call,
  fork,
  cancel,
  cancelled,
  put,
  takeEvery,
  takeLatest,
  take,
  all,
  select,
  race,
} from 'redux-saga/effects';
import { Action } from 'redux';
import history from '@utils/history';
import * as userAPI from '../services/user';
import { getConfig, writeConfig } from '@utils/utils';

const NAMESPACE = 'user';
const NAME = name => `saga/${NAMESPACE}/${name}`;

function* login(
  action: Action<{}> & {
    payload: IUser.LoginParam & { remember: boolean; isRedirect?: boolean };
  },
) {
  const payload = action.payload;
  const { isRedirect = true } = payload;
  try {
    yield put({ type: 'loading/open', name: NAME('login') });
    const rs: IUser.LoginRs = yield call(userAPI.login, payload);
    if (rs.success) {
      yield put({ type: 'user/changeInfo', payload: rs.data });
      yield put({
        type: 'user/changeLoginInfo',
        payload: { status: true, msg: '' },
      });
      if (payload.remember) {
        localStorage.setItem('loginInfo', JSON.stringify(payload));
      } else {
        localStorage.removeItem('loginInfo');
      }
      localStorage.setItem(
        'token',
        JSON.stringify({
          token: rs.data.token,
          timer: rs.data.info.exp,
        }),
      );
      const configRs: ICache.getConfigRs = yield call(userAPI.getConfigCatch);
      if (configRs.data && configRs.data.data) {
        yield writeConfig(configRs.data.data);
        yield put({
          type: 'project/update',
          payload: configRs.data.data.project,
        });
        yield put({ type: 'color/update', payload: configRs.data.data.color });
        yield put({
          type: 'bezier/update',
          payload: configRs.data.data.bezier,
        });
      }
      if (isRedirect) {
        history.push('/');
      } else {
      }
    } else {
      yield put({
        type: 'user/changeLoginInfo',
        payload: { status: false, msg: rs.msg },
      });
      localStorage.removeItem('token');
      history.push('/user/login');
    }
  } catch (error) {
    yield put({
      type: 'user/changeLoginStatus',
      payload: { status: false, msg: 'error' },
    });
  } finally {
    yield put({ type: 'loading/close', name: NAME('login') });
    if (yield cancelled()) {
      console.log('login cancel');
    }
  }
}
function* logout(payload) {
  yield put({ type: 'saga/user/updateConfig' });
  yield fork(userAPI.logout, payload);
  yield put({ type: 'user/changeInfo', payload: {} });
  yield put({ type: 'user/changeLoginStatus', payload: {} });
}
function* loginLast() {
  const tokenInfo = localStorage.getItem('token');
  if (tokenInfo) {
    const info: IUser.TokenInfo = JSON.parse(tokenInfo);
    if (info.timer * 1000 < +new Date()) {
      localStorage.removeItem('token');
      history.push('/user/login');
    } else {
      yield put({
        type: 'saga/user/login',
        payload: {
          token: info.token,
          isRedirect: false,
        },
      });
    }
  } else {
    history.push('/user/login');
  }
}
function* changeCollapsed(
  action: Action<{}> & { payload: IUser.Model['collapsed'] },
) {
  yield put({
    type: 'user/update',
    payload: {
      collapsed: action.payload,
    },
  });
}
function* changeIsOnline(
  action: Action<{}> & { payload: IUser.Model['isOnline'] },
) {
  const state = yield select();
  if (action.payload) {
    yield call(userAPI.updateConfigCatch, {
      project: state.project,
    });
    yield put({ type: 'user/changeInfo', payload: {} });
    yield put({ type: 'user/changeLoginStatus', payload: {} });
    history.push('/');
  } else {
    yield getConfig().then(function*(rs) {
      if (rs) {
        yield put({
          type: 'project/update',
          payload: rs.project,
        });
      } else {
        yield writeConfig({
          project: state.project,
        });
      }
      history.push('/');
    });
  }
  yield put({
    type: 'user/update',
    payload: {
      isOnline: action.payload,
    },
  });
}
function* updateConfig(action: Action<{}>) {
  const state = yield select();
  yield call(userAPI.updateConfigCatch, {
    project: state.project,
    bezier: state.bezier,
    color: state.color,
  });
}
export function* watchLogin() {
  // while (true) {
  //   const { payload } = yield take(NAME('login'));
  //   const task = yield fork(login, payload);
  //   const { type } = yield take([NAME('logout'), NAME('loginError')]);
  //   if (type === NAME('logout')) {
  //     yield cancel(task);
  //   }
  //   yield call(logout, payload);
  // }
  yield takeLatest(NAME('login'), login);
}
export function* watchLoginLast() {
  yield takeEvery(NAME('loginLast'), loginLast);
}
export function* watchCollapsed() {
  yield takeLatest(NAME('changeCollapsed'), changeCollapsed);
}
export function* watchIsOnline() {
  yield takeLatest(NAME('changeIsOnline'), changeIsOnline);
}
export function* watchUpdateConfig() {
  yield takeLatest(NAME('updateConfig'), updateConfig);
}
