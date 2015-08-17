require('string.prototype.repeat'); // polyfill
var Promise = require('bluebird');
var exec = Promise.promisify(require('child_process').exec);
var config = require('./config.js');
var lastTime = {},
windowID = 'unfilled',
throttledCommands = config.throttledCommands,
regexThrottle = new RegExp('^(' + throttledCommands.join('|') + ')$', 'i'),
regexFilter = new RegExp('^(' + config.filteredCommands.join('|') + ')$', 'i');

for (var i = 0; i < throttledCommands.length; i++) {
    lastTime[throttledCommands[i]] = new Date().getTime();
}

function setWindowID() {
    if (config.os === 'other' && windowID === 'unfilled') {
        exec('xdotool search --onlyvisible --name ' + config.programName).then(function(stdout) {
            windowID = stdout.trim();
            // console.log(key, windowID);
        });
    }
}

var commandAggregator = {};

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

    questRow: [150,250],
    questCol: [141,239,335],

    cubeRow: [215,242,272,301],
    cubeCol: [213,240,270]
};

var state = {
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

    cubeRow: 1,
    cubeCol: 1
};

var actionMap = {
    "center": function () { return { mouse: { x: 400, y: 282 } }; },
    "left": function (match) { return { mouse: { x: 360 - (toActionCount(match[1], 0, 3) * 50), y: 282 }, key: '{Left}' }; },
    "upleft": function (match) { return { mouse: { x: 360 - (toActionCount(match[1], 0, 3) * 50), y: 242 - (toActionCount(match[1], 0, 3) * 50) } }; },
    "up": function (match) { return { mouse: { x: 400, y: 242 - (toActionCount(match[1], 0, 3) * 50) }, key: '{Up}' }; },
    "upright": function (match) { return { mouse: { x: 440 + (toActionCount(match[1], 0, 3) * 50), y: 242 - (toActionCount(match[1], 0, 3) * 50) } }; },
    "right": function (match) { return { mouse: { x: 440 + (toActionCount(match[1], 0, 3) * 50), y: 282 }, key: '{Right}' }; },
    "downright": function (match) { return { mouse: { x: 440 + (toActionCount(match[1], 0, 3) * 50), y: 322 + (toActionCount(match[1], 0, 3) * 50) } }; },
    "down": function (match) { return { mouse: { x: 400, y: 322 + (toActionCount(match[1], 0, 3) * 50) }, key: '{Down}' }; },
    "downleft": function (match) { return { mouse: { x: 360 - (toActionCount(match[1], 0, 3) * 50), y: 322 + (toActionCount(match[1], 0, 3) * 50) } }; },

    "str": function () { return { mouse: { x: 220, y: 150 } }; },
    "dex": function () { return { mouse: { x: 220, y: 215 } }; },
    "vit": function () { return { mouse: { x: 220, y: 300 } }; },
    "energy": function () { return { mouse: { x: 220, y: 360 } }; },

    'belt': function (match) {
        var slotNumber = parseInt(match[1]);
        if (slotNumber === 1 || slotNumber === 2 || slotNumber === 3 || slotNumber === 4) {
            return { key: "" + slotNumber };
        } else {
            return {};
        }
    },

    "tree tab": function (match) {
        var x = 670;
        var slotNumber = parseInt(match[1]);
        if (mouseMappings.treeTab.length > slotNumber - 1) {
            var index = slotNumber - 1;
            return { mouse: { x: x, y: mouseMappings.treeTab[index] } };
        }
        return {};
    },
    "tree row": function (match) {
        var slotNumber = parseInt(match[1]);
        state.treeRow = slotNumber;
        return rowColToState(state.treeRow, state.treeCol, mouseMappings.treeRow, mouseMappings.treeCol);
    },
    "tree col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.treeCol = slotNumber;
        return rowColToState(state.treeRow, state.treeCol, mouseMappings.treeRow, mouseMappings.treeCol);
    },

    "skill row": function (match) {
        var slotNumber = parseInt(match[1]);
        state.skillRow = slotNumber;
        return rowColToState(state.skillRow, state.lastSkillSide === 'right' ? state.rightCol : state.leftCol, mouseMappings.skillRow, state.lastSkillSide === 'right' ? mouseMappings.rightCol : mouseMappings.leftCol);
    },
    "right col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.treeRow = slotNumber;
        state.lastSkillSide = 'right';
        return rowColToState(state.skillRow, state.rightCol, mouseMappings.skillRow, mouseMappings.rightCol);
    },
    "left col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.treeRow = slotNumber;
        state.lastSkillSide = 'left';
        return rowColToState(state.skillRow, state.leftCol, mouseMappings.skillRow, mouseMappings.leftCol);
    },

    "inv row": function (match) {
        var slotNumber = parseInt(match[1]);
        state.invRow = slotNumber;
        return rowColToState(state.invRow, state.invCol, mouseMappings.invRow, mouseMappings.invCol);
    },
    "inv col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.invCol = slotNumber;
        return rowColToState(state.invRow, state.invCol, mouseMappings.invRow, mouseMappings.invCol);
    },

    "stash row": function (match) {
        var slotNumber = parseInt(match[1]);
        state.stashRow = slotNumber;
        return rowColToState(state.stashRow, state.stashCol, mouseMappings.stashRow, mouseMappings.stashCol);
    },
    "stash col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.stashCol = slotNumber;
        return rowColToState(state.stashRow, state.stashCol, mouseMappings.stashRow, mouseMappings.stashCol);
    },

    "quest row": function (match) {
        var slotNumber = parseInt(match[1]);
        state.questRow = slotNumber;
        return rowColToState(state.questRow, state.questCol, mouseMappings.questRow, mouseMappings.questCol);
    },
    "quest col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.questCol = slotNumber;
        return rowColToState(state.questRow, state.questCol, mouseMappings.questRow, mouseMappings.questCol);
    },
    "quest speech": function () { return { mouse: { x: 321, y: 468 } }; },

    "cube row": function (match) {
        var slotNumber = parseInt(match[1]);
        state.cubeRow = slotNumber;
        return rowColToState(state.cubeRow, state.cubeCol, mouseMappings.cubeRow, mouseMappings.cubeCol);
    },
    "cube col": function (match) {
        var slotNumber = parseInt(match[1]);
        state.cubeCol = slotNumber;
        return rowColToState(state.cubeRow, state.cubeCol, mouseMappings.cubeRow, mouseMappings.cubeCol);
    },
    "cube transmute": function () { return { mouse: { x: 239, y: 338 } }; },

    "inv slot": function (match) {
        var slot = match[2];
        switch(slot) {
            case "weapon":
                return { mouse: { x: 449, y: 164 } };
            case "offhand":
                return { mouse: { x: 678, y: 164 } };
            case "head":
                return { mouse: { x: 563, y: 95 } };
            case "neck":
                return { mouse: { x: 620, y: 108 } };
            case "chest":
                return { mouse: { x: 560, y: 180 } };
            case "gloves":
                return { mouse: { x: 446, y: 270 } };
            case "lring":
                return { mouse: { x: 506, y: 252 } };
            case "rring":
                return { mouse: { x: 620, y: 252 } };
            case "belt":
                return { mouse: { x: 560, y: 252 } };
            case "boots":
                return { mouse: { x: 678, y: 270 } };
            default:
                return {};
        }
    },
    "merc slot": function (match) {
        var slot = match[1];
        switch(slot) {
            case "weapon":
                return { mouse: { x: 128, y: 166 } };
            case "offhand":
                return { mouse: { x: 358, y: 166 } };
            case "head":
                return { mouse: { x: 242, y: 96 } };
            case "chest":
                return { mouse: { x: 242, y: 181 } };
            default:
                return {};
        }
    },

    "inv gold": function () { return { mouse: { x: 494, y: 463 } }; },
    "stash gold": function () { return { mouse: { x: 165, y: 93 } }; },

    "wp": function (match) {
        var slot = parseInt(match[1]);
        switch(slot) {
            case 1:
                return { mouse: { x: 112, y: 134 } };
            case 2:
                return { mouse: { x: 112, y: 170 } };
            case 3:
                return { mouse: { x: 112, y: 210 } };
            case 4:
                return { mouse: { x: 112, y: 246 } };
            case 5:
                return { mouse: { x: 112, y: 281 } };
            case 6:
                return { mouse: { x: 112, y: 317 } };
            case 7:
                return { mouse: { x: 112, y: 353 } };
            case 8:
                return { mouse: { x: 112, y: 389 } };
            case 9:
                return { mouse: { x: 112, y: 424 } };
            default:
                return {};
        }
    },
    "wp tab": function (match) {
        var slot = parseInt(match[1]);
        switch(slot) {
            case 1:
                return { mouse: { x: 119, y: 80 } };
            case 2:
                return { mouse: { x: 181, y: 80 } };
            case 3:
                return { mouse: { x: 239, y: 80 } };
            case 4:
                return { mouse: { x: 304, y: 80 } };
            case 5:
                return { mouse: { x: 364, y: 80 } };
            default:
                return {};
        }
    },

    "click": function (match) { return { mouse: { left: true, count: toActionCount(match[2]) } }; },
    "rclick": function (match) { return { mouse: { right: true, count: toActionCount(match[2]) } }; },
    "close": function (match) { return { key: match[2] ? '{Space}'.repeat(toActionCount(match[2])) : '{Space}' }; },
    "enter": function (match) { return { key: match[2] ? '{Enter}'.repeat(toActionCount(match[2])) : '{Enter}' }; },
    "number": function (match) { return { key: "{" + parseInt(match[1]) + "}" }; },
    "fkey": function (match) { return { key: "{F" + parseInt(match[1]) + "}" }; },
    "numpad": function (match) { return { key: "{Numpad" + parseInt(match[1]) + "}" }; },
    "run": function (match) { return { key: match[2] ? '{R}'.repeat(toActionCount(match[2])) : '{R}' }; },
    "swap": function (match) { return { key: match[2] ? '{W}'.repeat(toActionCount(match[2])) : '{W}' }; },
    "left menu": function () {
        return { mouse: { x: 142, y: 577, left: true } };
    },
    "right menu": function () { return { key: 'S' }; },
    "stats": function (match) { return { key: match[2] ? '{C}'.repeat(toActionCount(match[2])) : '{C}' }; },
    "inv": function (match) { return { key: match[2] ? '{I}'.repeat(toActionCount(match[2])) : '{I}' }; },
    "skills": function (match) { return { key: match[2] ? '{T}'.repeat(toActionCount(match[2])) : '{T}' }; },
    "map": function (match) { return { key: match[2] ? '{Tab}'.repeat(toActionCount(match[2])) : '{Tab}' }; },
    "quests": function (match) { return { key: match[2] ? '{Q}'.repeat(toActionCount(match[2])) : '{Q}' }; },
    "merc": function (match) { return { key: match[2] ? '{O}'.repeat(toActionCount(match[2])) : '{O}' }; },

    "social": function (match) { return match[2] ? { key: '{Down}'.repeat(toActionCount(match[2])) + '{Enter}' } : {}; },
};

