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

Handler.prototype.createPlayer = function(msg, session, next) {
    next();
};