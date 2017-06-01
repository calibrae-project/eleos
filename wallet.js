const {app, dialog, ipcMain} = require('electron');
const fs = require('fs');
const os = require('os');
const readline = require('readline');
const request = require('request');

let config = require('./main.js').getConfig();

// set default coin config location
let coinConf;

if ((config.confPathWin.length > 0 && fs.existsSync(config.confPathWin)) || (config.confPathMacOS.length > 0 && fs.existsSync(config.confPathWin)) || (config.confPathLinux.length > 0 && fs.existsSync(config.confPathWin))) {
    if (os.platform() === 'win32') coinConf = config.confPathWin;
    if (os.platform() === 'darwin') coinConf = config.confPathMacOS;
    if (os.platform() === 'linux') coinConf = config.confPathLinux;
}
else {
    if ((config.coin.toLowerCase() === 'zcl') && ((os.platform() === 'win32') || (os.platform() === 'darwin'))) {
        coinConf = app.getPath('appData') + '/Zclassic/zclassic.conf';
    }
    else if (config.coin.toLowerCase() === 'zcl') {
        coinConf = app.getPath('home') + '/.zclassic/zclassic.conf';
    }

    if ((config.coin.toLowerCase() === 'zec') && ((os.platform() === 'win32') || (os.platform() === 'darwin'))) {
        coinConf = app.getPath('appData') + '/Zcash/zcash.conf';
    }
    else if (config.coin.toLowerCase() === 'zec') {
        coinConf = app.getPath('home') + '/.zcash/zcash.conf';
    }

    if ((config.coin.toLowerCase() === 'zen') && ((os.platform() === 'win32') || (os.platform() === 'darwin'))) {
        coinConf = app.getPath('appData') + '/Zen/zen.conf';
    }
    else if (config.coin.toLowerCase() === 'zen') {
        coinConf = app.getPath('home') + '/.zen/zen.conf';
    }
}

// get config options from wallet daemon file
let rl;
let rpcOpts = {};
let rpcUser, rpcPassword, rpcIP, rpcPort;
if (!fs.existsSync(coinConf)) {
    console.log('Invalid path ' + coinConf + ' for wallet config file. Check config.json for accuracy.');
    return;
}
else {
    rl = readline.createInterface({input: fs.createReadStream(coinConf)});
}

rl.on('line', (line) => {
    line.trim();
    rpcOpts[line.split("=", 2)[0].toLowerCase()] = line.split("=", 2)[1];
});
rl.on('close', () => {
    // set RPC communication options
    rpcUser = rpcOpts.rpcuser ? rpcOpts.rpcuser : config.rpcUser;
    rpcPassword = rpcOpts.rpcpassword ? rpcOpts.rpcpassword : config.rpcPassword;
    rpcIP = config.rpcIP.length > 0 ? config.rpcIP : '127.0.0.1';
    //rpcPort = rpcOpts.rpcport ? rpcOpts.rpcport : (config.rpcPort.length > 0 ? config.rpcPort : (config.coin == 'zcl' ? 8232 : 8233));
    if (rpcOpts.rpcport) {
        rpcPort = rpcOpts.rpcport;
    } else {
        if (config.rpcPort.length > 0) {
            rpcPort = config.rpcPort;
        } else {
            if (config.coin === 'zcl') {
                rpcPort = 8232;
            } else if (config.coin === 'zec') {
                rpcPort = 8233;
            } else if (config.coin === 'zen') {
                rpcPort = 8231;
            }
        }
    }

    // authentication for terminal
    let HtAuth = require('ht-auth'),
        htAuth = HtAuth.create({file: (app.getPath('userData') + '/eleos.htpasswd')});
    htAuth.add({username: rpcUser, password: rpcPassword, force: true}, function (err) {
        // initialize xtermjs
        const term = require('./xterm.js');
    });
});

function jsonQuery(query, callback) {
    if (rpcUser.length === 0 || rpcPassword.length === 0 || rpcIP.length === 0 || rpcPort.length === 0) return;
    let options = {
        method: 'POST',
        url: encodeURI('http://' + rpcUser + ':' + rpcPassword + '@' + rpcIP + ':' + rpcPort),
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

ipcMain.on('jsonQuery-request', (event, query) => {
    jsonQuery(query, function (response) {
        event.sender.send('jsonQuery-reply', response);
    });
});

ipcMain.on('jsonQuery-request-sync', (event, query) => {
    jsonQuery(query, function (response) {
        event.returnValue = response;
    });
});

ipcMain.on('coin-request', (event) => {
    event.sender.send('coin-reply', config.coin.length === 0 ? 'zcl' : config.coin.toLowerCase());
});

function getCredentials() {
    return {rpcUser: rpcUser, rpcPassword: rpcPassword, rpcIP: rpcIP, rpcPort: rpcPort};
}

module.exports = {getCredentials, jsonQuery};
