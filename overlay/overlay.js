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
        self.mouseCommand = ko.observable("").extend({ notify: 'always' });
        self.repeat = ko.observable("OFF").extend({ notify: 'always' });
        self.chat = ko.observableArray();

        self.actionVoteMap = ko.observable({}).extend({ notify: 'always' });
        self.delayUntilNextAction = ko.observable(0).extend({ notify: 'always' });
        self.actionVoteList = ko.pureComputed(function () {
            return Object.keys(self.actionVoteMap()).map(function (key) {
                return self.actionVoteMap()[key];
            });
        });

        // self.movementVoteMap = ko.observable({}).extend({ notify: 'always' });
        // self.delayUntilNextMovement = ko.observable(0).extend({ notify: 'always' });
        // self.movementVoteList = ko.pureComputed(function () {
        //     return Object.keys(self.movementVoteMap()).map(function (key) {
        //         return self.movementVoteMap()[key];
        //     });
        // });
    }

    function createD3Chart(selector, swatchSelector, data) {
        var width = 70;
        var height = 70;
        var outerRadius = 35;
        var innerRadius = 25;
        var timerInnerRadius = 22;

        var color = d3.scale.category10();

        var pie = d3.layout.pie()
            .value(function (d) { return d.count; })
            .sort(null);

        var arc = d3.svg.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        var timerArc = d3.svg.arc()
            .innerRadius(timerInnerRadius)
            .outerRadius(innerRadius);

        var svg = d3.select(selector)
            .append('svg')
                .attr('width', width)
                .attr('height', height);

        var swatchSvg = d3.select(swatchSelector)
            .append('svg')
                .attr('width', width * 2)
                .attr('height', height);

        var donut = svg
            .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
        var timer = svg
            .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
        var swatches = swatchSvg;

        update(data);

        function update(data) {
            var path = donut.selectAll("path").data(pie(data), keyFunc);
            path.enter()
                .append("path")
                    .attr("fill", function(d, i) { return color(i); })
                    .attr("d", arc)
                    .each(function(d) { this._current = d; }); // store the initial angles so we can use to tween
            path.transition()
                .duration(500).attrTween("d", arcTween); // redraw the arcs
            path.exit()
                .remove();
            if (data.length === 0) {
                timer.selectAll("path").attr("opacity", 0);
            } else {
                timer.selectAll("path").attr("opacity", 1);
            }

            var swatchGroups = swatches.selectAll("g").data(data.map(function (d, i) { return { data: d, originalOrder: i}; }).sort(swatchSort), function (d) { return d.data.id; });
            swatchGroups.each(function (g, i) {
                // need to manually go into the groups in order to update existing text
                // use the current 'i' to give the new order
                var group = d3.select(this)
                group.select("rect")
                    .attr("y", function (d) { return i * 14; });
                group.select("text")
                    .attr("y", function (d) { return 10 + i * 14; })
                    .text(swatchText);
            });
            var addedGroup = swatchGroups
                .enter().append("g");
                    addedGroup.append("rect")
                            .attr("fill", function(d, i) { return color(d.originalOrder); })
                            .attr("width", 12)
                            .attr("height", 12)
                            .attr("x", 0)
                            .attr("y", function (d, i) { return i * 14; })
                    addedGroup.append("text")
                            .attr("fill", function(d, i) { return color(d.originalOrder); })
                            .attr("x", 14)
                            .attr("y", function (d, i) { return 10 + i * 14; })
                            .attr("font-family", "sans-serif")
                            .attr("font-size", "12px")
                            .text(swatchText);
            swatchGroups.exit()
                .remove();
        }

        function swatchText (d) {
            return d.data.count + ": " + d.data.description;
        }

        function swatchSort (a, b) {
            return (a.data.count > b.data.count) ? -1 : ((a.data.count < b.data.count) ? 1 : (b.data.id - a.data.id));
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

        function restartCountdown(time) {
            timer.selectAll("path").data([]).exit().remove();
            var path = timer.selectAll("path").data([{ value: 1, endAngle: Math.PI * 2, padAngle: 0, startAngle: 0 }]);
            path.enter()
                .append("path")
                    .attr("fill", "whitesmoke")
                    .attr("d", timerArc)
                    .attr("opacity", 0)
                    .transition()
                        .duration(time).attrTween("d", function (a) {
                            var i = d3.interpolate({ value: 1, endAngle: 0, padAngle: 0, startAngle: 0 }, a);
                            return function(t) {
                                return timerArc(i(t));
                            };
                        }); // redraw the arcs
        }

        return {
            update: update,
            restartCountdown: restartCountdown
        };
    }

    function init() {
        var vm = new OverlayViewModel();
        socket = require('socket.io-client')(process.env.OVERLAY_HOST + ':' + process.env.OVERLAY_PORT + '/client');

        var actionVoteChart = createD3Chart(".action-vote .vis", ".action-vote .bars", []);
        //var movementVoteChart = createD3Chart(".movement-vote .vis", ".movement-vote .bars", []);

        vm.actionVoteList.subscribe(function (list) {
            actionVoteChart.update(list);
        });
        vm.delayUntilNextAction.subscribe(function (delay) {
            actionVoteChart.restartCountdown(delay);
        });
        // vm.movementVoteList.subscribe(function (list) {
        //     movementVoteChart.update(list);
        // });
        // vm.delayUntilNextMovement.subscribe(function (delay) {
        //     movementVoteChart.restartCountdown(delay);
        // });

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
                    vm.delayUntilNextAction(command.delay);
                    if (vm.actionVoteList().length !== 0) {
                        vm.actionVoteMap({});
                    }
                } else if (command.type === 'movement') {
                    if (command.description) {
                        // only clear the mouse if there is a new location, since it will stay where it was left
                        vm.movementCommand(command.description);
                    }
                    // vm.delayUntilNextMovement(command.delay);
                    // if (vm.movementVoteList().length !== 0) {
                    //     vm.movementVoteMap({});
                    // }
                } else if (command.type === 'mouseAction') {
                    if (command.description) {
                        // only clear the mouse if there is a new location, since it will stay where it was left
                        vm.mouseCommand(command.description);
                    }
                }
            } else {
                console.log('Unknown command received:', command);
            }
        });
        socket.on('repeatToggle', function (data) {
            vm.repeat(data.value ? 'ON' : 'OFF');
        });
        socket.on('vote', function (data) {
            if (data.group === 'action') {
                var voteMap = vm.actionVoteMap();
                voteMap[data.id] = data;
                vm.actionVoteMap(voteMap);
            }
            // else if (data.group === 'movement') {
            //     var voteMap = vm.movementVoteMap();
            //     voteMap[data.id] = data;
            //     vm.movementVoteMap(voteMap);
            // }
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
