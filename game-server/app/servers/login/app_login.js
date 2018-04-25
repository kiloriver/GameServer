
var routor = require('../util/routor')

module.exports = function(pomelo,app)
{
    var LoginData = require ('../login/LoginData');
    app.load (LoginData,{});
}