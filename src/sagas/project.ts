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

  
  const NAMESPACE = 'project';
  const NAME = name => `saga/${NAMESPACE}/${name}`;
  function* update(payload) {
    yield put({ type: 'project/update', payload });
  }
  export function* watchUpdate() {
    yield takeEvery(NAME('update'), update);
  }
  