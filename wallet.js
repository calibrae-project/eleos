const {ipcMain} = require('electron');
const request = require('request');
const {dialog} = require('electron');
const fs = require('fs');
const os = require('os');

const config = require('./config.json');

function writeConfig(data) {
    fs.writeFile('config.json', data, function (err) {
        if (err) {
            console.log(err.message);
        }
    });
}

// set default coin conf locations
if ((config.coin === 'zcl') && (os.platform() === 'win32')) {
    var coinConf = process.env.APPDATA + '/Zclassic/' + 'zclassic.conf';
}
if ((config.coin === 'zcl') && (os.platform() === 'darwin')) {
    var coinConf = process.env.HOME + '/Library/Application Support/Zclassic/' + 'zclassic.conf';
}
if ((config.coin === 'zcl') && (os.platform() === 'linux')) {
    var coinConf = process.env.HOME + '/.zclassic/' + 'zclassic.conf';
}
if ((config.coin === 'zec') && (os.platform() === 'win32')) {
    var coinConf = process.env.APPDATA + '/Zcash/' + 'zcash.conf';
}
if ((config.coin === 'zec') && (os.platform() === 'darwin')) {
    var coinConf = process.env.HOME + '/Library/Application Support/Zcash/' + 'zcash.conf';
}
if ((config.coin === 'zec') && (os.platform() === 'linux')) {
    var coinConf = process.env.HOME + '/.zcash/' + 'zcash.conf';
}

// get config options from wallet daemon file
let array = [];
try {
    if (os.platform() === 'win32' && config.confPathWin.length === 0) {
        array = fs.readFileSync(coinConf, 'UTF-8').toString().split('\r');
    } else if (os.platform() === 'win32') {
        array = fs.readFileSync(config.confPathWin, 'UTF-8').toString().split('\n');
    }
    if (os.platform() === 'darwin' && config.confPathMacOS.length === 0) {
        array = fs.readFileSync(coinConf, 'UTF-8').toString().split('\n');
    } else if (os.platform() === 'darwin') {
        array = fs.readFileSync(config.confPathMacOS, 'UTF-8').toString().split('\n');
    }
    if (os.platform() === 'linux' && config.confPathLinux.length === 0) {
        array = fs.readFileSync(coinConf, 'UTF-8').toString().split('\n');
    } else if (os.platform() === 'linux') {
        array = fs.readFileSync(config.confPathLinux, 'UTF-8').toString().split('\n');
    }

    for (let i = 0; i < array.length; i++) {
        let tmpString = array[i].replace(' ', '').toLowerCase().trim();
        if (tmpString.search('rpcuser') > -1) {
            var rpcUser = array[i].replace(' ', '').trim().substr(array[i].replace(' ', '').trim().indexOf('=') + 1);
        }
        if (tmpString.search('rpcpassword') > -1) {
            var rpcPassword = array[i].replace(' ', '').trim().substr(array[i].replace(' ', '').trim().indexOf('=') + 1);
        }
        if (tmpString.search('rpcport') > -1) {
            var rpcPort = array[i].replace(' ', '').trim().substr(array[i].replace(' ', '').trim().indexOf('=') + 1);
        }
    }
}
catch (error) {
    dialog.showErrorBox('Could not find wallet configuration file', 'Double-check the coin selection. If that doesn\'t work then manually set the configuration file location in the options.');
}

if (rpcPort === '' || rpcPort === undefined) {
    rpcPort = config.rpcPort.length > 0 ? config.rpcPort : '8232';
}

ipcMain.on('jsonQuery-request', (event, query) => {
    let response = jsonQuery(query, function(response) {
        event.sender.send('jsonQuery-reply', response);
    });
});

ipcMain.on('jsonQuery-request-sync', (event, query) => {
    let response = jsonQuery(query, function(response) {
        event.returnValue = response;
    });
});

ipcMain.on('save-opts', (event, opts) => {
    for (let i = 0; i < Object.keys(opts).length; i++) {
        let key = Object.keys(opts)[i];
        config[key] = opts[key];
    }
    writeConfig(JSON.stringify(config, null, 4));
});

function jsonQuery(query, callback) {
    var options  = {
        method: 'POST',
        url: 'http://' + (rpcUser ? rpcUser : config.rpcUser) + ':' + (rpcPassword ? rpcPassword : config.rpcPass) + '@'
            + (config.rpcIP.length > 0 ? config.rpcIP : '127.0.0.1') + ':' + (rpcPort ? rpcPort : config.rpcPort),
        headers: {
            'Content-type': 'text/plain'
        },
        json: query
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode === 401) { // we have an error
            console.log('Cannot authenticate with wallet RPC service. Check username and password.');
            callback(response.body);
        }
        else if (!error) {
            callback(response.body);
        }
    });
}


ipcMain.on('coin-request', (event) => {
    event.sender.send('coin-reply', config.coin);
});


module.exports = { jsonQuery };
