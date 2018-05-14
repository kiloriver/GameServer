var pomelo = require('pomelo');
var logger = require('club').getLogger(__filename);
var dataApi = require('../../util/dataApi');
var routor = require('../../util/routor');

module.exports = function(app) {
    return new gameRpc(app);
};

var gameRpc = function(app) {
    this.app = app;
};

game.prototype.userLeave = function (session,msg,next) {
    next();
}