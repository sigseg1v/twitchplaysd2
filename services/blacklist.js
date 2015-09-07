var fs = require('fs');

var file = './data/blacklistUsers.json';

var blacklist = {};

loadBlacklist();

function saveBlacklist() {
    fs.writeFileSync(file, JSON.stringify(blacklist));
    return;
}

function loadBlacklist() {
    try {
        if (fs.existsSync(file)) {
            var loaded = JSON.parse(fs.readFileSync(file, 'utf8')) || {};
            Object.keys(loaded).forEach(function (k) {
                blacklist[k.toLowerCase()] = loaded[k];
            });
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
        if (username !== undefined && username !== null) {
            return !!blacklist[username.toLowerCase()];
        }
        return false;
    },
    add: function (username) {
        if (username !== undefined && username !== null) {
            var formatted = username.toLowerCase();
            blacklist[formatted] = true;
            saveBlacklist();
            return !!blacklist[formatted];
        }
        return false;
    },
    remove: function (username) {
        if (username !== undefined && username !== null) {
            var formatted = username.toLowerCase();
            blacklist[formatted] = false;
            saveBlacklist();
            return !!blacklist[formatted];
        }
        return false;
    }
}
