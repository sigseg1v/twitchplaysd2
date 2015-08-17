var express = require('express');
var overlay = express();

overlay.use("/", express.static('./overlay'));

console.log('Starting overlay server on :3456 ...');
overlay.listen(3456, function () {
    console.log('Overlay server started.');
});
