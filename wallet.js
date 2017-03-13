const {ipcMain} = require('electron');
const request = require('request');

const fs = require('fs');
const os = require('os');

const config = require('./config.js').options;

// get config options from wallet daemon file
let array = [];
if (os.platform() === 'win32' && config.confPathWin.length === 0) {
    array = fs.readFileSync(process.env.APPDATA + '/Zclassic/' + 'zclassic.conf', 'UTF-8').toString().split('\r');
} else if (os.platform() === 'win32') {
    array = fs.readFileSync(config.confPathWin, 'UTF-8').toString().split('\n');
}
if (os.platform() === 'darwin' && config.confPathMacOS.length === 0) {
    array = fs.readFileSync(process.env.HOME + '/Library/Application Support/Zclassic/' + 'zclassic.conf', 'UTF-8').toString().split('\n');

} else if (os.platform() === 'darwin') {
    array = fs.readFileSync(config.confPathMacOS, 'UTF-8').toString().split('\n');
}
if (os.platform() === 'linux' && config.confPathLinux.length === 0) {
    array = fs.readFileSync(process.env.HOME + '/.zclassic/' + 'zclassic.conf', 'UTF-8').toString().split('\n');
} else if (os.platform() === 'linux') {
    array = fs.readFileSync(config.confPathLinux, 'UTF-8').toString().split('\n');
}

for (let i = 0; i < array.length; i++) {
    let tmpString = array[i].replace(' ', '').toLowerCase().trim();
    if (tmpString.search('rpcuser') > -1) {
        var rpcUser = array[i].replace(' ', '').trim().substr(array[i].replace(' ', '').trim().indexOf('=')+1);
    }
    if (tmpString.search('rpcpassword') > -1) {
        var rpcPassword = array[i].replace(' ', '').trim().substr(array[i].replace(' ', '').trim().indexOf('=')+1);
    }
    if (tmpString.search('rpcport') > -1) {
        var rpcPort = array[i].replace(' ', '').trim().substr(array[i].replace(' ', '').trim().indexOf('=')+1);
    }
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

function jsonQuery(query, callback) {
    var options  = {
        method: 'POST',
        url: 'http://' + rpcUser + ':' + rpcPassword + '@' + (config.rpcIP.length > 0 ? config.rpcIP : '127.0.0.1') + ':' + rpcPort,
        headers: {
            'Content-type': 'text/plain'
        },
        json: query
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(response.body);
        }
        else if (!error && response.statusCode === 401) { // we have an error
            console.log('Cannot authenticate with wallet RPC service. Check username and password.');
            callback(response.body);
        }
        else {
            callback(response.body);
        }
    });
}

ipcMain.on('coin-request', (event) => {
    event.sender.send('coin-reply', config.coin);
});



module.exports = { jsonQuery };
