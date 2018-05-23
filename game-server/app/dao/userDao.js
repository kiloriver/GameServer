'use strict';
const pomelo = require("pomelo");
const logger = require("pomelo-logger").getLogger('userDao', __filename);
const mongodb = require("mongodb");
const uuid = require('uuid');
const request = require("request-promise");


if (require.cache[require.resolve('../consts/consts')]) {
    delete require.cache[require.resolve('../consts/consts')];
}
//const macro = require("../consts/macro");
const constant = require("../consts/consts");

const userDao = module.exports = {};

const collectionName = constant.Collection.USER_TABLE;

const randomFace = function () {
    return 'avata:' + (Math.floor(Math.random() * 10000) % 115);
};

const nickNameReg = function (nickName) {
    let pattern = /^[a-zA-Z0-9\u4E00-\u9FA5]{2,16}$/;
    return pattern.test(nickName);
};
const passwordReg = function (pwd) {
    let pattern = /^[a-zA-Z0-9_-]{6,48}$/;
    return pattern.test(pwd);
};


const randomName = function (string_length) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    if (!string_length)
        string_length = 8;

    let randomstring = '';

    for (let i = 0; i < string_length; i++) {
        let rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
};

/***
 * 生成唯一id
 *
 *
 * @return {Promise}
 */
userDao.uniqueUID = function () {
    return new Promise((resolve, reject) => {
        const redisClient = pomelo.app.get("redis");
        if(redisClient){
            redisClient.command('INCRBY', constant.Keyword.UniqueUID, 1).then(uid => {
                resolve(parseInt(uid) + 100000);
            }).catch(err => {
                reject(err);
            });
        }else{
            reject(constant.REDIS.NoRedis);
        }
    });
};

/**
 * 生成一个新的用户数据
 *
 * @param opts
 * @return {{_id: *, uid: Number, email: *, headimgurl: *, nickname: *, unionid: *, resVersion: *, mobile: *, loginCode, face, members: {}, sendTime: Date, name, onlyChargeSelf: (*|boolean), identity: number}}
 */
userDao.genUserData = function (opts) {
    return {
        _id: new mongodb.ObjectID(),
        uid: parseInt(opts.uid),
        email: opts.email,
        headimgurl: opts.headimgurl,
        nickname: opts.nickname,
        unionid: opts.unionid,
        resVersion: opts.resVersion,
        mobile: opts.mobile,
        loginCode: randomName(6),
        face: randomFace(),
        members: {},
        sendTime: new Date(),
        name: randomName(),
        onlyChargeSelf: opts.onlyChargeSelf || true,
        identity: 0
    };
};

/**
 * load user infomation from mongodb cgbuser
 *
 *
 * @param condition
 * @return {Promise}
 */
userDao.loadUserFromMongoDB = function (condition) {
    logger.trace('loadUserFromMongoDB by %j', condition);
    return new Promise((resolve, reject) => {
        const mongodb = pomelo.app.get("mongo");
        if(mongodb){
            mongodb.acquire().then(connection => {
                connection.collection(collectionName).findOne(condition).then(data => {
                    logger.trace("loadUserFromMongodb %j result: %j", condition, data);
                    resolve(data);
                    mongodb.release(connection);
                }).catch(err => {
                    logger.warn("loadUserFromMongodb %j failed by %s", condition, err.message);
                    reject(err);
                    mongodb.release(connection);
                });

            }).catch(reject);
        }else{
            reject(constant.MONGO.NoMongo);
        }

    });
};

/**
 * 更新用户数据到mongodb
 *
 * @param user
 * @return {Promise}
 */
userDao.updateUser2MongoDB = function (user) {
    logger.trace('updateUser2MongoDB %j', user);
    return new Promise((resolve, reject) => {
        const mongodb = pomelo.app.get("mongo");
        if(mongodb){
            mongodb.acquire().then(connection => {
                connection.collection(collectionName).updateOne({uid: user.uid}, user, {upsert: true}).then(resolve).catch(err => {
                    logger.warn('updateUser2MongoDB %j failed by %s', user, err.message);
                    mongodb.release(connection);
                });
            }).catch(reject);
        }else{
            reject(constant.MONGO.NoMongo);
        }

    });
};

/**
 * 更新玩家数据到 Redis
 *
 * @param user
 */
