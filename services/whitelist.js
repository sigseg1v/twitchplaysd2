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
            superAdmins = JSON.parse(fs.readFileSync(superAdminsFile, 'utf8')) || {};
        }
    } catch (e) {
        console.log(e);
    }
    return superAdmins;
}

function loadWhitelist() {
    try {
        if (fs.existsSync(file)) {
            whitelist = JSON.parse(fs.readFileSync(file, 'utf8')) || {};
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
        return !!whitelist[username];
    },
    hasAddPermission: function (username) {
        return !!superAdmins[username];
    },
    add: function (username) {
        if (username !== undefined) {
            whitelist[username] = true;
            saveWhitelist();
        }
        return !!whitelist[username];
    },
    remove: function (username) {
        if (username !== undefined) {
            whitelist[username] = false;
            saveWhitelist();
        }
        return !!whitelist[username];
    }
}
