
var routor = require('../util/routor')
var MongoClient = require('mongodb').MongoClient;

module.exports = function(pomelo,app)
{
    app.db_name = "lobbyDB";
}