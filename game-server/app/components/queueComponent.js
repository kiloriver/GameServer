'use strict';
const fs = require("fs");
const path = require("path");
const kue = require("kue");
const logger = require("pomelo-logger").getLogger('queue', __filename);
const utils = require("../../utils/utils");


/**
 * 这里引用一个消息队列的组件,用来代替需要保证完成的RPC等消息任务
 *
 * 这个对象会监听 serverType/queue文件夹下的所有js文件,
 *  这个js文件格式为 export = function(job, cb){}
 *  这个函数就是真正的 jos processor
 *
 *  支持热更
 * @param app
 * @param opts
 * @return {Component}
 */
module.exports = function (app, opts) {
    return new Component(app, opts);
};

/**
 * 消息队列组件
 */
class Component {
    constructor(app, opts = {}) {
        this._init.apply(this, arguments);

    }

    _init(app, opts = {}) {

        this.app = app;
        this.opts = opts;

        this.name = "__queueComponent__";
        this.routesCache = {};
        this.routes = {};

        const queue = kue.createQueue(this.opts);
        queue.on('ready', () => {
            // If you need to
            logger.info('Queue is ready!');
        });

        queue.on('error', (err) => {
            // handle connection errors here
            logger.error('There was an error in the main queue. on: %s', err.stack);
        });

        this.app.set('queue', queue, true);

        this.workspace = path.join(this.app.get('base'), 'app', 'servers', this.app.serverType, 'queue');

        try {
            fs.watch(this.workspace, (type, name) => {
                if (/.*?\.js$/.test(name)) {
                    logger.info("File %s was changed by: %s", name, type);
                    this.delayReload();
                }
            });
        }
        catch (err) {
            logger.debug("queue file  watch | err %j", err.stack);
        }
    }
}

/**
 *
 * @param cb
 */
Component.prototype.start = function (cb) {
    this.delayReload();

    if (typeof cb === 'function') {
        cb();
    }
};

/**
 *
 * @param cb
 */
Component.prototype.stop = function (cb) {

    if (typeof cb === 'function') {
        process.nextTick(cb);
    }

};


/**
 *  负责加载room代码
 */
Component.prototype.delayReload = function (delay) {
    if (this.delay) {
        clearTimeout(this.delay);
        this.delay = null;
    }
    this.delay = setTimeout(this.reload.bind(this), delay || 5000);
};

/**
 *  重新加载服务代码
 */
Component.prototype.reload = function () {
    if (this.delay) {
        clearTimeout(this.delay);
        this.delay = null;
    }

    utils.ReadDirSync(this.workspace).then(files => {
        for (let i in files) {
            if (/.*?\.js$/.test(files[i])) {
                logger.trace("load queue file %s by %s", files[i], this.workspace);
                const p = path.join(this.workspace, files[i]);
                if (require.cache[p]) {
                    delete require.cache[p];
                }
                const code = require(p);
                const detail = path.parse(files[i]);
                if (this.routesCache[detail.name]) {
                    delete this.routesCache[detail.name];
                }
                this.routesCache[detail.name] = this.routes[detail.name];
                this.routes[detail.name] = code;
                logger.trace("load queue file name[%s]", detail.name);
                this.app.queue.process(detail.name, (job, done) => {
                    this.routes[detail.name].apply(this, [job, done]);
                });
                logger.trace("load queue file name[%s]", detail.name);
            }
        }
    }).catch(err => {
        logger.error("load queue files failed: %s", err.stack);
    });
};
