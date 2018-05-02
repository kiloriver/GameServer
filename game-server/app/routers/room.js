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
        let serverId = typeof session.get !== 'function' ? session.room : session.get('room');
        if (!serverId) {
            const servers = app.getServersByType('room');
            if (typeof session.set === 'function') {
                serverId = servers[session.uid % servers.length].id;
                if (serverId) {
                    session.set('room', serverId);
                    session.push('room');
                }
            }
        }
        next(null, serverId);
    }
};
