var irc = require('irc');
var printf = require('printf');
var keyHandler = require('./keyHandler.js');
var config = require('./config.js');
var OBSRemote = require('obs-remote');
var obs = new OBSRemote();
var Promise = require('bluebird');
var exec = Promise.promisify(require('child_process').exec);

var client = new irc.Client(config.server, config.nick, {
    channels: [config.channel],
    port: config.port || 6667,
    sasl: false,
    nick: config.nick,
    userName: config.nick,
    password: config.password,
    //This has to be false, since SSL in NOT supported by twitch IRC (anymore?)
    // see: http://help.twitch.tv/customer/portal/articles/1302780-twitch-irc
    secure: false,
    floodProtection: config.floodProtection || false,
    floodProtectionDelay: config.floodProtectionDelay || 100,
    autoConnect: false,
    autoRejoin: true
});

var commandRegexes = [];
Object.keys(config.commands).forEach(function (k) {
    var regexp = config.commands[k];
    commandRegexes.push({ re: regexp, command: k });
});

var streaming = false;
if (config.obsRemoteEnable) {
    var retries = 3;
    var retryNum = 1;
    obs.onAuthenticationSucceeded = function () {
        console.log('Authenticated with OBSRemote.');
        obs.getStreamingStatus(function(isStreaming) {
            streaming = isStreaming;
            console.log('Stream is currently', isStreaming ? 'LIVE' : 'OFF');
        });
    };
    obs.onConnectionOpened = function () {
        console.log('OBSRemote connection opened.');
    };
    obs.onAuthenticationFailed = function () {
        console.log('OBSRemote authentication failed.');
    };
    obs.onStreamStopped = function () {
        console.log('OBS Stream stopped.');
        streaming = false;
    };
    obs.onStreamStarted = function () {
        console.log('OBS Stream started.');
        streaming = true;
    };
    obs.onConnectionFailed = function () {
        if (retryNum >= retries) {
            console.log('OBSRemote connection failed. Not retrying.');
        } else {
            console.log('OBSRemote connection failed, retrying', retryNum++, 'of', retries);
            obs.connect(config.obsRemoteServer, config.obsRemotePw);
        }
    };
    obs.onConnectionClosed = function () {
        console.log('OBSRemote connection closed.');
    };
    obs.connect(config.obsRemoteServer, config.obsRemotePw);
    console.log('Connecting to OBSRemote...');
}

function isWindowAlive() {
    return exec('autohotkey ./app/windowalive.ahk');
}

function stopEverything() {
    if (streaming) {
        obs.toggleStream();
        streaming = false;
    }
}

client.addListener('message' + config.channel, function(from, message) {
    var match = null;
    var command = null;
    if (commandRegexes.some(function (item) {
        match = message.match(item.re);
        if (match) {
            command = item.command;
            return true;
        }
        return false;
    })) {
        if (config.printToConsole) {
            //format console output if needed
            var maxName = config.maxCharName,
            maxCommand = config.maxCharCommand,
            logFrom = from.substring(0, maxName),
            logMessage = message.substring(0, maxCommand);
            //format log
            console.log(printf('%-' + maxName + 's % ' + maxCommand + 's',
                logFrom, logMessage));
        }

        // Should the message be sent the program?
        if (config.sendKey) {
            keyHandler.queueCommand(command, match);
        }
    }
});

client.addListener('error', function(message) {
    console.log('error: ', message);
});

client.addListener('registered', function () {
    console.log('Connected!');
});

client.connect();
console.log('Connecting...');

function getAndExecuteCommand() {
    var command = keyHandler.getMostPopularCommand();
    if (command !== null) {
        console.log('executing action', command);
        keyHandler.clearCommandQueue();
        keyHandler.executeAction(command).finally(getAndExecuteCommand);
    } else {
        setTimeout(getAndExecuteCommand, 500);
    }
}
getAndExecuteCommand();
console.log('Listening for commands...');

function pollWindowAlive() {
    var promise = isWindowAlive();
    promise.then(function (result) {
        if (!result || result[0] !== '0') {
            console.log('Error: Window not found, closing stream and exiting.');
            stopEverything();
            process.exit(1);
        } else {
            setTimeout(pollWindowAlive, 5000);
        }
    });
    promise.error(function () {
        console.log('Error: Error in windowalive script, closing stream and exiting.');
        stopEverything();
        process.exit(1);
    });
}
pollWindowAlive();
