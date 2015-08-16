require('string.prototype.repeat'); // polyfill

var exec = require('child_process').exec,
config = require('./config.js'),
lastTime = {},
windowID = 'unfilled',
throttledCommands = config.throttledCommands,
regexThrottle = new RegExp('^(' + throttledCommands.join('|') + ')$', 'i'),
regexFilter = new RegExp('^(' + config.filteredCommands.join('|') + ')$', 'i');

for (var i = 0; i < throttledCommands.length; i++) {
    lastTime[throttledCommands[i]] = new Date().getTime();
}

function setWindowID() {
    if (config.os === 'other' & windowID === 'unfilled') {
        exec('xdotool search --onlyvisible --name ' + config.programName, function(error, stdout) {
            windowID = stdout.trim();
            // console.log(key, windowID);
        });
    }
}

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
    "center": function () { return { mouse: { x: 400, y: 300 } }; },
    "left": function () { return { mouse: { x: 360, y: 300 }, key: '{Left}' }; },
    "upleft": function () { return { mouse: { x: 360, y: 260 } }; },
    "up": function () { return { mouse: { x: 400, y: 260 }, key: '{Up}' }; },
    "upright": function () { return { mouse: { x: 440, y: 260 } }; },
    "right": function () { return { mouse: { x: 440, y: 300 }, key: '{Right}' }; },
    "downright": function () { return { mouse: { x: 440, y: 340 } }; },
    "down": function () { return { mouse: { x: 400, y: 340 }, key: '{Down}' }; },
    "downleft": function () { return { mouse: { x: 360, y: 340 } }; },

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
        var index = mouseMappings.treeTab.indexOf(slotNumber);
        if (index !== -1) {
            return { mouse: { x: x, y: mouseMappings.treeTab[index] } };
        } else {
            return {};
        }
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
        var slot = match[1];
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
};

function rowColToState(row, col, rowMappings, colMappings) {
    var rowIndex = rowMappings.indexOf(row);
    var colIndex = colMappings.indexOf(col);
    if (rowIndex === -1 || colIndex === -1) {
        return {};
    } else {
        return { mouse: { x: colMappings[colIndex], y: rowMappings[rowIndex] } };
    }
}

function toActionCount(str) {
    if (str !== undefined && str !== null && str !== "") {
        var num = parseInt(str);
        if (num >= 1 && num <= 9) {
            return num;
        }
    }
    return 1;
}

function sendCommand(command, args) {
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
        var actionResult = action(args);
        if (actionResult.hasOwnProperty('key')) {
            //if xdotool is installed
            if (config.os === 'other') {
                //Send to preset window under non-windows systems
                exec('xdotool key --window ' + windowID + ' --delay ' + config.delay + ' ' + actionResult.key);
            } else {
                exec('autohotkey ./app/sendkey.ahk ' + actionResult.key);
            }
        }
        if (actionResult.hasOwnProperty('mouse')) {
            if (actionResult.mouse.hasOwnProperty('x') && actionResult.mouse.hasOwnProperty('y')) {
                state.mouseX = actionResult.mouse.x;
                state.mouseY = actionResult.mouse.y;
            }
            var x = state.mouseX;
            var y = state.mouseY;
            if (!actionResult.mouse.left && !actionResult.mouse.right) {
                exec('autohotkey ./app/movemouse.ahk ' + x + ' ' + y);
            } else {
                if (actionResult.mouse.left) {
                    exec('autohotkey ./app/clickmouseat.ahk ' + x + ' ' + y + ' left ' + (actionResult.mouse.count || '1'));
                } else if (actionResult.mouse.right) {
                    exec('autohotkey ./app/clickmouseat.ahk ' + x + ' ' + y + ' right ' + (actionResult.mouse.count || '1'));
                }
            }
        }
    }
}

//Only actually does something when not running under windows.
setWindowID();

exports.sendCommand = sendCommand;
