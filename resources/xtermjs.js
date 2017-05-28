let term;
let protocol;
let socketURL;
let socket;
let pid;
let charWidth;
let charHeight;

let terminalContainer = document.getElementById('terminal-container'),
    optionElements = {
        cursorBlink: document.querySelector('#option-cursor-blink'),
        scrollback: document.querySelector('#option-scrollback'),
        tabstopwidth: document.querySelector('#option-tabstopwidth')
    },
    colsElement = document.getElementById('cols'),
    rowsElement = document.getElementById('rows');

createTerminal();
term.fit();

function createTerminal() {
    // Clean terminal
    while (terminalContainer.children.length) {
        terminalContainer.removeChild(terminalContainer.children[0]);
    }
    term = new Terminal({});
    term.on('resize', function (size) {
        if (!pid) {
            return;
        }
        fetch(url, {method: 'POST', credentials: 'include'});
    });
    protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
    socketURL = protocol + location.hostname + ((location.port) ? (':' + location.port) : '') + '/terminals/';

    term.open(terminalContainer);
    term.fit();

    let initialGeometry = term.proposeGeometry(),
        cols = initialGeometry.cols,
        rows = initialGeometry.rows;

    fetch('/terminals?cols=' + cols + '&rows=' + rows, {method: 'POST', credentials: 'include'}).then(function (res) {

        charWidth = Math.ceil(term.element.offsetWidth / cols);
        charHeight = Math.ceil(term.element.offsetHeight / rows);

        res.text().then(function (pid) {
            window.pid = pid;
            socketURL += pid;
            socket = new WebSocket(socketURL);
            socket.onopen = runRealTerminal;
            socket.onclose = runFakeTerminal;
            socket.onerror = runFakeTerminal;
        });
    });
}

function runRealTerminal() {
    term.attach(socket);
    term._initialized = true;
}

function runFakeTerminal() {
    if (term._initialized) {
        return;
    }

    term._initialized = true;

    let shellprompt = '$ ';

    term.prompt = function () {
        term.write('\r\n' + shellprompt);
    };

    term.writeln('Welcome to xterm.js');
    term.writeln('This is a local terminal emulation, without a real terminal in the back-end.');
    term.writeln('Type some keys and commands to play around.');
    term.writeln('');
    term.prompt();

    term.on('key', function (key, ev) {
        let printable = (
            !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey
        );

        if (ev.keyCode === 13) {
            term.prompt();
        } else if (ev.keyCode === 8) {
            // Do not delete the prompt
            if (term.x > 2) {
                term.write('\b \b');
            }
        } else if (printable) {
            term.write(key);
        }
    });

    term.on('paste', function (data, ev) {
        term.write(data);
    });
}
