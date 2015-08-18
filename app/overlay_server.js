var express = require('express');
var overlay = express();
var server = require('http').Server(overlay);
var io = require('socket.io')(server);
var port = process.env.OVERLAY_SOCKET || 3456;

overlay.use("/", express.static('./overlay'));

require('fs').watch('temp', function (event, filename) {
    if (filename === 'overlayReload' && event === 'change') {
        console.log('Refreshing overlay...');
        io.emit('reload');
    }
});

console.log('Starting overlay server on :' + port + ' ...');
server.listen(port, function () {
    console.log('Overlay server started.');
});
