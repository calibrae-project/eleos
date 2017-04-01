const electron = require('electron');
const {dialog} = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');
const {ipcMain, Menu} = require('electron');
const os = require('os');
const spawn = require('child_process').spawn;
const spawnSync = require('child_process').spawnSync;
const fs = require('fs');

const config = require('./config.json');
const wallet = require('./wallet.js');

let mainWindow;
let zcashd;

function writeConfig(data) {
    fs.writeFile('config.json', data, function (err) {
        if (err) {
            console.log(err.message);
        }
    });
}

function clearConfig() {
    data = {
        "coin": "zcl",
        "rpcUser": "",
        "rpcPass": "",
        "rpcIP": "",
        "rpcPort": "",
        "binaryPathWin": "",
        "binaryPathMacOS": "",
        "binaryPathLinux": "",
        "confPathWin": "",
        "confPathMacOS": "",
        "confPathLinux": "",
        "keysLoaded": false
    };
    data = JSON.stringify(data, null, 4);
    fs.writeFile('config.json', data, function (err) {
        if (err) {
            console.log(err.message);
        } else {
            dialog.showErrorBox('Configuration options reset', 'Eleos configuration file reset. Please restart the wallet.');
        }
    });
}

function getParams(reset) {
    if (reset === true) {
        config.keysLoaded = false;
    }

    // check if keys are valid in MacOS environment
    if ((os.platform() === 'darwin') && (config.keysLoaded !== true)) {
        let cmd = 'open';
        let args = ['-a', 'Terminal.app', 'init.sh'];
        let result = spawnSync(cmd, args).status;
        dialog.showErrorBox('Downloading proving and verification keys', 'This may take a few minutes (about 1gb of data). Restart the wallet once complete.');
        if (result === 0) {
            config.keysLoaded = true;
            var data = JSON.stringify(config, null, 4);
            writeConfig(data);
            startWallet();
        }
    }

    // check if keys are valid in Linux environment
    if ((os.platform() === 'linux') && (config.keysLoaded !== true)) {
        let cmd = 'xterm';
        let args = ['-e', require('path').dirname(require.main.filename) + '/init.sh'];
        let result = spawnSync(cmd, args).status;
        dialog.showErrorBox('Downloading proving and verification keys', 'This may take a few minutes (about 1gb of data). Restart the wallet once complete.');
        if (result === 0) {
            config.keysLoaded = true;
            var data = JSON.stringify(config, null, 4);
            writeConfig(data);
            startWallet();
        }
    }
}

function startWallet() {
    if ((os.platform() === 'win32') && (config.keysLoaded === true)) {
        var cmd = config.binaryPathWin.length > 0 ? config.binaryPathWin : require('path').dirname(require.main.filename) + '/zcash.exe';
    }
    else if ((os.platform() === 'darwin') && (config.keysLoaded === true)) {
        var cmd = config.binaryPathMacOS.length > 0 ? config.binaryPathMacOS : require('path').dirname(require.main.filename) + '/zcashd-mac';
    }
    else if ((os.platform() === 'linux') && (config.keysLoaded === true)) {
        var cmd = config.binaryPathLinux.length > 0 ? config.binaryPathLinux : require('path').dirname(require.main.filename) + '/zcashd-linux';
    }
    getParams();
    if (config.keysLoaded === true) {
        try {
            zcashd = spawn(cmd);
            createWindow();
        }
        catch (err) { // TODO: add exception catching
        }
    }
}

function getFileLocationOpts(title) {
    let options = {};
    options.title = title;
    options.defaultPath = require('path').dirname(require.main.filename);
    options["properties"] = ['showHiddenFiles', 'openFile'];
    options["filters"] = [
        { name: 'Executables', extensions: ['*'] }
    ];
    return options;
}

function binaryPathCB(path) {
    if (path === undefined) {
        return;
    }
    path = path[0];
    console.log('Setting binary path to: ' + path);
    if (os.platform() === 'win32') {
        config.binaryPathWin = path;
    }
    else if (os.platform() === 'darwin') {
        config.binaryPathMacOS = path;
    }
    else if (os.platform() === 'linux') {
        config.binaryPathLinux = path;
    }
    writeConfig(JSON.stringify(config, null, 4));
}

function confPathCB(path) {
    if (path === undefined) {
        return;
    }
    path = path[0];
    console.log('Setting coin configuration path to: ' + path);
    if (os.platform() === 'win32') {
        config.confPathWin = path;
    }
    else if (os.platform() === 'darwin') {
        config.confPathMacOS = path;
    }
    else if (os.platform() === 'linux') {
        config.confPathLinux = path;
    }
    writeConfig(JSON.stringify(config, null, 4));
}

function showRPCOpts() {
    let win = new BrowserWindow({width: 420, height: 400}); //, parent: mainWindow, modal: true});
    //win.webContents.openDevTools();
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'rpc.html'),
        protocol: 'file:',
        slashes: true}));
    win.once('ready-to-show', () => {
        win.show()
    })

}

function createWindow() {
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
                    click() {
                        app.quit()
                    }
                }
            ]
        },
        {
            label: "Edit",
            submenu: [
                {label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:"},
                {label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:"},
                {type: "separator"},
                {label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:"},
                {label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:"},
                {label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:"},
                {label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:"}
            ]
        },
        {
            label: 'Options',
            submenu: [
                {
                    label: 'Redownload Params',
                    click() { getParams(true); }
                },
                {
                    label: 'Set Wallet Daemon',
                    click() { dialog.showOpenDialog(getFileLocationOpts('Set Wallet Daemon Location'), binaryPathCB) }
                },
                {
                    label: 'Set Coin Config Location',
                    click() { dialog.showOpenDialog(getFileLocationOpts('Set Coin Config Location'), confPathCB) }
                },
                {
                    label: 'Set RPC Credentials',
                    click() { showRPCOpts() }
                },
                {
                    label: 'Set Coin',
                    submenu: [
                        {
                            label: 'Zclassic (ZCL)',
                            type: 'radio',
                            checked: (config.coin.toLowerCase() === 'zcl'),
                            click() { config.coin = 'zcl'; writeConfig(JSON.stringify(config, null, 4)) }
                        },
                        {
                            label: 'Zcash (ZEC)',
                            type: 'radio',
                            checked: (config.coin.toLowerCase() === 'zec'),
                            click() { config.coin = 'zec'; writeConfig(JSON.stringify(config, null, 4)) }
                        }

                    ]
                },
                {
                    label: 'separator',
                    type: 'separator'
                },
                {
                    label: 'Reset Configuration',
                    click() { clearConfig() }
                }
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
    mainWindow = new BrowserWindow({
        'minWidth': 780,
        'minHeight': 430,
        'width': 780,
        'height': 430,
        icon: 'resources/' + config.coin.toLowerCase() + '.png'
    });

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
app.on('ready', startWallet);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        startWallet();
    }
});

app.on('before-quit', function () {
    if (zcashd) {
        console.log('Sending wallet STOP command.');
        wallet.jsonQuery({'jsonrpc': '1.0', 'id': 'stop', 'method': 'stop', 'params': []},
            function (text) {
                console.log(text.result)
            });
    }
});