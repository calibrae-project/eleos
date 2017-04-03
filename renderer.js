const {ipcRenderer} = require('electron');
var tableify = require('tableify');

var memos = [], options = [], oldOptions = [], privTxs = [], shieldedOpts = [], transOpts = [], txs = [];
var genHistory = {'transparent': false, 'private': false};

Array.prototype.getRandom = function () {
    return this[Math.floor(Math.random() * this.length)];
};

function hexToString(s) {
    let str = '';
    for (let i = 0; i < s.length; i++) {
        let charCode = parseInt(s[(i*2)] + s[(i*2)+1], 16);
        str += String.fromCharCode(charCode);
    }
    return str;
}

function generateQuery (method, params) {
    let jsonObject;
    jsonObject = {'jsonrpc': '1.0', 'id': method, 'method': method, 'params': params};
    ipcRenderer.send('jsonQuery-request', jsonObject);
    return(jsonObject);
}

function generateQuerySync (method, params) {
    let jsonObject;
    jsonObject = {'jsonrpc': '1.0', 'id': method, 'method': method, 'params': params};
    return ipcRenderer.sendSync('jsonQuery-request-sync', jsonObject);
}

function showTxDetails(txid) {
    let res = generateQuerySync('gettransaction', [txid]);
    let datetime = new Date(res.result.time * 1000);
    datetime = datetime.toLocaleTimeString() + " - " + datetime.toLocaleDateString();
    let category = (res.result.amount < 0.0) ? 'send' : 'receive';
    let obj = { amount: res.result.amount, blockhash: res.result.blockhash, category: category, confirmations: res.result.confirmations, fee: res.result.fee, txid: res.result.txid, time: datetime };
    let alertText = `Amount: ${obj.amount}\n` +
            `Blockhash: ${obj.blockhash}\n` +
            `Confirmations: ${obj.confirmations}\n` +
            `Fee: ${obj.fee}\n` +
            `Time: ${obj.time}\n` +
            `TXID: ${obj.txid}\n`;
    alert(alertText);
}

function generateMemoTable (memos) {
    let localMemos = memos;
    localMemos.sort(function(a, b){ // sort table by date
        if (b.time === a.time) {
            return b.address - a.address;
        }
        return b.time - a.time;
    });
    for (let i = 0; i < localMemos.length; i++) {
        localMemos[i]["details"] = '<a href="javascript:void(0)" onclick="renderer.showTxDetails(\'' + localMemos[i].txid + '\')">click</a>';
        let datetime = new Date(localMemos[i]["time"] * 1000);
        localMemos[i]["time"] = datetime.toLocaleTimeString() + " - " + datetime.toLocaleDateString();
        delete localMemos[i].txid;
    }
    // build empty table if no results
    if (localMemos.length < 1) {
        localMemos[0] = {'amount': '', 'address': '', 'memo': '', 'time': '', 'details': ''};
    }
    let tableElement = tableify(localMemos);
    let div = document.createElement('div');
    div.innerHTML = tableElement;
    div.firstElementChild.className += ' w3-table-all w3-tiny';
    document.getElementById("memoPage").innerHTML = div.innerHTML;
}

function generateHistoryTable (txs, privTxs) {
    let combinedTxs = [].concat(txs, privTxs);
    combinedTxs.sort(function(a, b){
        if (b.time === a.time) {
            return b.address - a.address;
        }
        return b.time - a.time;
    });
    for (let i = 0; i < privTxs.length; i++) {
        privTxs[i]["address"] = privTxs[i].address.substr(0, 16) + '......' + privTxs[i].address.substr(-16);
    }
    memos = [];
    for (let i = 0; i < combinedTxs.length; i++) {
        if (combinedTxs[i].memo && combinedTxs[i].memo.substr(0, 6) !== 'f60000') {
            memos.push({
                amount: combinedTxs[i].amount,
                address: combinedTxs[i].address,
                txid: combinedTxs[i].txid,
                memo: hexToString(combinedTxs[i].memo),
                time: combinedTxs[i].time
            });
        }
        let datetime = new Date(combinedTxs[i]["time"] * 1000);
        combinedTxs[i]["time"] = datetime.toLocaleTimeString() + " - " + datetime.toLocaleDateString();
        combinedTxs[i]["details"] = '<a href="javascript:void(0)" onclick="renderer.showTxDetails(\'' + combinedTxs[i].txid + '\')">click</a>';
        delete combinedTxs[i].txid;
        delete combinedTxs[i].memo;
    }
    // build empty table if no results
    if (combinedTxs.length < 1) {
        combinedTxs[0] = {'address': 'No received transactions found', 'amount': 0, 'category': '', 'confirmations': '', 'time': '', 'details': ''};
    }
    let tableElement = tableify(combinedTxs);
    let div = document.createElement('div');
    div.innerHTML = tableElement;
    div.firstElementChild.className += 'w3-table-all w3-tiny';
    for (let i = 0; i < div.getElementsByClassName("number").length; i++) {
        div.getElementsByClassName("number")[i].className += ' w3-right';
    }
    document.getElementById("transactionTransparentSpan").innerHTML = div.innerHTML;
}

