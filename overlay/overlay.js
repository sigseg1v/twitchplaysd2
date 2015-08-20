(function () {
    var CHAT_FADE_TIME_MS = 30000;

    var d3 = require('d3');

    var socket = null;
    var chatMessageFadeInterval = undefined;

    function MessageViewModel(username, message, valid) {
        var self = this;
        self.username = username || "";
        self.message = message || "";
        self.valid = !!valid;
        self.time = new Date();
    }

    function OverlayViewModel() {
        var self = this;
        self.actionCommand = ko.observable("").extend({ notify: 'always' });
        self.movementCommand = ko.observable("").extend({ notify: 'always' });
        self.chat = ko.observableArray();
        self.actionVoteMap = ko.observable({}).extend({ notify: 'always' });
        self.movementVoteMap = ko.observable({}).extend({ notify: 'always' });
        self.actionVoteList = ko.pureComputed(function () {
            return Object.keys(self.actionVoteMap()).map(function (key) {
                return self.actionVoteMap()[key];
            });
        });
        self.movementVoteList = ko.pureComputed(function () {
            return Object.keys(self.movementVoteMap()).map(function (key) {
                return self.movementVoteMap()[key];
            });
        });
    }

    function createD3Chart(selector, data) {
        var width = 150;
        var height = 150;
        var outerRadius = 65;
        var innerRadius = 45;

        var color = d3.scale.category10();

        var pie = d3.layout.pie()
            .value(function (d) { return d.count; })
            .sort(null);

        var arc = d3.svg.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        var svg = d3.select(selector)
            .append('svg')
                .attr('width', width)
                .attr('height', height)
            .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var path = svg.selectAll("path").data(pie(data), keyFunc);
        path.enter()
            .append("path")
                .attr("fill", function(d, i) { return color(i); })
                .attr("d", arc)
                .each(function(d) { this._current = d; }); // store the initial angles so we can use to tween
        path.exit()
            .remove();

        function update(data) {
            path = path.data(pie(data), keyFunc);
            path.transition().duration(500).attrTween("d", arcTween); // redraw the arcs
        }

        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) {
                return arc(i(t));
            };
        }

        function keyFunc(d) {
            return d.data.id;
        }

        return {
            update: update
        };
    }

    function init() {
        var vm = new OverlayViewModel();
        socket = require('socket.io-client')('http://localhost:3456/client');

        var actionVoteChart = createD3Chart(".action-vote .vis", []);
        var movementVoteChart = createD3Chart(".movement-vote .vis", []);

        vm.actionVoteList.subscribe(function (list) {
            actionVoteChart.update(list);
        });
        vm.movementVoteList.subscribe(function (list) {
            movementVoteChart.update(list);
        });

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
                    if (vm.actionVoteList().length !== 0) {
                        vm.actionVoteMap({});
                    }
                } else if (command.type === 'movement') {
                    if (command.description) {
                        // only clear the mouse if there is a new location, since it will stay where it was left
                        vm.movementCommand(command.description);
                    }
                    if (vm.movementVoteList().length !== 0) {
                        vm.movementVoteMap({});
                    }
                }
            } else {
                console.log('Unknown command received:', command);
            }
        });
        socket.on('vote', function (data) {
            if (data.group === 'action') {
                var voteMap = vm.actionVoteMap();
                voteMap[data.id] = data;
                vm.actionVoteMap(voteMap);
            } else if (data.group === 'movement') {
                var voteMap = vm.movementVoteMap();
                voteMap[data.id] = data;
                vm.movementVoteMap(voteMap);
            }
        });

        clearInterval(chatMessageFadeInterval);
        chatMessageFadeInterval = setInterval(function () {
            var list = vm.chat();
            var now = new Date();
            for (var i = 0, len = list.length; i < len; i++) {
                if (now - list[i].time > CHAT_FADE_TIME_MS) {
                    vm.chat.splice(i, vm.chat().length - i);
                    break;
                }
            }
        }, 5000);

        ko.applyBindings(vm);
    }

    $(window).load(function () {
        init();
    });
})();
