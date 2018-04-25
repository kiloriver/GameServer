
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var path = require('path');
var routor = require('routor.js')

module.exports = function (pomelo, app) {
    var gameLog = [];

    function GLog(log) {
        return;
        app.FileWork(gameLog, __dirname + "/log.txt", log);
    }

    var ComponentData = require('./pkconData');
    app.load(ComponentData, {});
    var LoginData = require('../login/LoginData');
    app.load(LoginData, {});

    var PKPlayer = require('../pkplayer/pkplayerData');
    app.load(PKPlayer, {});

    app.loadConfig("appConfig", path.join(__dirname, "../../../config/appConfig.json"));

    app.route('pkplayer', SessionRoute('pkplayer'));
    /// 使用自定义路由
    /// 如果msg内包含clubId字段,代表是客户端发起的俱乐部请求.
    /// 否则走 session 的 pkroom字段路由pkroom进程
    //app.route('pkroom', SessionRoute('pkroom'));
    app.route('pkroom', function (session, msg, app, cb) {
        var msgBody = msg.args[0] ? msg.args[0].body : null;
        if (msgBody && (typeof msgBody.club !== 'undefined')) {
            var severs = app.GetCfgServers('pkroom', 'club');
            if (!severs || severs.length == 0) {
                cb(new Error('invalid clubId!'));
                return;
            }
            var server = severs[parseInt(msgBody.club) % severs.length];
            if (server && server.instanceType !== 'club') {
                logger.error("route pkroom for club failed: %j => %j", msgBody, server);
            }
            cb(null, server ? server.id : undefined);
            logger.debug("[%s] route pkroom %d => %j", app.serverId, msgBody.club, server);
            return;
        }
        cb(null, session.get('pkroom'));
    });

    var loginServers = app.GetCfgServers('login');

    app.route('login', function (para, msg, app, cb) {
        //forwardMessage para is session
        if (msg.args[0].route == "login.handler.reqGuestID") {
            cb(null, loginServers[0].id);
            //GLog(["reqGuestID",loginServers[0].id,msg]);
        } else if ((msg.args[0].route == "login.handler.checkAuthCode") && loginServers.length > 1) {
            //微信登录必须传unionid
            //console.warn("login route msg",msg,"para",para);
            var rtn = null;
            if (msg.args[0].openid) {
                var hash = app.stringHash(msg.args[0].openid);
                rtn = loginServers[1 + hash % (loginServers.length - 1)].id;
            }
            else if (msg.args[0].mobile) {
                var hash = app.stringHash(msg.args[0].mobile);
                rtn = loginServers[1 + hash % (loginServers.length - 1)].id;
            }
            else if(msg.args[0].mail){//游客登陆，用UID
                var hash = app.stringHash(msg.args[0].mail);
                rtn = loginServers[1 + hash % (loginServers.length - 1)].id;
            }
            else rtn = loginServers[1 + Math.floor((loginServers.length - 1) * Math.random())].id;

            cb(null, rtn);
            //GLog(["verifyPlayer",rtn,msg]);
        }
        else if (para) {
            cb(null, para);
            //GLog(["para",para,msg]);
        }
        else if ((msg.method == "verifyPlayer") && loginServers.length > 1) {
            var rtn = null;
            if (msg.args[0].openid) {
                var hash = app.stringHash(msg.args[0].openid);
                if(loginServers.length > 1 && loginServers[1 + hash % (loginServers.length - 1)]){
                    rtn = loginServers[1 + hash % (loginServers.length - 1)].id;
                }else{
                    rtn = loginServers[0].id;
                }

            }
            else if (msg.args[0].mobile) {
                var hash = app.stringHash(msg.args[0].mobile);
                if(loginServers.length > 1 && loginServers[1 + hash % (loginServers.length - 1)]) {
                    rtn = loginServers[1 + hash % (loginServers.length - 1)].id;
                }else{
                    rtn = loginServers[0].id;
                }
            }
            else if(msg.args[0].mail){//游客登陆，用UID
                var hash = app.stringHash(msg.args[0].mail);
                if(loginServers.length > 1 && loginServers[1 + hash % (loginServers.length - 1)]) {
                    rtn = loginServers[1 + hash % (loginServers.length - 1)].id;
                }else{
                    rtn = loginServers[0].id;
                }
            }
            else rtn = loginServers[1 + Math.floor((loginServers.length - 1) * Math.random())].id;
            cb(null, rtn);
            //GLog(["verifyPlayer",rtn,msg]);
        }
        else {
            cb(null, loginServers[0].id);
            //GLog(["masterLogin",loginServers[0].id,msg]);
        }

    });


    app.set('connectorConfig',
        {
            connector: pomelo.connectors.hybridconnector,
            heartbeat: 60, //要求客户端每隔20s发送一个hb, 这个参数设置就代表启用心跳  timeout必须设置，否则默认2次心跳失败就会认为超时。
            //   timeout: 300, //假如在300s内都没收到客户端请求 后过期 认为超时
            heartbeatTimeout: 120,
            useDict: true,
            useProtobuf: true,
            //	disconnectOnTimeout: true, //判断已经超时后 是否断开.  是. 只有断开才能释放TCP链接 否则光判断超时也没意义
        });


    function logoutCB() {
    }

    app.logout = function (session, isActive, next) {
        logger.debug("app.logout sid:%d servid:%s", session.uid, app.serverId);
        if (session.uid != null && session.get("pkplayer")) {
            app.rpc.pkplayer.Rpc.doLogout(session, session.uid, session.id, session.frontendId, session.settings, isActive, next ? next : logoutCB);
        }
    }

    //passive logout by close tcp
    app.event.on('close_session', function (session) {
        logger.debug("[%s]session.emit close_session %d", app.serverId, session.uid);
        app.logout(session, false);
    });

    app.event.on(
        'remove_servers',
        function (svrs) {
            for (var i = 0; i < svrs.length; i++) {
                var svr = app.getServerFromConfig(svrs[i]);
                if (!svr) {

                }
                else if (svr.serverType == 'master') {
                }
                else if (svr.serverType == 'pkcon') {
                }
                else if (svr.serverType == 'pkplayer') {
                }
                else if (svr.serverType == 'pkroom') {

                }
                //console.error(app.serverId,'remove_server',JSON.stringify(svr));
            }

        }
    );


}