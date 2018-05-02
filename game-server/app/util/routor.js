var dispatcher = require('./dispatcher');
//
var routor = module.exports;
routor.prototype.DirectRoute = function (serverid, msg, app, cb) {
    cb(null, serverid);
}

routor.prototype.RandRoute = function (sType, session) {
    var authId = session.get(sType);
    if (!authId) {
        authId = app.get(sType + "Id");
        if (!authId) {
            var auths = app.getServersByType(sType);
            authId = auths[(Math.floor(Math.random() * 1000)) % auths.length].id;
        }
    }
    return authId;
}

routor.prototype.SessionRoute = function (sType) {
    return function (session, msg, app, cb) {
        var serverid = session.get(sType);
        if (!serverid
            && app.serverType == "pkcon"
            && msg.method == "forwardMessage"
            && msg.args[0].route == "pkroom.handler.httpJoinGame") {

            var body = msg.args[0].body;

            session.bind(body.para.uid);
            msg.args[0].uid = body.para.uid;
            session.set(sType, body.para.createPara.pkroom);
            serverid = session.get(sType);

            session.push(sType, function () {cb(null, serverid);});
            return;
        }
        cb(null, serverid);
    }
}

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

 routor.protobuf.DirectRoute = function(serverid, msg, app, cb) {
    cb(null, serverid);
}

 routor.protobuf.RandRoute = function(sType, session) {
    var authId = session.get(sType);
    if (!authId) {
        authId = app.get(sType + "Id");
        if (!authId) {
            var auths = app.getServersByType(sType);
            authId = auths[(Math.floor(Math.random() * 1000)) % auths.length].id;
        }
    }
    return authId;
}

 routor.protobuf.SessionRoute = function(sType) {
    return function (session, msg, app, cb) {
        var serverid = session.get(sType);
        if (!serverid && app.serverType == "pkcon" && msg.method == "forwardMessage" && msg.args[0].route == "pkroom.handler.httpJoinGame") {
            var body = msg.args[0].body;
            session.bind(body.para.uid);
            msg.args[0].uid = body.para.uid;
            session.set(sType, body.para.createPara.pkroom);
            serverid = session.get(sType);
            session.push(sType, function () {
                cb(null, serverid);
            });
            return;
        }
        cb(null, serverid);
    }
}