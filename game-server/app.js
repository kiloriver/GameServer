var pomelo = require('pomelo');
var clubService = require('./app/servers/club/service');
// var instanceManager = require('./app/services/instanceManager');
// var scene = require('./app/domain/area/scene');
// var instancePool = require('./app/domain/area/instancePool');
var dataApi = require('./app/util/dataApi');
var routeUtil = require('./app/util/routor');
//var playerFilter = require('./app/servers/area/filter/playerFilter');
// var ChatService = require('./app/services/chatService');
var sync = require('pomelo-sync-plugin');
// var masterhaPlugin = require('pomelo-masterha-plugin');

/**
 * Init app for client
 */
var app = pomelo.createApp();
app.set('name', 'GameServer');

// configure for global
app.configure('production|development', function() {
    app.before(pomelo.filters.toobusy());
    app.enable('systemMonitor');
    require('./app/util/httpServer');

    //var sceneInfo = require('./app/modules/sceneInfo');
    var onlineUser = require('./app/modules/onlineUser');
    if(typeof app.registerAdmin === 'function'){
        //app.registerAdmin(sceneInfo, {app: app});
        app.registerAdmin(onlineUser, {app: app});
    }
    //Set areasIdMap, a map from area id to serverId.
    if (app.serverType !== 'master') {
        // var rooms = app.get('servers').room;
        // var roomIdMap = {};
        // for(var id in rooms){
        //     roomIdMap[rooms[id].room] = rooms[id].id;
        // }
        // app.set('roomIdMap',roomIdMap);
    }
    // proxy configures
    app.set('proxyConfig', {
        cacheMsg: true,
        interval: 30,
        lazyConnection: true
        // enableRpcLog: true
    });

    // remote configures
    app.set('remoteConfig', {
        cacheMsg: true,
        interval: 30
    });

    // route configures
    app.route('club', routeUtil.club);
    app.route('game', routeUtil.game);
    app.route('player', routeUtil.player);
    app.route('connector', routeUtil.connector);

  //  app.loadConfig('mysql', app.getBase() + '/../shared/config/mysql.json');
    app.filter(pomelo.filters.timeout());

    /*
    // master high availability
    app.use(masterhaPlugin, {
      zookeeper: {
        server: '127.0.0.1:2181',
        path: '/pomelo/master'
      }
    });
    */
});


// Configure for club server
app.configure('production|development', 'club', function(){
    app.filter(pomelo.filters.serial());
   // app.before(playerFilter());

    //Init areaService
    clubService.init();
});
// Configure database
app.configure('production|development', 'login|game|player|club', function() {
    var sType = app.getServerType();
    var mongo_client = require('./app/dao/db/mongo').init(app,sType);
    app.set('mongo', mongo_client);
    // app.load(pomelo.sync, {path:__dirname + '/app/dao/mapping', dbclient: dbclient});
 //   app.use(sync, {sync: {path:__dirname + '/app/dao/mapping', dbclient: mongo_client}});

    var redis_db = 0;
    switch(sType){
        case 'login':redis_db = 1;break;
        case 'player':redis_db = 2;break;
        case 'club':redis_db = 3;break;
        case 'game':redis_db = 4;break;
        default:break;
    }
    var redis_client = require('./app/dao/db/redis').init(app,redis_db);
    app.set('redis', redis_client);
    // app.load(pomelo.sync, {path:__dirname + '/app/dao/mapping', dbclient: dbclient});
    //app.use(sync, {sync: {path:__dirname + '/app/dao/mapping', dbclient: redis_client}});
});

app.configure('production|development', 'connector', function(){
    var dictionary = app.components['__dictionary__'];
    var dict = null;
    if(!!dictionary){
        dict = dictionary.getDict();
    }

    app.set('connectorConfig',
        {
            connector : pomelo.connectors.hybridconnector,
            heartbeat : 90,
            useDict : true,
            useProtobuf : true,
            handshake : function(msg, cb){
                cb(null, {});
            }
        });
});



//start
app.start();

// Uncaught exception handler
process.on('uncaughtException', function(err) {
    console.error(' Caught exception: ' + err.stack);
});
