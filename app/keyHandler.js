require('string.prototype.repeat'); // polyfill
var Promise = require('bluebird');
var exec = Promise.promisify(require('child_process').exec);
var config = require('./config.js');
var lastTime = {};
var throttledCommandsDurationMap = config.throttledCommands;
var throttledCommandList = Object.keys(throttledCommandsDurationMap);
var regexThrottle = new RegExp('^(' + throttledCommandList.join('|') + ')$', 'i');
var regexFilter = new RegExp('^(' + config.filteredCommands.join('|') + ')$', 'i');

for (var i = 0; i < throttledCommandList.length; i++) {
    lastTime[throttledCommandList[i]] = new Date().getTime();
}

var commandAggregator = {};


var commandSequenceNumber = 1;

var mouseMappings = {
    treeTab: [220,330,420],
    treeRow: [100,168,238,304,372,440],
    treeCol: [440,510,580],

    skillRow: [490,443,398,348,300],
    rightCol: [698,648,602,552,505,455,408,360,310,265],
    leftCol: [105,152,202,248,295,344,394,440,487,535],

    invRow: [331,359,388,418],
    invCol: [432,461,490,520,548,577,606,634,665,693],

    stashRow: [157,187,216,245,274,303,331,361],
    stashCol: [168,198,226,255,284,314],

    vendorRow: [140,167,197,223,253,282,315,339,369,400],
    vendorCol: [110,138,167,197,225,254,284,314,343,370],

    questRow: [150,250],
    questCol: [141,239,335],

    cubeRow: [215,242,272,301],
    cubeCol: [213,240,270]
};

var state = {
    repeatEnabled: false,

    mouseX: 0,
    mouseY: 0,

    treeRow: 1,
    treeCol: 1,

    skillRow: 1,
    lastSkillSide: 'right',
    rightCol: 1,
    leftCol: 1,

    invRow: 1,
    invCol: 1,

    stashRow: 1,
    stashCol: 1,

    questRow: 1,
    questCol: 1,

    vendorRow: 1,
    vendorCol: 1,

    cubeRow: 1,
    cubeCol: 1
};

// action that can be queued
function Action(key, mouse, desc) {
    var self = this;

    self.key = key;
    self.mouse = mouse;
    self.desc = desc;
    self.count = 1;
    self.group = 'action';
    self.continuous = false;
    self.canBeGlobalContinuous = false;
    self.overrideDelay = null;
}
Action.prototype.toJSON = function () {
    // this, stringified, is literally the key to determine whether two objects are equal, so don't add extra properties
    var ret = {};
    if (this.key) {
        ret.key = this.key;
    }
    if (this.mouse) {
        ret.mouse = this.mouse;
    }
    return ret;
};
Action.prototype.description = function (val) {
    this.desc = val;
    return this;
};
Action.prototype.setCount = function (val) {
    var count = toActionCount(val || 1);
    if (this.key) {
        this.key = this.key.repeat(count);
    }
    if (this.mouse) {
        this.mouse.count = count;
    }
    this.count = count;
    return this;
};
Action.prototype.delay = function () {
    return Math.max(this.mouse ? (this.count - 1) * config.mouseRepeatDelay : 0, this.key ? (this.count - 1) * config.keyRepeatDelay : 0);
};
Action.prototype.setThisContinuous = function(val) {
    if (val !== undefined) {
        this.continuous = !!val;
    }
    return this;
};
Action.prototype.enableGlobalContinuous = function () {
    this.canBeGlobalContinuous = true;
    return this;
};
Action.prototype.setOverrideDelay = function (val) {
    if (!isNaN(parseInt(val))) {
        this.overrideDelay = parseInt(val);
    }
    return this;
};

// action that represents a mouse or interface movement
function MovementAction(mouse, key, desc) {
    var self = this;
    Action.call(self, key, mouse, desc);
    self.group = 'movement';
}
MovementAction.prototype = Object.create(Action.prototype, { constructor: { value: MovementAction } });

// action that represents a mouse or interface movement
function MouseAction(mouse, key, desc) {
    var self = this;
    Action.call(self, key, mouse, desc);
    self.group = 'mouseAction';
}
MouseAction.prototype = Object.create(Action.prototype, { constructor: { value: MouseAction } });

// storedFunc can be a promise
function StoredAction(storedFunc) {
    var self = this;
    Action.call(self, null, null, null);
    self.canBeGlobalContinuous = false;
    self.stored = storedFunc;
}
StoredAction.prototype = Object.create(Action.prototype, { constructor: { value: StoredAction } });

