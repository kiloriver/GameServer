'use strict';
const __ = require("underscore");
const assert = require("assert");


module.exports = {

    /**
     * 随机路由到connector的路由函数
     *
     * @param {object}session   user` session object
     * @param {object}msg       msg information form client.
     * @param {object}app       pomelo application
     * @param {callback}next
     */
    RandomRoute: function (session, msg, app, next) {
        const servers = app.getServersByType('conn');
        assert(servers);
        next(null, __.sample(servers).id);
    },

    /**
     * session绑定路由connector的路由函数
     *
     * @param {object}session   user` session object, mast have 'login' keyword.
     * @param {object}msg       msg information from client.
     * @param {object}app       pomelo application
     * @param next
     */
    SessionRoute: function (session, msg, app, next) {
        const serverId = typeof session.get === 'function' ? session.get('conn') : session.conn;
        if (serverId) {
            next(null, serverId);
        } else {
            next(new Error('Can`t find connector server by SessionRoute %j', session));
            if (typeof session.close === 'function') {
                session.close();
            }
        }
    }
};

