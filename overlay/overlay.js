(function () {
    var socket = null;
    function MessageViewModel(username, message, valid) {
        var self = this;
        self.username = username || "";
        self.message = message || "";
    }

    function OverlayViewModel() {
        var self = this;
        self.actionCommand = ko.observable("");
        self.movementCommand = ko.observable("");
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
            if (command) {
                if (command.type === 'action') {
                    vm.actionCommand(command.description || '');
                } else if (command.type === 'movement') {
                    if (command.description) {
                        // only clear the mouse if there is a new location, since it will stay where it was left
                        vm.movementCommand(command.description);
                    }
                }
            } else {
                console.log('Unknown command received:', command);
            }
        });

        ko.applyBindings(vm);
    }

    $(window).load(function () {
        init();
    });
})();
