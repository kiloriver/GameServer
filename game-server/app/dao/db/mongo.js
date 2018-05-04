var logger = require('pomelo-logger').getLogger(__filename);

var mongoDB = module.exports;

mongoDB.init = function (app,dbName) {
    var MongoClient = require('mongodb').MongoClient;
    var url = 'mongodb://' + app.getMaster().host + ':27017/' + app.getMaster().id;
    if (app.getMaster().mdbUrl){
        url = app.getMaster().mdbUrl + '/' + dbName;
    }

    MongoClient.connect(url, {server: {poolSize: 3, auto_reconnect: true}}, function (err, db) {
        if (!err){
            logger.fatal(app.serverId + " Connected correctly to server.",dbName);
            return;
        }
        //
        app.set("mdb",db);
    });
}

