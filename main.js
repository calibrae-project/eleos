const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const config = require('./config.js').options;

const path = require('path');
const url = require('url');

const wallet = require('./wallet.js');

const {ipcMain, Menu} = require('electron');

const os = require('os');
const spawn = require('child_process').spawn;
const spawnSync = require('child_process').execSync;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// check if keys are valid on posix environments
if (os.platform() === 'darwin') {
    let cmd = require('path').dirname(require.main.filename) + '/init.sh';
    spawnSync(cmd);
}

// start wallet daemon
if (os.platform() === 'win32') {
    var cmd = config.binaryPathWin.length > 0 ? config.binaryPathWin : 'C:/Program Files (x86)/Zclassic/zcashd.exe';
}
else {
    var cmd = config.binaryPathMacOS.length > 0 ? config.binaryPathMacOS : require('path').dirname(require.main.filename) + '/zcashd-mac';
}
try {
    var zcashd = spawn(cmd);
} catch (err) {// TODO: add exception catching
}

function createWindow () {
    const template = [
        {
            label: 'File',
            submenu: [
                /*
                     {
                         label: 'Backup Wallet'
                     },
                     {
                         label: 'Encrypt Wallet'
                     },
                     */
                {
                    label: 'Quit',
                    click() { app.quit() }
                }
            ]
        },
        {
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                { type: "separator" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                /*
                {
                    label: 'Backup Wallet'
                },
                {
                    label: 'Encrypt Wallet'
                }
                */
            ]
        }
    ];

    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                {
                    role: 'about'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'services',
                    submenu: []
                },
                {
                    type: 'separator'
                },
                {
                    role: 'hide'
                },
                {
                    role: 'hideothers'
                },
                {
                    role: 'unhide'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'quit'
                }
            ]
        });
    }


    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

  // Create the browser window.
  mainWindow = new BrowserWindow({'minWidth': 780, 'minHeight': 430, 'width': 780, 'height': 430, icon:'resources/' + config.coin + '.png'});

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

app.on('before-quit', function() {
    if (zcashd) {
        console.log('Sending wallet STOP command.');
        wallet.jsonQuery({'jsonrpc': '1.0', 'id': 'stop', 'method': 'stop', 'params': []},
            function(text) {console.log(text.result)});
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
