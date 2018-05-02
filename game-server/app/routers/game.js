'use strict';


module.exports = {

    /**
     * session绑定路由的路由函数
     *
     * @param {object}session   user` session object, mast have 'login' keyword.
     * @param {object}msg       msg information from client.
     * @param {object}app       pomelo application
     * @param next
     */
    SessionRoute: function (session, msg, app, next) {
        let serverId = typeof session.get !== 'function' ? session.game : session.get('game');
        if (!serverId) {
            const servers = app.getServersByType('game');
            if (typeof session.set === 'function' && session.tableid) {
                serverId = servers[session.tableid % servers.length].id;
                if (serverId) {
                    session.set('game', serverId);
                    session.push('game');
                }
            }
        }
        next(null, serverId);
    }
};
