'use strict';

const KOA = require("koa");
const json = require("koa-json");
const session = require("koa-session");
const bodyparser = require("koa-bodyparser");
const url = require("url");
const fs = require("fs");
const path = require("path");
const logger = require("pomelo-logger").getLogger('http', __filename);
const events = require("events");

module.exports = function (app, opts) {
    return new Component(app, opts);
};

/**
 *
 *  @class httpComponent
 *  @constructor
 *  @author goofo on 2017/7/31.
 *  @since 1.0.0
 *  @description
 */
class Component extends events {
    constructor() {
        super();

        this._init.apply(this, arguments);

        this.name = '__httpComponent__';
    }

    _init(app, opts = {}) {

        this.app = app;
        this.opts = opts;

        this.routes = {};
        try {
            this.routes["/before"] = require(path.join(this.app.get('base'), 'app', 'servers', this.app.serverType, 'httpHandler', 'before'));
            this.routes["/after"] = require(path.join(this.app.get('base'), 'app', 'servers', this.app.serverType, 'httpHandler', 'after'));
        } catch (err) {
            logger.info("load http after or before failed %s", err.message);
        }

        this.routesCache = {};

        this.koa = new KOA();

        this.koa.use(bodyparser({enableTypes: ['json', 'form', 'text']}));

        this.koa.use(json());

        this.koa.keys = ['davinci'];

        this.koa.use(session({
            key: 'koa:sess',
            maxAge: 86400000,
            overwrite: true,
            httpOnly: true,
            signed: true,
            rolling: false
        }, this.koa));

        /**
         * 前置逻辑处理
         */
        this.koa.use(async (ctx, next) => {
            logger.trace("[%s]process http request %j before!", this.app.serverId, ctx.url);
            if (this.routes["/before"] && typeof this.routes["/before"] === 'function') {
                if (!await this.routes["/before"](this.app, ctx)) {
                    return;
                }
            }
            await next();
        });

        this.koa.use(async (ctx, next) => {
            logger.trace("[%s]process http request %s", this.app.serverId, ctx.url);
            const pathname = url.parse(ctx.url).pathname.toLowerCase();
            if (!this.routes[pathname]) {
                try {
                    this.routes[pathname] = require(path.join(this.app.get('base'), 'app', 'servers', this.app.serverType, 'httpHandler', url.parse(ctx.url).pathname + '.js'));
                } catch (e) {
                    logger.debug("http request url %s no-found by %s", pathname, e.stack);
                }
            }
            if (this.routes[pathname] && typeof this.routes[pathname][ctx.request.method.toLowerCase()] === 'function') {
                ctx.body = await this.routes[pathname][ctx.request.method.toLowerCase()].call(this, ctx);
                logger.trace("[%s]process http request %j response: %j", this.app.serverId, ctx.request.url, ctx.body);
                await next();
            }
        });

        this.koa.use(async (ctx, next) => {
            logger.trace("[%s]process http request %j after!", this.app.serverId, ctx.url);
            if (this.routes["/after"] && typeof this.routes["/after"] === 'function') {
                if (!await this.routes["/after"](this.app, ctx)) {
                    return;
                }
            }
            await next();
        });

        fs.watch(path.join(this.app.get('base'), 'app', 'servers', this.app.serverType, 'httpHandler'), {
            recursive: true,
            persistent: true
        }, (evn, filename) => {
            if (/.*?\.js$/.test(filename)) {
                let full = path.join(this.app.get('base'), 'app', 'servers', this.app.serverType, 'httpHandler', filename);
                const p = path.parse(filename);
                const name = p.dir !== '' ? `/${p.dir.toLowerCase()}/${p.name.toLowerCase()}` : `/${p.name.toLowerCase()}`;

                try {
                    full = require.resolve(full);
                } catch (e) {
                    if (require.catch[  full]) {
                        delete require.catch[full];
                    }
                    if (this.routesCache[full]) {
                        delete this.routesCache[full];
                    }
                    if (this.routes[name]) {
                        delete this.routes[name];
                    }
                    return;
                }
                if (this.routesCache[full]) {
                    delete this.routesCache[full];
                }
                this.routesCache[full] = this.routes[name];
                try {
                    if (require.cache[full]) {
                        delete require.cache[full];
                    }
                    this.routes[name] = require(full);
                    logger.warn("file %s reload at %s success! routes: %j", full, name, this.routes);
                } catch (e) {
                    this.routes[name] = this.routesCache[full];
                    this.routesCache[full] = null;
                    logger.warn("file %s reload at %s failed! routes: %j", full, name, this.routes);
                }
            }
        });
    }
}

Component.prototype.start = function (cb) {
    this.koa.listen(this.opts.port || this.app.getCurServer().port + 1000, "0.0.0.0");
    cb();
};

Component.prototype.stop = function (cb) {
    if (typeof cb === 'function') {
        process.nextTick(cb);
    }
};