ipcRenderer.on('jsonQuery-reply', (event, arg) => {
    if (arg.error && arg.error.code === -28) {
        document.getElementById("alertSpan").innerHTML = '<img src="resources/box.gif" style="display: block; margin: auto; padding-top: 15px;"/><h2 style="text-align: center;">' + arg.error.message + '</h2>';
    }
    else {
        document.getElementById("alertSpan").innerHTML = '';
    }

    if (arg.id === 'getnetworkinfo') {
        document.getElementById("connectionsValue").innerHTML = arg.result.connections;
    }
    else if (arg.id === 'z_gettotalbalance') {
        document.getElementById("currentBalanceValue").innerHTML = arg.result.total;
        document.getElementById("transparentBalanceValue").innerHTML = arg.result.transparent;
        document.getElementById("transparentAvailableValue").innerHTML = arg.result.transparent;
        document.getElementById("privateBalanceValue").innerHTML = arg.result.private;
    }
    else if (arg.id === 'listtransactions') {
        let table = arg.result;
        for (let i = 0; i < table.length; i++) {
            delete table[i]["account"];
            delete table[i]["blockhash"];
            delete table[i]["blockindex"];
            delete table[i]["blocktime"];
            delete table[i]["fee"];
            delete table[i]["size"];
            delete table[i]["timereceived"];
            delete table[i]["vjoinsplit"];
            delete table[i]["vout"];
            delete table[i]["walletconflicts"];
            txs.push(table[i]);
        }
        genHistory.transparent = true;
    }
    if (arg.id === 'listaddressgroupings') {
        let table = [];
        let ctr = 0;
        for (let i = 0; i < arg.result.length; i++) {
            for (let n = 0; n < arg.result[i].length; n++) {
                table[ctr] = { 'transparent address': arg.result[i][n][0], 'amount': arg.result[i][n][1] };
                ctr += 1;
                let option = document.createElement("option");
                option.text = arg.result[i][n][0] + ' (' + arg.result[i][n][1] + ')';
                option.value = arg.result[i][n][0];
                let pushed = false;
                for (let x = 0; x < transOpts.length; x++) {
                    if (transOpts[x].value === option.value) {
                        if (arg.result[i][n][1] > 0) {
                            transOpts[x] = option;
                            pushed = true;
                        } else if (arg.result[i][n][1] === 0) {
                            transOpts.splice(x, 1);
                            pushed = true;
                        }
                        break;
                    }
                }
                if ((pushed === false) && (arg.result[i][n][1] > 0)) {
                    transOpts.push(option);
                }
            }
        }
        // build empty table if no results
        if (arg.result.length < 1) {
            table[0] = {'transparent address': 'No addresses with received balances found', 'amount': 0};
        }
        let tableElement = tableify(table);
        let div = document.createElement('div');
        div.innerHTML = tableElement;
        div.firstElementChild.className += ' w3-table-all w3-tiny';
        for (let i = 0; i < div.getElementsByClassName("number").length; i++) {
            div.getElementsByClassName("number")[i].className += ' w3-right';
        }
        if (document.getElementById("addressTransparentSpan").innerHTML !== div.innerHTML) {
            document.getElementById("addressTransparentSpan").innerHTML = div.innerHTML;
        }
    }
    else if (arg.id === 'z_listaddresses') {
        let table = [];
        let ctr = 0;
        for (let i = 0; i < arg.result.length; i++) {
            let res = generateQuerySync('z_getbalance', [arg.result[i], 0]);
            table[ctr] = { 'private address': arg.result[i], 'amount': res.result };
            ctr += 1;
            if (res.result > 0) {
                let option = document.createElement("option");
                option.text = arg.result[i] + ' (' + res.result + ')';
                option.value = arg.result[i];
                let pushed = false;
                for (let x = 0; x < shieldedOpts.length; x++) {
                    if (shieldedOpts[x].value === option.value) {
                        shieldedOpts[x] = option;
                        pushed = true;
                    }
                }
                if (pushed === false) {
                    shieldedOpts.push(option);
                }
            }
        }
        // build empty table if no results
        if (arg.result.length < 1) {
            table[0] = {'privateaddress': 'No addresses with received balances found', 'amount': 0};
        }
        let tableElement = tableify(table);
        let div = document.createElement('div');
        div.innerHTML = tableElement;
        div.firstElementChild.className += ' w3-table-all w3-tiny';
        for (let i = 0; i < div.getElementsByClassName("number").length; i++) {
            div.getElementsByClassName("number")[i].className += ' w3-right';
        }
        if (document.getElementById("addressPrivateSpan").innerHTML !== div.innerHTML) {
            document.getElementById("addressPrivateSpan").innerHTML = div.innerHTML;
        }

        // gather a list of TXIDs associated with z_addresses
        for (let i = 0; i < arg.result.length; i++) {
            let res = generateQuerySync('z_listreceivedbyaddress', [arg.result[i], 0]);
            for (let n = 0; n < res.result.length; n++) {
                let tx = generateQuerySync('gettransaction', [res.result[n].txid]);
                privTxs.push({ address: arg.result[i], txid: tx.result.txid, amount: res.result[n].amount,
                    memo: res.result[n].memo, category: 'receive', time: tx.result.time, confirmations: tx.result.confirmations });
            }
        }
        genHistory.private = true;
    }
    else if (arg.id === 'listreceivedbyaddress') {
        let unusedAddresses = [];
        for (let i = 0; i < arg.result.length; i++) {
            if (arg.result[i].amount === 0) {
                unusedAddresses.push(arg.result[i].address);
            }
            if (unusedAddresses.length === 0) {
                document.getElementById("newTransparentAddress").click();
            }
        }
    }
    else if (arg.id === 'sendmany') {
        if (arg.result === null) {
            window.alert('There was an error:\n\n' + arg.error.message);
        }
        else {
            window.alert('Successfully transmitted transaction.\n\nTXID: ' + arg.result);
        }
    }
    else if (arg.id === 'z_sendmany') {
        if (arg.result === null) {
            window.alert('There was an error:\n\n' + arg.error.message);
        }
        else {
            window.alert('Successfully initiated private transaction.\n\nTXID: ' + arg.result);
        }
    }
});

