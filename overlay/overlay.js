(function () {
    var socket = null;
    function MessageViewModel() {
        var self = this;
        self.username = "Username";
        self.message = "Message";
    }

    function OverlayViewModel() {
        var self = this;
        self.command = ko.observable("Command");
        self.chat = ko.observableArray([ new MessageViewModel(), new MessageViewModel() ]);
    }

    function init() {
        socket = require('socket.io-client')();
        socket.on('connect', function () {
            console.log('Connected to overlay socket.io server.');
        });
        socket.on('reload', function () {
            window.location.reload();
        });
        ko.applyBindings(new OverlayViewModel());
    }

    $(window).load(function () {
        init();
    });
})();
