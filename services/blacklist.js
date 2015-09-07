var fs = require('fs');

var file = '../data/blacklistUsers.json';

var blacklist = {};

loadBlacklist();

function saveBlacklist() {
    fs.writeFileSync(file, JSON.stringify(blacklist));
    return;
}

function loadBlacklist() {
    try {
        if (fs.existsSync(file)) {
            blacklist = JSON.parse(fs.readFileSync(file, 'utf8')) || {};
        } else {
            saveBlacklist();
        }
    } catch (e) {
        console.log(e);
    }
    return blacklist;
}

module.exports = {
    isBlacklisted: function (username) {
        return !!blacklist[username];
    },
    add: function (username) {
        if (username !== undefined) {
            blacklist[username] = true;
            saveBlacklist();
        }
        return !!blacklist[username];
    },
    remove: function (username) {
        if (username !== undefined) {
            blacklist[username] = false;
            saveBlacklist();
        }
        return !!blacklist[username];
    }
}
