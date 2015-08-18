var express = require('express');
var overlay = express();
var server = require('http').Server(overlay);
var io = require('socket.io')(server);

overlay.use("/", express.static('./overlay'));

require('fs').watch('temp', function (event, filename) {
    if (filename === 'overlayReload' && event === 'change') {
        console.log('Refreshing overlay...');
        io.emit('reload');
    }
});

console.log('Starting overlay server on :3456 ...');
server.listen(3456, function () {
    console.log('Overlay server started.');
});