userDao.updateUser2Redis = function (user) {
    if (!user) {
        return;
    }
    const str = JSON.stringify(user);
    const redisClient = pomelo.app.get('redis');
    if(redisClient){
        redisClient.command('HSET', `${constant.Keyword.Hash}.${constant.Keyword.IDPlayers}`, user.uid, str);
        if (user.email) {
            redisClient.command('HSET', `${constant.Keyword.Hash}.${constant.Keyword.MailPlayers}`, user.email, user.uid);
        }
        if (user.mobile) {
            redisClient.command('HSET', `${constant.Keyword.Hash}.${constant.Keyword.MobilePlayers}`, user.mobile, user.uid);
        }
    }else{
        reject(constant.REDIS.NoRedis);
    }

};

/**
 * 清理redis内存 并保存到mongodb
 *
 * @param uid
 */
userDao.cleanupAndSync2MongoDB = function (uid) {
    this.getUserByIDPlayers(uid).then(user => {
        if (user) {
            user = JSON.parse(user);
            if (user._id)
                delete user._id;

            this.updateUser2MongoDB(user);
            pomelo.app.redis.command('HDEL', `${constant.Keyword.Hash}.${constant.Keyword.IDPlayers}`, user.uid);
            pomelo.app.redis.command('HDEL', `${constant.Keyword.Hash}.${constant.Keyword.MailPlayers}`, user.email);
            pomelo.app.redis.command('HDEL', `${constant.Keyword.Hash}.${constant.Keyword.MailPlayers}`, user.mobile);
        }
    });
};

/**
 * 通过UID获取玩家的信息, 这部分信息属于账号信息
 *
 * @param uid
 * @return {Promise}
 */
userDao.getUserByIDPlayers = function (uid) {
    return new Promise((resolve, reject) => {
        const redisClient = pomelo.app.get('redis');
        if(redisClient){
            redisClient.command('HGET', `${constant.Keyword.Hash}.${constant.Keyword.IDPlayers}`, uid).then(info => {
                if (info) {
                    info = JSON.parse(info);
                }
                resolve(info);
            }).catch(reject);
        }else{
            reject(constant.REDIS.NoRedis);
        }

    });
};

/**
 * 通过用户的邮箱查找账号信息
 *
 * @param mail
 * @return {Promise}
 */
userDao.getUserByMailPlayers = function (mail) {
    return new Promise((resolve, reject) => {
        const redisClient = pomelo.app.get('redis');
        if(redisClient){
            redisClient.command('HGET', `${constant.Keyword.Hash}.${constant.Keyword.MailPlayers}`, mail).then(uid => {
                if (!uid) {
                    resolve(null);
                } else {
                    this.getUserByIDPlayers(uid).then(resolve);
                }
            }).catch(reject);
        }else{
            reject(constant.REDIS.NoRedis);
        }

    });
};

/**
 * 通过手机号查找玩家信息
 *
 * @param mobile
 * @return {Promise}
 */
userDao.getUserByMobilePlayers = function (mobile) {
    return new Promise((resolve, reject) => {
        const redisClient = pomelo.app.get('redis');
        if(redisClient) {
            redisClient.command('HGET', `${constant.Keyword.Hash}.${constant.Keyword.MobilePlayers}`, mobile).then(uid => {
                if (!uid) {
                    resolve(null);
                } else {
                    this.getUserByIDPlayers(uid).then(resolve);
                }
            }).catch(reject);
        }else{
            reject(constant.REDIS.NoRedis);
        }
    });
};


// 账户系统接口 孙波

userDao.mongoTask = function (next) {
    return pomelo.app.mongodb.acquire().then((connection) => {
        return next(connection).then((result) => {
            pomelo.app.mongodb.release(connection);
            return result;
        }).catch((err) => {
            pomelo.app.mongodb.release(connection);
            account_logger.error('mangoTask ==> ERROR', err);

            if (err instanceof mongodb.MongoError) {
                return {result: Result.mongoError};
            }

            if (typeof(err) === 'object' && typeof(err.result) === 'number') {
                return err;
            }

            return {result: Result.Fail};
        });
    }, (err) => {
        account_logger.error('mongoTask acquire ERROR', err);
        return {result: Result.Fail};
    });
}

userDao.createToken = function () {
    return 'token-' + uuid.v4().replace(/-/g, '');
};

