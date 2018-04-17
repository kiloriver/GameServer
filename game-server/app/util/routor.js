var routor = module.exports;
var dispatcher = require('./dispatcher');

routor.games = function(session, msg, app, cb) {
    var gameServers = app.getServersByType('games');

    if(!gameServers || gameServers.length === 0) {
        cb(new Error('can not find chat servers.'));
        return;
    }

    var res = dispatcher.dispatch(session.get('rid'), gameServers);

    cb(null, res.id);
};

routor.center = function(session, msg, app, cb) {
    var centerServers = app.getServersByType('center');

    if(!centerServers || centerServers.length === 0) {
        cb(new Error('can not find chat servers.'));
        return;
    }

    var res = dispatcher.dispatch(session.get('rid'), centerServers);

    cb(null, res.id);
};

routor.player = function(session, msg, app, cb) {
    var playerServers = app.getServersByType('player');

    if(!playerServers || playerServers.length === 0) {
        cb(new Error('can not find chat servers.'));
        return;
    }

    var res = dispatcher.dispatch(session.get('rid'), playerServers);

    cb(null, res.id);
};

routor.lobby = function(session, msg, app, cb) {
    var lobbyServers = app.getServersByType('lobby');

    if(!lobbyServers || lobbyServers.length === 0) {
        cb(new Error('can not find lobby servers.'));
        return;
    }

    var res = dispatcher.dispatch(session.get('rid'), lobbyServers);

    cb(null, res.id);
};