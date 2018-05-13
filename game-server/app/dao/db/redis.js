var logger = require('pomelo-logger').getLogger(__filename);

var redisClient = module.exports;

redisClient.init = function (app,db) {
    var redis = require('redis');
    var config = url.parse(process.env.REDIS_URI || ('redis://:jxlw921JXLW@' + (app.getMaster().redis || "127.0.0.1") + ":6379/" + (db || 0)));

    var client = redis.createClient(url.format(config));

    client.on("error", function (error) {
        console.log(error);
    });

    if (app.get('redisClient')) {
        app.get('redisClient').quit();
    }
    app.set('redisClient',client);
}

