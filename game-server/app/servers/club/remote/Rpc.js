var pomelo = require('pomelo');
var logger = require('club').getLogger(__filename);
var dataApi = require('../../util/dataApi');
var routor = require('../../util/routor');

module.exports = function(app) {
    return new clubRpc(app);
};

var clubRpc = function(app) {
    this.app = app;
};
clubRpc.prototype.userLeave = function (session,msg,next) {
    next();
};

clubRpc.prototype.userEnter = function (session,msg,next) {
    next();
};
