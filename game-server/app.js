var pomelo = require('pomelo');
var fs = require('fs');


Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //�·�
        "d+": this.getDate(), //��
        "h+": this.getHours(), //Сʱ
        "m+": this.getMinutes(), //��
        "s+": this.getSeconds(), //��
        "q+": Math.floor((this.getMonth() + 3) / 3), //����
        "S": this.getMilliseconds() //����
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

Object.defineProperty(global, '__stack', {
    get: function () {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
    get: function () {
        return __stack[2].getLineNumber();
    }
});


/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'GameServer');
app.regEx = {
    mail: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/,
    uid: /\d+/
};

// app configuration

app.configure(function () {
    sType = app.getServerType();
    if (sType != 'master')
        require('./app/servers/' + sType + '/app_' + sType)(pomelo, app, SessionRoute, DirectRoute);

    app.set('proxyConfig', {'retryTimes': 0});
});

// start app
app.start(function () {
    var rpcErr = [];
    app.syserr = function (tag, err) {
        app.FileWork(rpcErr, "uncaught/" + tag + app.serverId + ".txt", err);
    }

    if (app.serverType != 'master') {
        app.components.__proxy__.client._station.on('error',
            function (code, tracer, serverId, msg, opts, cb) {
                app.FileWork(rpcErr, "uncaught/rpcErr_" + app.serverId + ".txt", code + ' ' + serverId + " " + JSON.stringify(msg))
            });
    }
    else {
    }
});



process.on('uncaughtException', function (err) {
    console.error(' Caught exception: ' + err.stack);
    fs.appendFileSync('uncaught/' + app.serverId + "_" + (new Date().Format("yyyy_MM_dd")) + ".txt", '\nuncaught ' + err.stack);
    require('pomelo-logger').getLogger('pomelo', __filename).fatal("uncaughtException %s at %s", err.message, err.stack);
});

process.on('unhandledRejection', function (reason, p) {
    p.catch(function (err) {
        fs.appendFileSync('uncaught/' + app.serverId + "_" + (new Date().Format("yyyy_MM_dd")) + ".txt", '\nuncaught ' + err.stack + "\n\r");
        require('pomelo-logger').getLogger('pomelo').fatal("unhandledRejection %s at %s", err.message, err.stack);
    });
});
