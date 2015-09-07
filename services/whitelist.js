var fs = require('fs');

var file = './data/specialCommandWhitelistUsers.json';
var superAdminsFile = './data/superAdmins.json';

var whitelist = {};
var superAdmins = {};

loadSuperAdmins();
loadWhitelist();

function saveWhitelist() {
    fs.writeFileSync(file, JSON.stringify(whitelist));
    return;
}

function loadSuperAdmins() {
    try {
        if (fs.existsSync(file)) {
            var loaded = JSON.parse(fs.readFileSync(superAdminsFile, 'utf8')) || {};
            Object.keys(loaded).forEach(function (k) {
                superAdmins[k.toLowerCase()] = loaded[k];
            });
        }
    } catch (e) {
        console.log(e);
    }
    return superAdmins;
}

function loadWhitelist() {
    try {
        if (fs.existsSync(file)) {
            var loaded = JSON.parse(fs.readFileSync(file, 'utf8')) || {};
            Object.keys(loaded).forEach(function (k) {
                whitelist[k.toLowerCase()] = loaded[k];
            });
        } else {
            saveWhitelist();
        }
    } catch (e) {
        console.log(e);
    }
    return whitelist;
}

module.exports = {
    isWhitelisted: function (username) {
        if (username !== undefined && username !== null) {
            return !!whitelist[username.toLowerCase()];
        }
        return false;
    },
    hasAddPermission: function (username) {
        if (username !== undefined && username !== null) {
            return !!superAdmins[username.toLowerCase()];
        }
        return false;
    },
    add: function (username) {
        if (username !== undefined && username !== null) {
            var formatted = username.toLowerCase();
            whitelist[formatted] = true;
            saveWhitelist();
            return !!whitelist[formatted];
        }
        return false;
    },
    remove: function (username) {
        if (username !== undefined && username !== null) {
            var formatted = username.toLowerCase();
            whitelist[formatted] = false;
            saveWhitelist();
            return !!whitelist[formatted];
        }
        return false;
    }
}
