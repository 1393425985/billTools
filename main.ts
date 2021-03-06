const { app, BrowserWindow, globalShortcut, dialog,ipcMain } = require('electron');
const package = require('./build/package.json');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

const loadingParams = {
  show: false,
  width: 400,
  height: 200,
  modal: true,
  frame: false,
  backgroundColor: 'rgba(0, 21, 41, 0.9)',
  webPreferences: {
    nodeIntegration: true,
  },
};
const mainParams = {
  // icon: __dirname + '/icon.png',
  show: false,
  width: 1200,
  height: 800,
  webPreferences: {
    nodeIntegration: true,
    webSecurity: false,
  },
};

let mainWindow;
let loadingScreen;

function createWindow() {
  mainWindow = new BrowserWindow(mainParams);
  mainWindow.setTitle(package.name);

  mainWindow.loadURL(`http://localhost:9000`);
  mainWindow.webContents.openDevTools();
  // mainWindow.loadFile('dist/index.html');

  // mainWindow.once('ready-to-show');
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
    if (loadingScreen) {
      loadingScreen.close();
    }
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
    globalShortcut.unregisterAll();
  });
}

function createLoadingScreen() {
  loadingScreen = new BrowserWindow(
    Object.assign(loadingParams, { parent: mainWindow }),
  );

  loadingScreen.loadFile('static/firstScreen.html');
  loadingScreen.on('closed', () => {
    loadingScreen = null;
  });
  loadingScreen.webContents.on('did-finish-load', () => {
    loadingScreen.show();
  });
}

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', () => {
  createLoadingScreen();
  createWindow();
  // createMenu();
});

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (mainWindow === null) {
    createWindow();
  }
});

// 在这个文件中，你可以续写应用剩下主进程代码。
// 也可以拆分成几个文件，然后用 require 导入。
// require('./shortcut-capture');
