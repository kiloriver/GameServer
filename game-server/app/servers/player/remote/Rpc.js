ar pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var userDao = require('../../../dao/userDao');
var bagDao = require('../../../dao/bagDao');
var consts = require('../../../consts/consts');
var channelUtil = require('../../../util/channelUtil');
var utils = require('../../../util/utils');
var async = require('async');

module.exports = function(app) {
    return new Rpc(app);
};

var Rpc = function(app) {
    this.app = app;
};

Rpc.prototype.userEnter = function(session, msg, next) {
    next();
};