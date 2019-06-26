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
import * as userAPI from '../services/user';

const NAMESPACE = 'user';
const NAME = name => `saga/${NAMESPACE}/${name}`;

function* login(payload) {
  try {
    yield put({ type: 'loading/open', name: NAME('login') });
    const rs = yield call(userAPI.login, payload);
    if (rs.status === 'success') {
      yield put({ type: 'user/changeInfo', payload: rs.data.userInfo });
      yield put({ type: 'user/changeLoginStatus', payload: { status: true } });
    } else {
      yield put({
        type: 'user/changeLoginStatus',
        payload: { status: false, msg: 'error' },
      });
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
  yield fork(userAPI.logout, payload);
  yield put({ type: 'user/changeInfo', payload: {} });
  yield put({ type: 'user/changeLoginStatus', payload: {} });
}
export function* watchLogin() {
  while (true) {
    const { payload } = yield take(NAME('login'));
    const task = yield fork(login, payload);
    const { type } = yield take([NAME('logout'), NAME('loginError')]);
    if (type === NAME('logout')) {
      yield cancel(task);
    }
    yield call(logout, payload);
  }
}