function rowColToState(row, col, rowMappings, colMappings) {
    var rowIndex = rowMappings.length > row - 1 ? row - 1 : -1;
    var colIndex = colMappings.length > col - 1 ? col - 1 : -1;
    if (rowIndex === -1 || colIndex === -1) {
        return {};
    } else {
        return { mouse: { x: colMappings[colIndex], y: rowMappings[rowIndex] } };
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
    }
    return low;
}

function queueCommand(command, args) {
    //if doesn't match the filtered words
    if (!command.match(regexFilter)) {
        if (!actionMap.hasOwnProperty(command)) {
            return;
        }
        if (command.match(regexThrottle)) {
            var newTime = new Date().getTime();
            if (newTime - lastTime[command] < config.timeToWait) {
                return ;
            } else {
                lastTime[command] = newTime;
            }
        }
        var action = actionMap[command];
        var actionPayload = action(args);
        var key = JSON.stringify(actionPayload);
        if (!commandAggregator[key]) {
            var val = {
                payload: actionPayload,
                count: 1
            };
            commandAggregator[key] = val;
        } else {
            commandAggregator[key].count++;
        }

        executeAction(actionPayload);
    }
}

function getMostPopularCommand() {
    var highestCount = 0;
    var current;
    var count;
    var payload = null;
    var keys = Object.keys(commandAggregator);
    for (var i = 0, len = keys.length; i < len; i++) {
        var current = commandAggregator[keys[i]];
        count = current.count;
        if (count > highestCount) {
            highestCount = count;
            payload = current.payload;
        }
    }
    return payload;
}