ipcRenderer.on('coin-reply', (event, arg) => {
    document.getElementById("coin").innerHTML = arg;
});

ipcRenderer.on('params-pending', (event, arg) => {
    if (arg.percent < 1) {
        document.getElementById("alertSpan").innerHTML = '<img src="resources/box.gif" style="display: block; margin: auto; padding-top: 15px;"/>' +
            '<h2 style="text-align: center;">downloading proving and verification keys</h2>' +
            '<h4 style="text-align: center;">' + (arg.name.substr(arg.name.lastIndexOf('/') + 1)) + '</h4>' +
            '<h4 style="text-align: center;">' + (arg.percent * 100).toFixed(2) + '%</h4>';
    }
    else if (!arg.percent || arg.percent === 1) {
        document.getElementById("alertSpan").innerHTML = '';
    }
});

ipcRenderer.on('params-complete', (event, arg) => {
    if (arg === false) {
        document.getElementById("alertSpan").innerHTML = '<img src="resources/box.gif" style="display: block; margin: auto; padding-top: 15px;"/>' +
            '<h2 style="text-align: center;">initializing</h2>';
    }
    else {
        document.getElementById("alertSpan").innerHTML = '';
    }
});

function refreshUI() {
    ipcRenderer.send('check-params');
    ipcRenderer.send('check-config');
    ipcRenderer.send('check-wallet');

    // for receivePage
    generateQuery('listreceivedbyaddress', [0, true]);

    // for historyPage
    generateQuery('listtransactions', []);

    // for addressesPage
    generateQuery('listaddressgroupings', []);
    generateQuery('z_listaddresses', []);

    // for general use
    generateQuery('getnetworkinfo', []);
    generateQuery('getinfo', []);
    generateQuery('z_gettotalbalance', [0]);


    //sort collected options
    options = [].concat(transOpts, shieldedOpts);

    // update the private send dropdown only if needed
    var different = false;
    if (options.length !== oldOptions.length) {
        different = true;
    }
    else if (options.length == oldOptions.length) {
        for (let i = 0; i < options.length; i++) {
            if (options[i].value !== oldOptions[i].value) {
                different = true;
            }
        }
        if (!different) return;
    }
    if (different && options.length > 0) {
        document.getElementById("privateFromSelect").innerHTML = '';
        for (let i = 0; i < options.length; i++) {
            document.getElementById("privateFromSelect").add(options[i]);
        }
        oldOptions = options;
        options = [];
        transOpts = [];
        shieldedOpts = [];
    }
}

function pollUI() {
    if (genHistory.transparent === true && genHistory.private === true) {
        generateHistoryTable(txs, privTxs);
        txs = [];
        privTxs = [];
        genHistory.transparent = false;
        genHistory.private = false;
        generateMemoTable(memos);
    }
}

refreshUI();
setInterval(refreshUI, 900);
setInterval(pollUI, 400);
ipcRenderer.send('coin-request'); // get abbreviation for coin

module.exports = {
    generateQuerySync: function(method, params) {
        return generateQuerySync(method, params);
    },
    generateQuery: function(method, params) {
        return generateQuery(method, params);
    },
    showTxDetails: function(txid) {
        return showTxDetails(txid);
    },
    saveOpts: function(opts) {
        ipcRenderer.send('save-opts', opts);
    }
};
