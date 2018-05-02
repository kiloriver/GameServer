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
        let serverId = typeof session.get !== 'function' ? session.club : session.get('club');
        if (!serverId) {
            const servers = app.getServersByType('club');
            if (typeof session.set === 'function' && session.clubid) {
                serverId = servers[session.clubid % servers.length].id;
                if (serverId) {
                    session.set('club', serverId);
                    session.push('club');
                }
            }
        }
        next(null, serverId);
    }
};
