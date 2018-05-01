'use strict';

const Redis = require("redis");
const Pool = require("generic-pool");
const logger = require("pomelo-logger").getLogger('redis', __filename);


module.exports = function (app, opts) {
    return new Component(app, opts);
};

/**
 * redis 连接池
 *
 */
class Component {
    constructor(app, opts = {}) {
        this.app = app;
        this.opts = opts;

        this.name = "__redisComponent__";

        this.app.set('redis', this, true);

        /**
         * 连接池创建连接函数
         * @return {Promise}
         */
        const createFunc = function () {
            logger.trace("[%s]try to create redis connection by %j", this.app.serverId, this.opts.options);
            return new Promise((resolve, reject) => {
                const client = Redis.createClient(this.opts.options);
                client.on('ready', () => {
                    resolve(client);
                    logger.warn("[%s]create redis connection from [%s] current pool size: %d", this.app.serverId, this.opts.options.url, this.size);
                });
                client.on('error', reject);
            });
        };

        /**
         * 连接池销毁练练函数
         * @param client
         * @return {Promise}
         */
        const destroyFunc = function (client) {
            return new Promise(resolve => {
                logger.warn("[%s]destroy redis connection from generic-pool, current pool size: %d", this.app.serverId, this.size);
                client.on('end', resolve);
                client.disconnect();
            });
        };

        /// 读写主数据库 master
        this._pool = Pool.createPool({
            create: createFunc.bind(this),
            destroy: destroyFunc.bind(this)
        }, opts.capacity);

        this._pool.on('factoryCreateError', err => {
            logger.error('[%s]Create redis connection failed by %s current pool size %d', this.app.serverId, err.message, this.size);
        });

        this._pool.on('factoryDestroyError', err => {
            logger.error("[%s]Destroy redis connection failed by %s current pool size %d", this.app.serverId, err.message, this.size);
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

    cb();
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
            logger.trace("[%s]redis pool acquire connection %d", this.app.serverId, connection.connection_id);
            resolve(connection);
        }).catch(err => {
            logger.error("[%s]redis pool acquire connection failed: %s", this.app.serverId, err.message);
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
    logger.trace("[%s]redis pool release connection %d, current pool %d", this.app.serverId, connection.connection_id, this.size);
    this._pool.release(connection);
};


/**
 * 简单封装的redis命令行函数
 *
 * @example
 *
 *  app.get('redis').command('hset','hassetname','key','value');
 *  app.get('redis').command('hget','hassetname','key');
 *  app.get('redis').command('hgetall','hassetname');
 *
 * @return {Promise.<void>}
 */
Component.prototype.command = function (cmd) {
    const args = [].slice.call(arguments, 1);
    return new Promise((resolve, reject) => {
        this.acquire().then(connection => {
            if (!connection[cmd] || typeof connection[cmd] !== 'function') {
                logger.error("[%s]执行redis命令失败:%s", this.app.serverId, cmd);
                resolve(null);
                this.release(connection);
            } else {
                args.push((err, data) => {
                    if (err) {
                        logger.error("[%s]redis command %s(%j) has error: %s", this.app.serverId, cmd, args, err.stack);
                        reject(err);
                        /// 这个连接可能存在问题(比如当redis master宕机导致主从切换后 这些连接可能会存在重连的bug), 这里直接销毁掉连接, 外部使用acquire的时候会从新连接新的服务器
                        this.destroy(connection);
                    } else {
                        logger.trace("[%s]redis %s command %s(%j) result %s", this.app.serverId, connection.connection_id, cmd, args, data);
                        resolve(data);
                        this.release(connection);
                    }
                });
                logger.trace("[%s]redis command %s(%j)", this.app.serverId, cmd, args);
                connection[cmd].apply(connection, args);
            }
        }).catch(err => {
            logger.error("[%s]redis command %s has error: %s", this.app.serverId, cmd, err.stack);
            reject(err);
        });
    });
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
