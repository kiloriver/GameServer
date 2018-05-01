var pomelo = require('pomelo');
const logger = require("pomelo-logger").getLogger('pomelo', __filename);
const fs = require("fs");
const utils = require("./global/utils");
const router = require("./global/routors");
/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'GameServer');

var cfgServers = {};
app.GetCfgServers = function (sType, instanceType) {
    var dataServers = cfgServers[instanceType ? sType + "-" + instanceType : sType];
    if (!dataServers) {
        cfgServers[instanceType ? sType + "-" + instanceType : sType] = dataServers = [];
        var allServers = app.getServersFromConfig();
        for (var svrid in allServers) {
            var sinfo = allServers[svrid];
            if (sinfo.serverType === sType) {
                if (instanceType === sinfo.instanceType) {
                    dataServers.push(sinfo);
                }
            }
        }
        dataServers.sort(function (a, b) {
            return (a.id < b.id) ? -1 : ((a.id > b.id) ? 1 : 0)
        });
    }
    return dataServers;
};
app.GetServerByID = function (sType, id) {
    var dataServers = app.GetCfgServers(sType);
    return dataServers[id % dataServers.length];
};



/**
 *  后端服务 加载数据库组件
 *
 */
app.configure('dev',function () {
    //const masterConfigure = app.getMaster();
    var sType = app.getServerType();

    if (sType === 'master'){

    }else{
        console.log('./app/servers/' + sType + '/app_' + sType);
        require('./app/servers/' + sType + '/app_' + sType)(pomelo, app);
    }

    app.filter(pomelo.timeout());
   // app.set('proxyConfig', {'retryTimes': 0});

    //app.registerAdmin(require('./app/gameMaster/ydAdmin'), {app: app});

});



/**
 *  启动服务
 *
 */
app.start(function () {
    logger.info("start finish " + app.serverId);
});

process.on('uncaughtException', function (err) {
    fs.appendFileSync('uncaught/' + app.serverId + "_" + (new Date().Format("yyyy_MM_dd")) + ".txt", '\nuncaught ' + err.stack);
    require('pomelo-logger').getLogger('pomelo', __filename).fatal("uncaughtException %s at %s", err.message, err.stack);
});

process.on('unhandledRejection', function (reason, p) {
    p.catch(function (err) {
        fs.appendFileSync('uncaught/' + app.serverId + "_" + (new Date().Format("yyyy_MM_dd")) + ".txt", '\nuncaught ' + err.stack + "\n\r");
        require('pomelo-logger').getLogger('pomelo').fatal("unhandledRejection %s at %s", err.message, err.stack);
    });
});