// calls stored function. If the stored function returns a truthy result, then keeps calling the result in a sequential promise chain until one returns false
StoredAction.prototype.run = function (events) {
    var self = this;

    var stored = self.stored;
    var res = stored(events);
    // this is a way of casting an object into a promise (instead of checking for .then)
    var resPromise = Promise.resolve(res);
    while (res) {
        // call next
        res = res(events);
        if (res) {
            resPromise = resPromise.then(Promise.resolve(res));
        }
    }
    return resPromise;
};

var specialActions = {
    ESCAPE: new Action('{Esc}{Space}').description('esc'), // this is for resurrection of dead player -- the actual command is a separate script, so the keys here are for fallback
    REPEAT: new StoredAction(function (events) {
        if (events) {
            events.emit('repeatToggle', {
                value: true
            });
        }
        state.repeatEnabled = true;
        var next = null;
        return next;
    }).description('repeat on'),
    REPEATOFF: new StoredAction(function (events) {
        if (events) {
            events.emit('repeatToggle', {
                value: false
            });
        }
        state.repeatEnabled = false;
        var next = null;
        return next;
    }).description('repeat off'),
    BINDSKILLFACTORY: function (side, fKeyNum, row, col) {
        return new StoredAction(function (events) {
            var row_re = config.commands["skill row"];
            var left_col_re = config.commands["left col"];
            var right_col_re = config.commands["right col"];
            var fkey_re = config.commands["fkey"];

            var row_actionFunc = actionMap["skill row"];
            var left_col_actionFunc = actionMap["left col"];
            var right_col_actionFunc = actionMap["right col"];
            var fkey_actionFunc = actionMap["fkey"];

            // actions to perform
            var openLeftMenu = actionMap["left menu"]();
            var openRightMenu = actionMap["right menu"]();
            var moveRow = row_actionFunc(("skill row " + row).match(row_re));
            var moveCol;
            var pushKey = fkey_actionFunc(("f" + fKeyNum).match(fkey_re));
            var close = actionMap["close"]([]);

            if (side === "left") {
                moveCol = left_col_actionFunc(("left skill col " + col).match(left_col_re));
            } else {
                moveCol = right_col_actionFunc(("right skill col " + col).match(right_col_re));
            }

            executeAction(side === "left" ? openLeftMenu : openRightMenu, events)
                .then(executeAction.bind(null, moveRow, events))
                .then(executeAction.bind(null, moveCol, events))
                .then(executeAction.bind(null, pushKey, events))
                .then(executeAction.bind(null, close, events));

            var next = null;
            return next;
        }).description('bind skill');
    }
};