function clearCommandQueue() {
    commandAggregator = {};
}

function executeAction(action) {
    var promises = [];
    if (action.hasOwnProperty('key')) {
        //if xdotool is installed
        if (config.os === 'other') {
            //Send to preset window under non-windows systems
            promises.push(exec('xdotool key --window ' + windowID + ' --delay ' + config.delay + ' ' + action.key));
        } else {
            promises.push(exec('autohotkey ./app/sendkey.ahk ' + action.key));
        }
    }
    if (action.hasOwnProperty('mouse')) {
        if (action.mouse.hasOwnProperty('x') && action.mouse.hasOwnProperty('y')) {
            state.mouseX = action.mouse.x;
            state.mouseY = action.mouse.y;
        }
        var x = state.mouseX;
        var y = state.mouseY;
        if (!action.mouse.left && !action.mouse.right) {
            promises.push(exec('autohotkey ./app/movemouse.ahk ' + x + ' ' + y));
        } else {
            if (action.mouse.left) {
                promises.push(exec('autohotkey ./app/clickmouseat.ahk ' + x + ' ' + y + ' left ' + (action.mouse.count || '1')));
            } else if (action.mouse.right) {
                promises.push(exec('autohotkey ./app/clickmouseat.ahk ' + x + ' ' + y + ' right ' + (action.mouse.count || '1')));
            }
        }
    }
    return Promise.all(promises);
}

//Only actually does something when not running under windows.
setWindowID();

module.exports = {
    queueCommand: queueCommand,
    getMostPopularCommand: getMostPopularCommand,
    clearCommandQueue: clearCommandQueue,
    executeAction: executeAction
};
