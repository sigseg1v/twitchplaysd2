(function () {
    function MessageViewModel() {
        var self = this;
        self.username = "username";
        self.message = "message";
    }

    function OverlayViewModel() {
        var self = this;
        self.command = ko.observable("command");
        self.chat = ko.observableArray([ new MessageViewModel(), new MessageViewModel() ]);
    }

    function init() {
        ko.applyBindings(new OverlayViewModel());
    }

    $(window).load(function () {
        init();
    });
})();