var actionMap = {
    "repeat": function () { return specialActions.REPEAT; },
    "repeatoff": function () { return specialActions.REPEATOFF; },

    "esc": function () { return specialActions.ESCAPE; },
    "center": function () { return new MovementAction({ x: 400, y: 282 }).description('center'); },
    "left": function (match) { return new MovementAction({ x: 360 - (toActionCount(match[3], 0, 3) * 50), y: 282, left: true }).description(descriptionFormat('left', match[3])).enableGlobalContinuous(); },
    "upleft": function (match) { return new MovementAction({ x: 360 - (toActionCount(match[4], 0, 3) * 50), y: 242 - (toActionCount(match[4], 0, 3) * 50), left: true }).description(descriptionFormat('upleft', match[4])).enableGlobalContinuous(); },
    "up": function (match) { return new MovementAction({ x: 400, y: 242 - (toActionCount(match[3], 0, 3) * 50), left: true }).description(descriptionFormat('up', match[3])).enableGlobalContinuous(); },
    "upright": function (match) { return new MovementAction({ x: 440 + (toActionCount(match[4], 0, 3) * 50), y: 242 - (toActionCount(match[4], 0, 3) * 50), left: true }).description(descriptionFormat('upright', match[4])).enableGlobalContinuous(); },
    "right": function (match) { return new MovementAction({ x: 440 + (toActionCount(match[3], 0, 3) * 50), y: 282, left: true }).description(descriptionFormat('right', match[3])).enableGlobalContinuous(); },
    "downright": function (match) { return new MovementAction({ x: 440 + (toActionCount(match[4], 0, 3) * 50), y: 322 + (toActionCount(match[4], 0, 3) * 50), left: true }).description(descriptionFormat('downright', match[4])).enableGlobalContinuous(); },
    "down": function (match) { return new MovementAction({ x: 400, y: 322 + (toActionCount(match[3], 0, 3) * 50), left: true }).description(descriptionFormat('down', match[3])).enableGlobalContinuous(); },
    "downleft": function (match) { return new MovementAction({ x: 360 - (toActionCount(match[4], 0, 3) * 50), y: 322 + (toActionCount(match[4], 0, 3) * 50), left: true }).description(descriptionFormat('downleft', match[4])).enableGlobalContinuous(); },

    "str": function () { return new MovementAction({ x: 220, y: 150 }).description('str'); },
    "dex": function () { return new MovementAction({ x: 220, y: 215 }).description('dex'); },
    "vit": function () { return new MovementAction({ x: 220, y: 300 }).description('vit'); },
    "energy": function () { return new MovementAction({ x: 220, y: 360 }).description('energy'); },

    'belt': function (match) {
        var slotNumber = parseInt(match[1]);
        if (slotNumber === 1 || slotNumber === 2 || slotNumber === 3 || slotNumber === 4) {
            return new MovementAction(null, "" + slotNumber).description('belt' + slotNumber);
        } else {
            return null;
        }
    },

    "tree tab": function (match) {
        var x = 670;
        var slotNumber = parseInt(match[1]);
        if (mouseMappings.treeTab.length > slotNumber - 1) {
            var index = slotNumber - 1;
            return new MovementAction({ x: x, y: mouseMappings.treeTab[index] }).description('tree tab ' + slotNumber);
        }
        return null;
    },
    "tree row": function (match) {
        var slotNumber = parseInt(match[1]);
        state.treeRow = slotNumber;
        return rowColToMovementAction(state.treeRow, state.treeCol, mouseMappings.treeRow, mouseMappings.treeCol).description('tree row ' + slotNumber);
    },
    "tree col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.treeCol = slotNumber;
        return rowColToMovementAction(state.treeRow, state.treeCol, mouseMappings.treeRow, mouseMappings.treeCol).description('tree col ' + slotNumber);
    },

    "skill row": function (match) {
        var slotNumber = parseInt(match[2]);
        state.skillRow = slotNumber;
        return rowColToMovementAction(state.skillRow, state.lastSkillSide === 'right' ? state.rightCol : state.leftCol, mouseMappings.skillRow, state.lastSkillSide === 'right' ? mouseMappings.rightCol : mouseMappings.leftCol).description('skill row ' + slotNumber);
    },
    "right col": function (match) {
        var slotNumber = parseInt(match[2]);
        state.rightCol = slotNumber;
        state.lastSkillSide = 'right';
        return rowColToMovementAction(state.skillRow, state.rightCol, mouseMappings.skillRow, mouseMappings.rightCol).description('right col ' + slotNumber);
    },
    "left col": function (match) {
        var slotNumber = parseInt(match[2]);
        state.leftCol = slotNumber;
        state.lastSkillSide = 'left';
        return rowColToMovementAction(state.skillRow, state.leftCol, mouseMappings.skillRow, mouseMappings.leftCol).description('left col ' + slotNumber);
    },

    "inv row": function (match) {
        var slotNumber = parseInt(match[1]);
        state.invRow = slotNumber;
        return rowColToMovementAction(state.invRow, state.invCol, mouseMappings.invRow, mouseMappings.invCol).description('inv row ' + slotNumber);
    },
    "inv col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.invCol = slotNumber;
        return rowColToMovementAction(state.invRow, state.invCol, mouseMappings.invRow, mouseMappings.invCol).description('inv col ' + slotNumber);
    },

    "stash row": function (match) {
        var slotNumber = parseInt(match[1]);
        state.stashRow = slotNumber;
        return rowColToMovementAction(state.stashRow, state.stashCol, mouseMappings.stashRow, mouseMappings.stashCol).description('stash row ' + slotNumber);
    },
    "stash col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.stashCol = slotNumber;
        return rowColToMovementAction(state.stashRow, state.stashCol, mouseMappings.stashRow, mouseMappings.stashCol).description('stash col ' + slotNumber);
    },

    "quest row": function (match) {
        var slotNumber = parseInt(match[1]);
        state.questRow = slotNumber;
        return rowColToMovementAction(state.questRow, state.questCol, mouseMappings.questRow, mouseMappings.questCol).description('quest row ' + slotNumber);
    },
    "quest col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.questCol = slotNumber;
        return rowColToMovementAction(state.questRow, state.questCol, mouseMappings.questRow, mouseMappings.questCol).description('quest col ' + slotNumber);
    },
    "quest speech": function () { return new MovementAction({ x: 321, y: 468 }).description('quest speech'); },

    "repair": function () { return new MovementAction({ x: 316, y: 464 }).description('repair'); },
    "repair all": function () { return new MovementAction({ x: 369, y: 464 }).description('repair all'); },
    "vendor row": function (match) {
        var slotNumber = parseInt(match[1]);
        state.vendorRow = slotNumber;
        return rowColToMovementAction(state.vendorRow, state.vendorCol, mouseMappings.vendorRow, mouseMappings.vendorCol).description('vendor row ' + slotNumber);
    },
    "vendor col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.vendorCol = slotNumber;
        return rowColToMovementAction(state.vendorRow, state.vendorCol, mouseMappings.vendorRow, mouseMappings.vendorCol).description('vendor col ' + slotNumber);
    },


    "cube row": function (match) {
        var slotNumber = parseInt(match[1]);
        state.cubeRow = slotNumber;
        return rowColToMovementAction(state.cubeRow, state.cubeCol, mouseMappings.cubeRow, mouseMappings.cubeCol).description('cube row ' + slotNumber);
    },
    "cube col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.cubeCol = slotNumber;
        return rowColToMovementAction(state.cubeRow, state.cubeCol, mouseMappings.cubeRow, mouseMappings.cubeCol).description('cube col ' + slotNumber);
    },
    "cube transmute": function () { return new MovementAction({ x: 239, y: 338 }).description('cube transmute'); },

    "orifice": function () { return new MovementAction({ x: 165, y: 170 }).description('orifice'); },
    "orifice ok": function () { return new MovementAction({ x: 137, y: 245 }).description('orifice ok'); },

    "inv slot": function (match) {
        var slot = match[2];
        switch(slot) {
            case "weapon":
                return new MovementAction({ x: 449, y: 164 }).description('inv ' + slot);
            case "offhand":
                return new MovementAction({ x: 678, y: 164 }).description('inv ' + slot);
            case "head":
                return new MovementAction({ x: 563, y: 95 }).description('inv ' + slot);
            case "neck":
                return new MovementAction({ x: 620, y: 108 }).description('inv ' + slot);
            case "chest":
                return new MovementAction({ x: 560, y: 180 }).description('inv ' + slot);
            case "gloves":
                return new MovementAction({ x: 446, y: 270 }).description('inv ' + slot);
            case "lring":
                return new MovementAction({ x: 506, y: 252 }).description('inv ' + slot);
            case "rring":
                return new MovementAction({ x: 620, y: 252 }).description('inv ' + slot);
            case "belt":
                return new MovementAction({ x: 560, y: 252 }).description('inv ' + slot);
            case "boots":
                return new MovementAction({ x: 678, y: 270 }).description('inv ' + slot);
            default:
                return null;
        }
    },
    "merc slot": function (match) {
        var slot = match[1];
        switch(slot) {
            case "weapon":
                return new MovementAction({ x: 128, y: 166 }).description('merc ' + slot);
            case "offhand":
                return new MovementAction({ x: 358, y: 166 }).description('merc ' + slot);
            case "head":
                return new MovementAction({ x: 242, y: 96 }).description('merc ' + slot);
            case "chest":
                return new MovementAction({ x: 242, y: 181 }).description('merc ' + slot);
            default:
                return null;
        }
    },

    "inv gold": function () { return new MovementAction({ x: 494, y: 463 }).description('inv gold'); },
    "stash gold": function () { return new MovementAction({ x: 165, y: 93 }).description('stash gold'); },

    "wp": function (match) {
        var slot = parseInt(match[1]);
        switch(slot) {
            case 1:
                return new MovementAction({ x: 112, y: 134 }).description('wp' + slot);
            case 2:
                return new MovementAction({ x: 112, y: 170 }).description('wp' + slot);
            case 3:
                return new MovementAction({ x: 112, y: 210 }).description('wp' + slot);
            case 4:
                return new MovementAction({ x: 112, y: 246 }).description('wp' + slot);
            case 5:
                return new MovementAction({ x: 112, y: 281 }).description('wp' + slot);
            case 6:
                return new MovementAction({ x: 112, y: 317 }).description('wp' + slot);
            case 7:
                return new MovementAction({ x: 112, y: 353 }).description('wp' + slot);
            case 8:
                return new MovementAction({ x: 112, y: 389 }).description('wp' + slot);
            case 9:
                return new MovementAction({ x: 112, y: 424 }).description('wp' + slot);
            default:
                return null;
        }
    },
    "wp tab": function (match) {
        var slot = parseInt(match[1]);
        switch(slot) {
            case 1:
                return new MovementAction({ x: 119, y: 80 }).description('wp tab' + slot);
            case 2:
                return new MovementAction({ x: 181, y: 80 }).description('wp tab' + slot);
            case 3:
                return new MovementAction({ x: 239, y: 80 }).description('wp tab' + slot);
            case 4:
                return new MovementAction({ x: 304, y: 80 }).description('wp tab' + slot);
            case 5:
                return new MovementAction({ x: 364, y: 80 }).description('wp tab' + slot);
            default:
                return null;
        }
    },

    "click": function (match) { return new MouseAction({ left: true }).setCount(match[7]).description(descriptionFormat('lclick', match[7])).enableGlobalContinuous(); },
    "rclick": function (match) { return new MouseAction({ right: true }).setCount(match[9]).description(descriptionFormat('rclick', match[9])).enableGlobalContinuous(); },
    "close": function (match) { return new Action('{Space}').setCount(match[2]).description(descriptionFormat('close', match[2])); },
    "enter": function (match) { return new Action('{Enter}').setCount(match[2]).description(descriptionFormat('enter', match[2])); },
    "number": function (match) { return new Action("{" + parseInt(match[1]) + "}").description('' + parseInt(match[1])); },
    "fkey": function (match) { return new Action("{F" + parseInt(match[3]) + "}").description('F' + parseInt(match[3])); },
    "numpad": function (match) { return new Action("{Numpad" + parseInt(match[1]) + "}").description('num' + parseInt(match[1])); },
    "run": function (match) { return new Action('{R}').setCount(match[2]).description(descriptionFormat('run', match[2])); },
    "swap": function (match) { return new Action('{W}').setCount(match[2]).description(descriptionFormat('swap', match[2])); },
    "left menu": function () {
        return new Action(null, { x: 142, y: 577, left: true }).description('left menu');
    },
    "right menu": function () { return new Action('S').description('right menu'); },
    "stats": function (match) { return new Action('{C}').setCount(match[2]).description(descriptionFormat('stats', match[2])); },
    "inv": function (match) { return new Action('{I}').setCount(match[2]).description(descriptionFormat('inv', match[2])); },
    "skills": function (match) { return new Action('{T}').setCount(match[2]).description(descriptionFormat('skills', match[2])); },
    "map": function (match) { return new Action('{Tab}').setCount(match[2]).description(descriptionFormat('map', match[2])); },
    "quests": function (match) { return new Action('{Q}').setCount(match[2]).description(descriptionFormat('quests', match[2])); },
    "merc": function (match) { return new Action('{O}').setCount(match[2]).description(descriptionFormat('merc', match[2])); },

    "social": function (match) {
        if (!match[2]) {
            return null;
        }
        var actionCount = toActionCount(match[2]);
        var action = new Action('{Down}'.repeat(actionCount) + '{Enter}').description(descriptionFormat('social', match[2])).setOverrideDelay(50);
        action.count = actionCount + 1;
        return action;
    },

    "bindskill": function (match) {
        var side = "right";
        if (match[7] && match[7].toLowerCase() === "left" || match[16] && match[16].toLowerCase() === "left") {
            side = "left";
        }
        var keyNum = match[5] || match[13];
        var row = parseInt(match[8] || match [14]);
        var col = parseInt(match[9] || match[15]);
        if (isNaN(row) || isNaN(col)) {
            return null;
        }
        return specialActions.BINDSKILLFACTORY(side, keyNum, row, col);
    }
};

