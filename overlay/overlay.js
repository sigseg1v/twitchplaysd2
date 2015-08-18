(function () {
    var socket = null;
    function MessageViewModel(username, message, valid) {
        var self = this;
        self.username = username || "";
        self.message = message || "";
    }

    function OverlayViewModel() {
        var self = this;
        self.command = ko.observable("");
        self.chat = ko.observableArray();
    }

    function init() {
        var vm = new OverlayViewModel();

        socket = require('socket.io-client')('http://localhost:3456/client');
        socket.on('connect', function () {
            console.log('Connected to overlay socket.io server.');
        });
        socket.on('reload', function () {
            window.location.reload();
        });
        socket.on('message', function (data) {
            vm.chat.unshift(new MessageViewModel(data.name, data.message, data.match));
            if (vm.chat().length > 60) {
                vm.chat.splice(40, vm.chat().length - 40);
            }
        });
        socket.on('command', function (command) {
            vm.command(command || '');
        });

        ko.applyBindings(vm);
    }

    $(window).load(function () {
        init();
    });
})();
