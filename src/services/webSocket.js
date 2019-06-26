import store from '../index';

let websocket;
const URL = 'ws://localhost:6001';

function onMessage() {
  const { dispatch } = store;
  if (websocket) {
    websocket.onmessage = event => {
      dispatch({
        type: 'webSocket/onMessage',
        payload: event,
      });
    };
  }
}
function onOpen() {
  const { dispatch } = store;
  if (websocket) {
    websocket.onopen = event => {
      dispatch({
        type: 'webSocket/onOpen',
        payload: event,
      });
    };
  }
}
function onClose() {
  const { dispatch } = store;
  if (websocket) {
    websocket.onclose = event => {
      dispatch({
        type: 'webSocket/onClose',
        payload: event,
      });
    };
  }
}
function onError() {
  const { dispatch } = store;
  if (websocket) {
    websocket.onerror = event => {
      dispatch({
        type: 'webSocket/onError',
        payload: event,
      });
    };
  }
}

export function openWebsocket(url = URL) {
  if (!websocket) {
    websocket = new WebSocket(url);
    onOpen();
    onClose();
    onMessage();
    onError();
  }
  return websocket;
}
export function closeWebsocket() {
  if (websocket) {
    websocket.close();
    websocket = undefined;
  }
}
export function sendMessage(msg) {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(msg);
  }
}