var commandTypes = {
    'action': {
        minDelay: 5000
    },
    'mouseAction' : {
        minDelay: 100,
        startAction: actionMap["click"]
    },
    'movement': {
        minDelay: 500,
        startAction: actionMap["center"]
    }
};
Object.keys(commandTypes).forEach(function (type) {
    commandAggregator[type] = {};
});

function rowColToMovementAction(row, col, rowMappings, colMappings) {
    var rowIndex = rowMappings.length > row - 1 ? row - 1 : -1;
    var colIndex = colMappings.length > col - 1 ? col - 1 : -1;
    if (rowIndex === -1 || colIndex === -1) {
        return null;
    } else {
        return new MovementAction({ x: colMappings[colIndex], y: rowMappings[rowIndex] });
    }
}

function toActionCount(str, low, high) {
    low = (low === undefined) ? 1 : low;
    high = (high === undefined) ? 9 : high;
    if (str !== undefined && str !== null && str !== "") {
        var num = parseInt(str);
        if (num >= low && num <= high) {
            return num;
        }
        if (num >= high) {
            return high;
        }
        if (num <= low) {
            return low;
        }
    }
    return low;
}
function descriptionFormat(command, countStr) {
    var num = parseInt(countStr);
    return isNaN(num) || num === 0 ? command : command + ' ' + num;
}

