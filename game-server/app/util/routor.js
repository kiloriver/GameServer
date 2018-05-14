var Code = require('./code');
var dispatcher = require('../../../util/dispatcher');
//
var exp = module.exports;
exp.club = function(session, msg, app, cb) {
    var serverId = session.get('club');
    if(!serverId) {
        var clubid = msg.clubid;
        if(clubid){
            var clubs = app.getServersByType('club');
            if(!clubs || clubs.length === 0) {
                next(null, {code: Code.CLUB.FA_NO_CLUB_AVAILABLE});
                return;
            }
            var res = dispatcher.dispatch(clubid, clubs);
            session.set('club',res);
            next(null, {code: Code.OK, host: res.host, port: res.clientPort});

        }else{
            cb(new Error('can not find server info for type: ' + msg.serverType));

        }
    }

    cb(null, serverId);
};

exp.player = function(session, msg, app, cb) {
    var serverId = session.get('player');

    if(!serverId) {
        var uid = msg.uid;
        if(uid){
            var players = app.getServersByType('player');
            if(!players || players.length === 0) {
                next(null, {code: Code.PLAYER.FA_NO_PLAYER_AVAILABLE});
                return;
            }
            var res = dispatcher.dispatch(uid, players);
            session.set('player',res);
            next(null, {code: Code.OK, host: res.host, port: res.clientPort});

        }else{
            cb(new Error('can not find server info for type: ' + msg.serverType));

        }
    }

    cb(null, serverId);
};

exp.game = function(session, msg, app, cb) {
    var serverId = session.get('game');

    if(!serverId) {
        var tableid = msg.tableid;
        if(tableid){
            var players = app.getServersByType('game');
            if(!players || players.length === 0) {
                next(null, {code: Code.PLAYER.FA_NO_PLAYER_AVAILABLE});
                return;
            }
            var res = dispatcher.dispatch(uid, players);
            session.set('game',res);
            next(null, {code: Code.OK, host: res.host, port: res.clientPort});

        }else{
            cb(new Error('can not find server info for type: ' + msg.serverType));

        }
    }

    cb(null, serverId);
};

exp.connector = function(session, msg, app, cb) {
    if(!session) {
        cb(new Error('fail to route to connector server for session is empty'));
        return;
    }

    if(!session.frontendId) {
        cb(new Error('fail to find frontend id in session'));
        return;
    }

    cb(null, session.frontendId);
};
exp.login = function(session,msg,app,cb){
    var serverId = session.get('login');
    if(serverId){
        cb(null, serverId);
        return;
    }

    var logins = app.getServersByType('login');
    if(!logins || logins.length === 0) {
        cb(null, {code: Code.LOGIN.FA_NO_LOGIN_AVAILABLE});
        return;
    }
    var res = null;
    var uid = msg.uid;
    if(!uid) {
        var r = (Math.floor(Math.random() * 1000));
        res = logins[ r % logins.length];
    }else{
        res = dispatcher.dispatch(uid, logins);
    }

    session.set('login',res);
    cb(null, {code: Code.OK, host: res.host, port: res.clientPort});




};