var express = require('express');
var overlay = express();
var server = require('http').Server(overlay);
var io = require('socket.io')(server);
var port = process.env.OVERLAY_PORT || 3456;

var serverNs = io.of('/server'); // the game server should connect to this namespace to send things to the overlay server
var clientNs = io.of('/client'); // the overlay client should connect to this namespace to receive things from the overlay server

overlay.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});
overlay.use("/", express.static('./overlay'));

require('fs').watch('temp', function (event, filename) {
    if (filename === 'overlayReload' && event === 'change') {
        console.log('Refreshing overlay...');
        clientNs.emit('reload');
    }
});

// forward commands and messages to the client
serverNs.on('connection', function (socket) {
    socket.on('command', function (command) {
        clientNs.emit('command', command);
    });
    socket.on('message', function (data) {
        clientNs.emit('message', data);
    });
    socket.on('vote', function (data) {
        clientNs.emit('vote', data);
    });
});


console.log('Starting overlay server on :' + port + ' ...');
server.listen(port, function () {
    console.log('Overlay server started.');
});