function queueCommand(command, args) {
    var output = null;
    if (!command.match(regexFilter)) {
        if (!actionMap.hasOwnProperty(command)) {
            return output;
        }
        if (command.match(regexThrottle)) {
            var newTime = new Date().getTime();
            if (newTime - lastTime[command] < throttledCommandsDurationMap[command]) {
                return output;
            } else {
                lastTime[command] = newTime;
            }
        }
        var action = actionMap[command];
        if (action !== null) {
            var actionObject = action(args);
            var key = JSON.stringify(actionObject);
            var commandGroup = commandAggregator[actionObject.group];
            if (!commandGroup[key]) {
                var val = {
                    action: actionObject,
                    commandKey: command,
                    commandId: commandSequenceNumber++,
                    count: 1
                };
                commandGroup[key] = val;
            } else {
                commandGroup[key].count++;
            }
            output = commandGroup[key];
        }
    }
    return output;
}

function getMostPopularAction(type) {
    if (!commandAggregator.hasOwnProperty(type)) {
        return null;
    }
    var highestCount = 0;
    var current;
    var count;
    var out = null;
    var commandsForType = commandAggregator[type];
    var keys = Object.keys(commandsForType);
    for (var i = 0, len = keys.length; i < len; i++) {
        var current = commandsForType[keys[i]];
        count = current.count;
        if (count > highestCount) {
            highestCount = count;
            out = current;
        }
    }
    return out;
}

