var irc = require('irc'),
printf = require('printf'),
keyHandler = require('./keyHandler.js'),
config = require('./config.js');

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

var commandRegex = new RegExp('^(' + Object.keys(config.commands).join('|') + ')$', 'i');

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
            logMessage = message.substring(0, 6).toLowerCase();
            //format log
            console.log(printf('%-' + maxName + 's % ' + maxCommand + 's',
                logFrom, logMessage));
        }

        // Should the message be sent the program?
        if (config.sendKey) {
            keyHandler.sendCommand(command, match);
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
