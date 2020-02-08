const {
  app,
  BrowserWindow,
  globalShortcut,
  dialog,
  ipcMain,
  Menu
} = require('electron');
const { autoUpdater } = require('electron-updater');
const request = require('request');
const pkg = require('./package.json');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

// Windows平台的应用通知
// if (process.platform === 'win32') {
//   app.setAppUserModelId(package.build.appId);
// }
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
  Menu.setApplicationMenu(null)
  mainWindow = new BrowserWindow(mainParams);
  mainWindow.setTitle(pkg.name);

  // mainWindow.loadURL(`http://localhost:9000`);
  // mainWindow.webContents.openDevTools();
  // app.commandLine.appendSwitch('proxy-server', 'http://47.101.51.134');
  mainWindow.loadFile('dist/index.html');

  // mainWindow.once('ready-to-show');
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
    if (loadingScreen) {
      loadingScreen.close();
    }
    attachCheckVersionEvents();
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

function attachCheckVersionEvents() {
  // "https://api.github.com/repos/1393425985/billTools/releases/latest"
  const readyUpdate = isNeedEvent => {
    mainWindow.webContents.send('checkVersionStatus', {
      step: 1,
    });
    request(
      {
        url:
          'https://api.github.com/repos/1393425985/billTools/releases/latest',
        method: 'GET',
        strictSSL: false,
        timeout: 200000,
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
        },
        body: undefined,
      },
      (err, response, body) => {
        if (err) {
          mainWindow.webContents.send('checkVersionStatus', {
            step: 0,
            progress: undefined,
            msg: err,
          });
        } else {
          autoUpdater.setFeedURL(
            `https://github.com/1393425985/billTools/releases/download/${
              JSON.parse(body).tag_name
            }/`,
          );
          if (isNeedEvent) {
            // 检查更新失败
            autoUpdater.on('error', (e, error) => {
              mainWindow.webContents.send('checkVersionStatus', {
                step: 0,
                progress: undefined,
                msg: error,
              });
            });
            // 检查更新
            autoUpdater.on('checking-for-update', () => {});
            // 开始下载
            autoUpdater.on('update-available', () => {
              mainWindow.webContents.send('checkVersionStatus', {
                step: 2,
                progress: 0,
              });
            });
            // 无需更新
            autoUpdater.on('update-not-available', () => {
              mainWindow.webContents.send('checkVersionStatus', {
                step: 2,
                progress: undefined,
              });
            });
            // 下载进度
            autoUpdater.on('download-progress', progressObj => {
              mainWindow.webContents.send('checkVersionStatus', {
                step: 2,
                progress: progressObj.percent,
              });
            });
            // 下载完成
            autoUpdater.on(
              'update-downloaded',
              (event, releaseNotes, releaseName) => {
                mainWindow.webContents.send('checkVersionStatus', {
                  step: 3,
                  progress: undefined,
                });
                const dialogOpts = {
                  type: 'info',
                  buttons: ['立即重启', '稍后'],
                  title: '应用更新',
                  message:
                    process.platform === 'win32' ? releaseNotes : releaseName,
                  detail: '新版安装包已下载，是否立即重启应用更新？',
                };

                dialog.showMessageBox(dialogOpts, rs => {
                  if (rs === 0) {
                    autoUpdater.quitAndInstall();
                  }
                });
              },
            );
          }

          autoUpdater.checkForUpdates();
        }
      },
    );
  };

  readyUpdate(true);
  ipcMain.on('checkVersion', (e, arg) => {
    readyUpdate(false);
  });
}

// 在这个文件中，你可以续写应用剩下主进程代码。
// 也可以拆分成几个文件，然后用 require 导入。
// require('./shortcut-capture');
