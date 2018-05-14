var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var userDao = require('../../../dao/userDao');
var bagDao = require('../../../dao/bagDao');
var consts = require('../../../consts/consts');
var channelUtil = require('../../../util/channelUtil');
var utils = require('../../../util/utils');
var async = require('async');

module.exports = function(app) {
    return new userRpc(app);
};

var userRpc = function(app) {
    this.app = app;
};

userRpc.prototype.userCreate = function(msg, session, next) {
    var uid = session.uid, roleId = msg.roleId, name = msg.name;
    var self = this;

    userDao.getPlayerByName(name, function(err, player) {
        if (player) {
            next(null, {code: consts.MESSAGE.ERR});
            return;
        }

        userDao.createPlayer(uid, name, roleId, function(err, player){
            if(err) {
                logger.error('[register] fail to invoke createPlayer for ' + err.stack);
                next(null, {code: consts.MESSAGE.ERR, error:err});
            }else{
                async.parallel([
                    function(callback) {
                        equipDao.createEquipments(player.id, callback);
                    },
                    function(callback) {
                        bagDao.createBag(player.id, callback);
                    },
                    function(callback) {
                        player.learnSkill(1, callback);
                    }],
                function(err, results) {
                    if (err) {
                        logger.error('learn skill error with player: ' + JSON.stringify(player.strip()) + ' stack: ' + err.stack);
                        next(null, {code: consts.MESSAGE.ERR, error:err});
                        return;
                    }else{
                        next(null, {code: consts.MESSAGE.ERR, player:results});
                    }
                });
            }
        });
    });
};

        userRpc.prototype.userLogin = function(msg, session, next) {
    next();
};