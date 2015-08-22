var nconf = require('nconf').argv().env().file({ file:'config.json' });

var commands = {
    "esc": new RegExp('^esc$'),

    "center": new RegExp('^center$', 'i'),
    "left": new RegExp('^left ?([1-3])?$', 'i'),
    "upleft": new RegExp('^upleft ?([1-3])?$', 'i'),
    "up": new RegExp('^up ?([1-3])?$', 'i'),
    "upright": new RegExp('^upright ?([1-3])?$', 'i'),
    "right": new RegExp('^right ?([1-3])?$', 'i'),
    "downright": new RegExp('^downright ?([1-3])?$', 'i'),
    "down": new RegExp('^down ?([1-3])?$', 'i'),
    "downleft": new RegExp('^downleft ?([1-3])?$', 'i'),

    "str": new RegExp('^str$', 'i'),
    "dex": new RegExp('^dex$', 'i'),
    "vit": new RegExp('^vit$', 'i'),
    "energy": new RegExp('^energy$', 'i'),

    "belt": new RegExp('^belt ?([1-4])$', 'i'),

    "tree tab": new RegExp('^tree ?tab ?([1-3])$', 'i'),
    "tree row": new RegExp('^tree ?row ?([1-6])$', 'i'),
    "tree col": new RegExp('^tree ?col ?([1-3])$', 'i'),

    "skill row": new RegExp('^skill ?row ?([1-5])$', 'i'),
    "right col": new RegExp('^right ?col ?([1-9]|10)$', 'i'),
    "left col": new RegExp('^left ?col ?([1-9]|10)$', 'i'),

    "inv row": new RegExp('^inv ?row ?([1-4])$', 'i'),
    "inv col": new RegExp('^inv ?col ?([1-9]|10)$', 'i'),

    "stash row": new RegExp('^stash ?row ?([1-8])$', 'i'),
    "stash col": new RegExp('^stash ?col ?([1-6])$', 'i'),

    "quest row": new RegExp('^quest ?row ?([1-2])$', 'i'),
    "quest col": new RegExp('^quest ?col ?([1-3])$', 'i'),
    "quest speech": new RegExp('^quest ?speech$', 'i'),

    "cube row": new RegExp('^cube ?row ?([1-4])$', 'i'),
    "cube col": new RegExp('^cube ?col ?([1-3])$', 'i'),
    "cube transmute": new RegExp('^cube ?transmute$', 'i'),

    "inv slot": new RegExp('^(inv|inventory) ?(weapon|offhand|head|neck|chest|gloves|lring|rring|belt|boots)$', 'i'),
    "merc slot": new RegExp('^merc ?(weapon|offhand|head|chest)$', 'i'),

    "inv gold": new RegExp('^inv ?gold$', 'i'),
    "stash gold": new RegExp('^stash ?gold$', 'i'),

    "wp": new RegExp('^wp ?([1-9])$', 'i'),
    "wp tab": new RegExp('^wp ?tab ?([1-5])$', 'i'),

    "click": new RegExp('^(click|leftclick|left click|lclick) ?([1-9])?$', 'i'),
    "rclick": new RegExp('^(rclick|right click|rightclick) ?([1-9])?$', 'i'),
    "close": new RegExp('^(close|clear) ?([1-9])?$', 'i'),
    "enter": new RegExp('^(enter) ?([1-9])?$', 'i'),
    "number": new RegExp('^([1-9])$', 'i'),
    "fkey": new RegExp('^(f[1-8])$', 'i'),
    "numpad": new RegExp('^num([0-7])$', 'i'),
    "run": new RegExp('^(run|walk) ?([1-9])?$', 'i'),
    "swap": new RegExp('^(swap) ?([1-9])?$', 'i'),
    "left menu": new RegExp('left ?menu$', 'i'),
    "right menu": new RegExp('^right ?(menu|menu|abilities|ability)$', 'i'),
    "stats": new RegExp('^(stats|char|character)([1-9])?$', 'i'),
    "inv": new RegExp('^(inv|inventory|bag|bags)([1-9])?$', 'i'),
    "skills": new RegExp('^(skill|skills|tree|skill ?tree|talents)([1-9])?$', 'i'),
    "map": new RegExp('^(map)([1-9])?$', 'i'),
    "quests": new RegExp('^(quests?)([1-9])?$', 'i'),
    "merc": new RegExp('^(merc)([1-9])?$', 'i'),

    "social": new RegExp('^(social|talk|gossip) ?([1-6])$', 'i'),
}