function clearCommandQueue(type) {
    if (!commandAggregator.hasOwnProperty(type)) {
        console.log('Attempt to clear queue with unknown type', type);
    } else {
        commandAggregator[type] = {};
    }
}

function executeAction(action, events) {
    var promises = [];
    if (action === specialActions.ESCAPE) {
        // escape is dangerous in d2, so we have a special script that executes it safely
        if (config.sendKey) {
            promises.push(exec('autohotkey ./app/esckeyd2.ahk'));
        }
    } else {
        if (action.key) {
            var repeatDelay = action.overrideDelay || config.keyRepeatDelay;
            if (config.sendKey) {
                promises.push(exec('autohotkey ./app/sendkey.ahk ' + action.key + ' ' + repeatDelay));
            }
        }
        if (action.mouse) {
            var repeatDelay = action.overrideDelay || config.mouseRepeatDelay;
            if (action.mouse.hasOwnProperty('x') && action.mouse.hasOwnProperty('y')) {
                state.mouseX = action.mouse.x;
                state.mouseY = action.mouse.y;
            }
            var x = state.mouseX;
            var y = state.mouseY;
            if (!action.mouse.left && !action.mouse.right) {
                if (config.sendKey) {
                    promises.push(exec('autohotkey ./app/movemouse.ahk ' + x + ' ' + y));
                }
            }
            if (action.mouse.left) {
                if (config.sendKey) {
                    promises.push(exec('autohotkey ./app/clickmouseat.ahk ' + x + ' ' + y + ' left ' + (action.mouse.count || '1') + ' ' + repeatDelay));
                }
            } else if (action.mouse.right) {
                if (config.sendKey) {
                    promises.push(exec('autohotkey ./app/clickmouseat.ahk ' + x + ' ' + y + ' right ' + (action.mouse.count || '1') + ' ' + repeatDelay));
                }
            }
        }
        if (action.stored) {
            // this is a way of casting an object into a promise (instead of checking for .then)
            promises.push(Promise.resolve(action.run(events)));
        }
    }
    return Promise.all(promises);
}

module.exports = {
    queueCommand: queueCommand,
    getMostPopularAction: getMostPopularAction,
    clearCommandQueue: clearCommandQueue,
    executeAction: executeAction,
    getCommandTypes: function () { return Object.keys(commandTypes); },
    getOptionsForType: function (type) { return commandTypes[type]; },
    getState: function () { return state; }
};
