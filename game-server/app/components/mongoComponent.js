'use strict';
const Mongodb = require("mongodb");
const Pool = require("generic-pool");
const logger = require("pomelo-logger").getLogger('mongo', __filename);
const assert = require("assert");

module.exports = function (app, opts) {
    return new Component(app, opts);
};

/**
 * mongodb 连接池
 *
 */
class Component {
    constructor(app, opts = {}) {
        logger.trace("load mongodb component  by %j", opts);
        this.app = app;
        this.opts = opts;

        this.name = "__mongoComponent__";

        this.app.set('mongodb', this, true);

        /**
         * 连接池创建连接函数
         * @return {Promise}
         */
        const createFunc = function () {
            logger.trace("[%s]try to create mongo connection by %j", this.app.serverId, this.opts);
            return new Promise((resolve, reject) => {
                logger.debug("connection to [%s] before pool size: %d", this.opts.url, this.size);
            Mongodb.connect(this.opts.url, this.opts.options || {autoReconnect: true}, (err, db) => {
                if (err) {
                    logger.error("[%s]create mongodb connection (size %d) failed by : %s", this.app.serverId, this.size, err.message);
                    reject(err);
                } else {
                    logger.debug("[%s]create mongodb connection by [%s] current size: %d", this.app.serverId, this.opts.url, this.size);

            resolve(db);
        }
        });

        });
        };

        /**
         * 连接池销毁连接函数
         * @param client 连接实例
         * @return {Promise}
         */
        const destroyFunc = function (client) {
            return new Promise((resolve) => {
                logger.trace("[%s]destroy mongodb connection by generic-pool! current pool size %d", this.app.serverId, this.size);
            client.close(true);
            client.on('close', resolve);
        });
        };

        /// 读写主数据库 master
        this._pool = Pool.createPool({
            create: createFunc.bind(this),
            destroy: destroyFunc.bind(this)
        }, this.opts.capacity);

        this._pool.on('factoryCreateError', err => {
            logger.error('[%s]Create mongodb connection failed by %s current pool size %d', this.app.serverId, err.message, this.size);
    });

        this._pool.on('factoryDestroyError', err => {
            logger.error("[%s]Destroy mongodb connection failed by %s current pool size %d", this.app.serverId, err.message, this.size);
    });
    }

    /**
     * 当前线程池大小
     */
    get size() {
        return this._pool ? this._pool.size : 0;
    }

    /**
     * 当前可用的线程
     * @return {*|Number|boolean}
     */
    get available() {
        return this._pool.available;
    }
}

/**
 *
 * @param cb
 */
Component.prototype.start = function (cb) {
    process.nextTick(cb);
};

/**
 *
 * @param cb
 */
Component.prototype.stop = function () {
    this._pool.drain().then(() => {
        this._pool.clear();
}).catch(function (error) {
        logger.error("generic-pool stop function has eror: %s", error.stack);
    });

};

/**
 * 申请一个连接用来数据操作,注意要和 release 成对出现
 * @param opts
 * @param priority
 * @return {Promise.<void>}
 */
Component.prototype.acquire = function (priority = 0) {
    return new Promise((resolve, reject) => {
        this._pool.acquire(priority).then(connection => {
        logger.trace("[%s]mongodb pool acquire connection %d, current pool size: %d", this.app.serverId, connection.connection_id, this.size);
    resolve(connection);
}).catch(err => {
        logger.error("[%s]mongodb pool acquire failed by %s, current pool size: %d", this.app.serverId, err.message, this.size);
    reject(err);
});
});
};

/**
 * 释放连接到连接池 和 acquire 函数成对出现
 * @param connection
 * @return {Promise.<void>}
 */
Component.prototype.release = function (connection) {
    logger.trace("[%s]mongodb pool release connection %d, current pool size: %d", this.app.serverId, connection.connection_id, this.size);
    this._pool.release(connection);
};

Component.prototype.destroy = function (connection) {
    this._pool.destroy(connection);
};

Component.prototype.dashboard = function () {
    return {
        // How many many more resources can the pool manage/create
        spareResourceCapacity: this._pool.spareResourceCapacity,
        // returns number of resources in the pool regardless of whether they are free or in use
        size: this._pool.size,
        // returns number of unused resources in the pool
        available: this._pool.available,
        // number of resources that are currently acquired by userland code
        borrowed: this._pool.borrowed,
        // returns number of callers waiting to acquire a resource
        pending: this._pool.pending,
        // returns number of maxixmum number of resources allowed by pool
        max: this._pool.max,
        // returns number of minimum number of resources allowed by pool
        min: this._pool.min
    };
};
