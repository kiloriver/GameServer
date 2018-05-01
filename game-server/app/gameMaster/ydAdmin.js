module.exports = function (opts) {
    return new Module(opts);
};

var httpClient = require("./httpClient")(null);
var exec = require('child_process').exec;
var fs = require('fs');
var heapdump = require('heapdump');
var gameLog = [];

var logger = require("pomelo-logger").getLogger('pomelo', __filename);

function GLog(app, log) {
    app.FileWork(gameLog, __dirname + "/log.txt", log)
}

var moduleId = "ydadmin";
module.exports.moduleId = moduleId;


function httpUpdatePlayer(app, uid, update, serverId, cb) {
    //console.info('http in before ' + JSON.stringify({uid:uid, update: update, serverId:serverId}));
    var server = app.GetServerBuyUid("pkplayer", uid);
    httpClient.postJson("UpdatePlayer", {uid: uid, update: update}, server.port + 1000, server.host, cb);
}

var addMoneyTime = {};

var maxMemberID = -1;

function Module(opts) {
    this.app = opts.app;

    this.interval = 60;//second
    this.type = 'push';

    this.report = {};

    console.error('registerAdmin ' + this.app.serverId);

    var app = this.app;
    if (!app.mongoClient && app.isMaster()) {
        var url = 'mongodb://' + app.getMaster().host + ':27017/' + app.getMaster().id;
        //  var url = 'mongodb://192.168.0.49:27017/' + app.getMaster().id;
        if (app.getMaster().mdbUrl) url = app.getMaster().mdbUrl;

        /// 添加一个用于本地启动调试服务器时的数据库配置, 如果本地系统配置了 环境变量 MONGO-DEV = mongodb://username:password@host:port/dbname,
        /// 添加使用环境变量来切换mongodb的配置,
        /// 环境变量的格式为 MONGO_DEV 代表 这是dev环境的mongo数据库地址, 对应stage为 MONGO_STAGE
        /// 默认配置还是走的 master.json 内的 host port 和id, 使用这个代码是为了更加方便本地机器的调试,
        /// by 丁国峰, 如果不明白该代码的用处 请勿乱配环境变量;
        if (process.env["MONGO_" + app.env.toUpperCase()]) {
            logger.warn("use mongo configure %s by system env MONGO_%s", process.env["MONGO_" + app.env.toUpperCase()], app.env.toUpperCase());
            url = process.env["MONGO_" + app.env.toUpperCase()];
        }
        require('mongodb').MongoClient.connect(url, {server: {poolSize: 3, auto_reconnect: true}},
            function (er, db) {
                //GLog(app, ["connect to mongo ", er]);
                if (er) {
                    logger.error('mongodb connect to %s failed by %s', url, er.message);
                    return;
                }
                logger.debug("mongodb connect to %s success.", url);
                app.mongoClient = db;

                function max(table, fd, minVal, cb) {
                    var rtn = minVal;
                    var sortPara = {};
                    sortPara[fd] = -1;
                    var cursor = db.collection(table).find().sort(sortPara).limit(1);
                    cursor.each(function (err, doc) {
                        if (doc != null) rtn = doc._id;
                        else cb(null, rtn);
                    })

                }

                if (app.isMaster())
                    max("members", "mid", 0, function (er, rtn) {
                        maxMemberID = rtn;
                        console.info("maxMemberID " + maxMemberID);
                    });

            });
    }

    //创建后台http服务器和客户端
    if (app.isMaster() && !app.accountServer && app.getMaster().accountServer) {
        app.accountServer = new require("../servers/login/account/accountServer.js")(app, app.getMaster().accountServer + 1);
    }
    if (app.accountServer) app.accountServer.zjhAdmin = this;
    if (app.getMaster().accountClient && !app.accountClient) {
        app.accountClient = require("../servers/login/account/accountClient.js")(app);
    }
}


//handle master -> server msg


var serverHandler =
    {


    }


//master->monitor
Module.prototype.monitorHandler = function (agent, msg, cb) {
    if (!msg)//定时报告
    {

    }

}

//handle monitor -> master msg
Module.prototype.masterHandler = function (agent, msg) {

    if (!msg) //pull
    {
        //agent.notifyAll(moduleId, {testMsg:"testMsg"});
        return;
    }
    else {
        this.report[msg.serverId] = msg;
    }

}


var clientHandler = {

}

//handle client -> master msg
Module.prototype.clientHandler = function (agent, msg, cb) {
    var self = this;
    var func = clientHandler[msg.cmd];
    if (func) func.call(this, agent, msg, cb);
    else if (msg.id) {
        if (cb) agent.request(msg.id, moduleId, msg, cb);
        else agent.notify(msg.id, moduleId, msg);
    }
    else {
        agent.notifyAll(moduleId, msg);
    }

}