var username = process.env.TWITCH_USERNAME || nconf.get('TWITCH_USERNAME');
var oauth = process.env.TWITCH_OAUTH || nconf.get('TWITCH_OAUTH');
var channel = process.env.TWITCH_CHANNEL || nconf.get('TWITCH_CHANNEL');
var obsRemoteServer = process.env.OBS_REMOTE_SERVER || nconf.get('OBS_REMOTE_SERVER');
var obsRemotePw = process.env.OBS_REMOTE_PW || nconf.get('OBS_REMOTE_PW');
var os = process.env.CONFIG_OS || nconf.get('CONFIG_OS');
var programName = process.env.CONFIG_PROGRAM_NAME || nconf.get('CONFIG_PROGRAM_NAME');
var maxCharName = process.env.CONFIG_MAX_CHAR_NAME || nconf.get('CONFIG_MAX_CHAR_NAME');
var maxCharCommand = process.env.CONFIG_MAX_CHAR_COMMAND || nconf.get('CONFIG_MAX_CHAR_COMMAND');
var sendKey = process.env.CONFIG_SEND_KEY || nconf.get('CONFIG_SEND_KEY');
var serverIP = process.env.TWITCH_IP || nconf.get('TWITCH_IP');
var filteredCommands = process.env.CONFIG_FILTERED_COMMANDS || nconf.get('CONFIG_FILTERED_COMMANDS');
var throttledCommands = process.env.CONFIG_THROTTLED_COMMANDS || nconf.get('CONFIG_THROTTLED_COMMANDS');
var overlayHost = process.env.OVERLAY_HOST || nconf.get('OVERLAY_HOST');
var overlayPort = process.env.OVERLAY_PORT || nconf.get('OVERLAY_PORT');
var keyRepeatDelay = process.env.KEY_REPEAT_DELAY || nconf.get('KEY_REPEAT_DELAY');
var mouseRepeatDelay = process.env.MOUSE_REPEAT_DELAY || nconf.get('MOUSE_REPEAT_DELAY');
var gameLaunchPath = process.env.GAME_LAUNCH_PATH || nconf.get('GAME_LAUNCH_PATH');

var config = {
    // Either 'windows' or 'other'
    os: os || 'windows',

    // Title of the window of the program
    // Ex: 'Desmume' or 'VBA'
    programName: programName || 'VBA',

    gameLaunchPath: gameLaunchPath || '',

    // Ex: irc.twitch.tv or 199.9.252.26
    server: serverIP || 'irc.twitch.tv',
    // Your twitch username
    nick: username,
    // oauth token from www.twitchapps.com/tmi
    password: oauth,
    // name of channel
    channel: channel,

    obsRemoteEnable: !!(obsRemoteServer || obsRemotePw),
    obsRemoteServer: obsRemoteServer,
    // pw for http://www.obsremote.com
    obsRemotePw: obsRemotePw,

    // for sending data to the overlay server
    overlayConnectionEnable: !!(overlayHost || overlayPort),
    overlayHost: overlayHost || 'http://localhost',
    overlayPort: overlayPort || 3456,

    // If you want to print usernames/commands like in twitchplayspokemon
    printToConsole: true,
    // Maximum characters to show for a person's name in the console log
    maxCharName: maxCharName || 8,
    // Maximum characters to show for a command in the console log
    // Ex: left => left since only 4 char, democracy => democra
    maxCharCommand: maxCharCommand || 10,

    // If you need to filter the commands sent to the program
    // Ex: democracy/anarchy since they don't affect the program itself
    // Ex: ["democracy","anarchy"]
    filteredCommands: filteredCommands || [],

    // If you want to prevent people from using from command too often
    // Ex: { "esc": 30000, "start": 30000 }
    throttledCommands: throttledCommands || {},

    keyRepeatDelay: keyRepeatDelay || keyRepeatDelay === 0 ? keyRepeatDelay : 300,
    mouseRepeatDelay: mouseRepeatDelay || mouseRepeatDelay === 0 ? mouseRepeatDelay : 250,

    sendKey: sendKey,
    commands: commands
};

module.exports = config;
