var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var userDao = require('../../../dao/userDao');
var bagDao = require('../../../dao/bagDao');
var consts = require('../../../consts/consts');
var channelUtil = require('../../../util/channelUtil');
var utils = require('../../../util/utils');
var async = require('async');

module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

Handler.prototype.doLogin = function(msg, session, next) {
    if(msg.uid){
        this.app.rpc.login.userRpc.userLogin(msg, session, function(err,player){
            //
            next(err,rtn);
            afterLogin(self.app, msg, session, player, next);
        });
    }else{
        this.app.rpc.login.userRpc.userCreate(msg, session, function(err,player){
            next(err,rtn);
            afterLogin(self.app, msg, session, player, next);
        });
    }
};

var afterLogin = function (app, msg, session, user, next) {
    async.waterfall([
            function(cb) {
                session.bind(user.uid, cb);
            },
            function(cb) {
                session.set('uid', user.uid);
                session.on('closed', onUserLeave);
                session.pushAll(cb);
            },
            function(cb) {
                app.rpc.club.Rpc.userEnter(session, {user:user}, cb);
                app.rpc.player.Rpc.userEnter(session, {uid:user.uid}, cb);
            }
        ],
        function(err) {
            if(err) {
                logger.error('fail to select role, ' + err.stack);
                next(null, {code: consts.MESSAGE.ERR});
                return;
            }
            next(null, {code: consts.MESSAGE.RES, user: user, player: player});
        });
};

var onUserLeave = function (session, reason) {
    if(!session || !session.uid) {
        return;
    }

    var rpc= pomelo.app.rpc;
    rpc.game.Rpc.userLeave(session, {reason: reason}, null);
    rpc.game.Rpc.userLeave(session, {reason: reason}, null);
};
