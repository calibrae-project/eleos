let express = require('express');
let getUserDataDir = require('./main.js').getUserDataDir();
let app = express();
let expressWs = require('express-ws')(app);
let os = require('os');
let pty = require('node-pty');

let auth = require('http-auth');
let basic = auth.basic({
    realm: "eleos",
    file: (getUserDataDir + '/eleos.htpasswd')
});

let terminals = {},
    logs = {};

app.use(auth.connect(basic));

app.use('/resources/', express.static(__dirname + '/resources'));

app.use('/xterm/', express.static(__dirname + '/node_modules/xterm/dist'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/console.html');
});

app.get('/console.html', function (req, res) {
    res.sendFile(__dirname + '/console.html');
});

app.get('/style.css', function (req, res) {
    res.sendFile(__dirname + '/resources/xtermjs.css');
});

app.get('/main.js', function (req, res) {
    res.sendFile(__dirname + '/resources/xtermjs.js');
});

app.get('/fetch.min.js', function (req, res) {
    res.sendFile(__dirname + '/resources/fetch.min.js');
});

app.post('/terminals', function (req, res) {
    let cols = parseInt(req.query.cols),
        rows = parseInt(req.query.rows),
        term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', (process.platform === 'win32' ? ['/k', 'cd ' + __dirname] : ['-c', 'cd ' + __dirname + ' && bash']), {
            name: 'xterm-color',
            cols: cols || 80,
            rows: rows || 24,
            cwd: process.env.PWD,
            env: process.env
        });

    console.log('Created terminal with PID: ' + term.pid);
    terminals[term.pid] = term;
    logs[term.pid] = '';
    term.on('data', function (data) {
        logs[term.pid] += data;
    });
    res.send(term.pid.toString());
    res.end();
});

app.post('/terminals/:pid/size', function (req, res) {
    let pid = parseInt(req.params.pid);
    let cols = parseInt(req.query.cols);
    let rows = parseInt(req.query.rows);
    let term = terminals[pid];

    term.resize(cols, rows);
    console.log('Resized terminal ' + pid + ' to ' + cols + ' cols and ' + rows + ' rows.');
    res.end();
});

app.ws('/terminals/:pid', function (ws, req) {
    let term = terminals[parseInt(req.params.pid)];
    console.log('Connected to terminal ' + term.pid);
    ws.send(logs[term.pid]);

    term.on('data', function (data) {
        try {
            ws.send(data);
        } catch (ex) {
            // The WebSocket is not open, ignore
        }
    });
    ws.on('message', function (msg) {
        term.write(msg);
    });
    ws.on('close', function () {
        term.kill();
        console.log('Closed terminal ' + term.pid);
        // Clean things up
        delete terminals[term.pid];
        delete logs[term.pid];
    });
});

let port = process.env.PORT || 3000;
let host = os.platform() === 'win32' ? '127.0.0.1' : '0.0.0.0';

app.listen(port, host);
