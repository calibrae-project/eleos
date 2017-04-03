var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var os = require('os');
var pty = require('node-pty');

var auth = require('http-auth');
var basic = auth.basic({
    realm: "eleos",
    file: __dirname + "/eleos.htpasswd"
});

var terminals = {},
    logs = {};

app.use(auth.connect(basic));

app.use('/resources/', express.static(__dirname + '/resources'));

app.use('/xterm/', express.static(__dirname + '/node_modules/xterm/dist'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/console.html');
});

app.get('/console.html', function(req, res){
  res.sendFile(__dirname + '/console.html');
});

app.get('/style.css', function(req, res){
  res.sendFile(__dirname + '/resources/xtermjs.css');
});

app.get('/main.js', function(req, res){
  res.sendFile(__dirname + '/resources/xtermjs.js');
});

app.get('/fetch.min.js', function(req, res){
  res.sendFile(__dirname + '/resources/fetch.min.js');
});

app.post('/terminals', function (req, res) {
  var cols = parseInt(req.query.cols),
      rows = parseInt(req.query.rows),
      term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
        name: 'xterm-color',
        cols: cols || 80,
        rows: rows || 24,
        cwd: process.env.PWD,
        env: process.env
      });

  console.log('Created terminal with PID: ' + term.pid);
  terminals[term.pid] = term;
  logs[term.pid] = '';
  term.on('data', function(data) {
    logs[term.pid] += data;
  });
  res.send(term.pid.toString());
  res.end();
});

app.post('/terminals/:pid/size', function (req, res) {
  var pid = parseInt(req.params.pid),
      cols = parseInt(req.query.cols),
      rows = parseInt(req.query.rows),
      term = terminals[pid];

  term.resize(cols, rows);
  console.log('Resized terminal ' + pid + ' to ' + cols + ' cols and ' + rows + ' rows.');
  res.end();
});

app.ws('/terminals/:pid', function (ws, req) {
  var term = terminals[parseInt(req.params.pid)];
  console.log('Connected to terminal ' + term.pid);
  ws.send(logs[term.pid]);

  term.on('data', function(data) {
    try {
      ws.send(data);
    } catch (ex) {
      // The WebSocket is not open, ignore
    }
  });
  ws.on('message', function(msg) {
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

var port = process.env.PORT || 3000,
    host = os.platform() === 'win32' ? '127.0.0.1' : '0.0.0.0';

app.listen(port, host);
