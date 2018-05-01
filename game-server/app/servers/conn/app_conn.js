var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var path = require('path');
var routor = require("../../../global/routors");

module.exports = function (pomelo, app) {
    var gameLog = [];


    // var loginServers = app.GetCfgServers('login');
    //
    // app.route('login', function (para, msg, app, cb) {
    //     //forwardMessage para is session
    //     if (msg.args[0].route == "login.handler.reqGuestID") {
    //         cb(null, loginServers[0].id);
    //         //GLog(["reqGuestID",loginServers[0].id,msg]);
    //     }
    //     else if ((msg.method == "verifyPlayer") && loginServers.length > 1) {
    //         var rtn = null;
    //         if (msg.args[0].openid) {
    //             var hash = app.stringHash(msg.args[0].openid);
    //             if(loginServers.length > 1 && loginServers[1 + hash % (loginServers.length - 1)]){
    //                 rtn = loginServers[1 + hash % (loginServers.length - 1)].id;
    //             }else{
    //                 rtn = loginServers[0].id;
    //             }
    //
    //         }
    //         else if (msg.args[0].mobile) {
    //             var hash = app.stringHash(msg.args[0].mobile);
    //             if(loginServers.length > 1 && loginServers[1 + hash % (loginServers.length - 1)]) {
    //                 rtn = loginServers[1 + hash % (loginServers.length - 1)].id;
    //             }else{
    //                 rtn = loginServers[0].id;
    //             }
    //         }
    //         else if(msg.args[0].mail){//游客登陆，用UID
    //             var hash = app.stringHash(msg.args[0].mail);
    //             if(loginServers.length > 1 && loginServers[1 + hash % (loginServers.length - 1)]) {
    //                 rtn = loginServers[1 + hash % (loginServers.length - 1)].id;
    //             }else{
    //                 rtn = loginServers[0].id;
    //             }
    //         }
    //         else rtn = loginServers[1 + Math.floor((loginServers.length - 1) * Math.random())].id;
    //         cb(null, rtn);
    //         //GLog(["verifyPlayer",rtn,msg]);
    //     }
    //     else {
    //         cb(null, loginServers[0].id);
    //         //GLog(["masterLogin",loginServers[0].id,msg]);
    //     }
    //
    // });


    app.set('connectorConfig',
        {
            connector: pomelo.connectors.hybridconnector,
            heartbeat: 60, //要求客户端每隔20s发送一个hb, 这个参数设置就代表启用心跳  timeout必须设置，否则默认2次心跳失败就会认为超时。
            //   timeout: 300, //假如在300s内都没收到客户端请求 后过期 认为超时
            heartbeatTimeout: 120,
            useDict: false,
            useProtobuf: false,
            //	disconnectOnTimeout: true, //判断已经超时后 是否断开.  是. 只有断开才能释放TCP链接 否则光判断超时也没意义
        });


    // app.logout = function (session, isActive, next) {
    //     logger.debug("app.logout sid:%d servid:%s", session.uid, app.serverId);
    //     if (session.uid != null && session.get("pkplayer")) {
    //         app.rpc.pkplayer.Rpc.doLogout(session, session.uid, session.id, session.frontendId, session.settings, isActive, next ? next : logoutCB);
    //     }
    // }
    //
    // //passive logout by close tcp
    // app.event.on('close_session', function (session) {
    //     logger.debug("[%s]session.emit close_session %d", app.serverId, session.uid);
    //     app.logout(session, false);
    // });
    //
    // app.event.on(
    //     'remove_servers',
    //     function (svrs) {
    //         for (var i = 0; i < svrs.length; i++) {
    //             var svr = app.getServerFromConfig(svrs[i]);
    //             if (!svr) {
    //
    //             }
    //             else if (svr.serverType == 'master') {
    //             }
    //             else if (svr.serverType == 'pkcon') {
    //             }
    //             else if (svr.serverType == 'pkplayer') {
    //             }
    //             else if (svr.serverType == 'pkroom') {
    //
    //             }
    //             //console.error(app.serverId,'remove_server',JSON.stringify(svr));
    //         }
    //
    //     }
    // );


}