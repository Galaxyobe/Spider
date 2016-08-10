
var redis = require("redis"),
    Q = require('q'),
    Nightmare = require('nightmare'),
    EventEmitter = require('events').EventEmitter,
    async = require('async');


// 加载网页
function LoadPage(url, config) {

    var deferred = Q.defer();
    var t = Date.now();
    var nightmare = new Nightmare(config);

    // console.info('Spider:' + config.name + ' Open ' + url);

    nightmare
        .goto(url)
        .wait(config.wait)
        .evaluate(function () {
            return {
                url: document.location.href,    // 当前URL
                domain: document.location.protocol + '//' + document.location.host,// 当前域名
                document: document.body.innerHTML,// 下载的网页
            };
        })
        .end()
        .then(function (result) {
            result.use = Date.now() - t;// 耗时 单位：毫秒
            // console.log('Loading succeed:' + result.url + ' (use:' + (result.use) / 1000 + 's)');
            deferred.resolve(result);
        })
        .catch(function (error) {
            // console.error('Loading failed:' + url + ' (use:' + (Date.now() - t) / 1000 + 's) @nightmare\nerror:', error);
            error.use = Date.now() - t;// 耗时 单位：毫秒
            deferred.reject(error);
        });

    return deferred.promise;
}

module.exports = function Spider(name) {

    //私有变量
    var private = {
        id: '', // 标识符
        name: '', // 名称
        config: { // 下载器配置
            show: false,
            autoHideMenuBar: true,
            gotoTimeout: 30000,
        },
        url: {
            list: { name: '-spider-url-list', count: 0 },// 待抓取的URL列表 名称，计数
            failed: { name: '-spider-url-failed', count: 0 },// 抓取失败的URL列表 名称，计数
            succeed: { name: '-spider-url-succeed', count: 0 },// 已抓取的URL列表 名称，计数
            // 清空
            empty: function () {
                private.url.list.count = 0;
                private.client.del(private.url.list.name);
                private.client.del(private.url.failed.name);
                private.client.del(private.url.succeed.name);
            },
            // 数量
            count: function (list) {
                var deferred = Q.defer();
                private.client.scard(list.name, function (err, count) {
                    if (err) {
                        deferred.reject(error);
                        return deferred.promise;
                    }
                    list.count = count;
                    deferred.resolve(count);// 集合的数量。 当集合 key 不存在时，返回 0 。
                });
                return deferred.promise;
            },
            // 添加
            push: function (list, urls) {
                var deferred = Q.defer();
                private.client.sadd(list.name, urls, function (err, count) {
                    if (err) {
                        deferred.reject(error);
                        return deferred.promise;
                    }
                    // console.log('count:' + count);
                    list.count += count;
                    deferred.resolve(count);// 被添加到集合中的新元素的数量，不包括被忽略的元素。
                });
                return deferred.promise;
            },
            // 单个移出
            pop: function (list) {
                var deferred = Q.defer();
                private.client.spop(list.name, function (err, members) {
                    if (err) {
                        deferred.reject(error);
                        return deferred.promise;
                    }
                    list.count -= 1;
                    deferred.resolve(members);// 被移除的随机元素。 当集合不存在或是空集时，返回 nil 。

                });
                return deferred.promise;
            },
            // 移出
            pops: function (list, count) {

                var deferred = Q.defer();

                // 获取集合中的元素
                private.client.srandmember(list.name, count, function (err, members) {

                    if (err) {
                        deferred.reject(err);
                        return deferred.promise;
                    }

                    if (members.length) {
                        // 移除集合中的元素
                        private.client.srem(list.name, members, function (err, counts) {
                            if (err) {
                                deferred.reject(err);
                                return deferred.promise;
                            }
                            list.count -= counts;
                            deferred.resolve(members);// 只提供集合 key 参数时，返回一个元素；如果集合为空，返回 nil 。 如果提供了 count 参数，那么返回一个数组；如果集合为空，返回空数组。
                        });
                    }
                    else {
                        deferred.resolve(members);
                    }
                });

                return deferred.promise;
            },
            // 删除
            del: function (list, urls) {
                var deferred = Q.defer();
                private.client.srem(list.name, urls, function (err, counts) {
                    if (err) {
                        deferred.reject(error);
                        return deferred.promise;
                    }
                    private.url.list.count -= counts;
                    deferred.resolve(counts);// 被成功移除的元素的数量，不包括被忽略的元素。
                });
                return deferred.promise;
            },

        },
        event: new EventEmitter(), // 事件
        client: redis.createClient('6379', '127.0.0.1'), // redis客户端
        worker: { // 工作队列            
            queue: null,  /*  队列  */
            maxOccurs: 2, // 最大并发数量，默认值：2个
        },
        loadPage: function (url, config) { // 下载网页
            var deferred = Q.defer();
            LoadPage(url, config).then(function (result) {
                // console.log('Loading succeed:' + url + ' @loadPage');
                private.event.emit('succeed', result);
                deferred.resolve();
            }, function (error) {
                // console.error('Loading failed:' + url + ' @loadPage\nerror:', error);
                private.event.emit('error', error);
                deferred.reject(error);
            });
            return deferred.promise;
        },
    };

    // 公有变量
    var public = {
        // 获取爬虫标识符
        getId: function () {
            return private.id;
        },
        // 设置爬虫标识符
        setId: function (id) {
            private.id = id;
        },
        // 获取爬虫名称
        getName: function () {
            return private.name;
        },
        // 设置爬虫名称
        setName: function (name) {
            private.name = name;
            private.url.list.name = name.toLowerCase() + private.url.list.name;
            private.url.failed.name = name.toLowerCase() + private.url.failed.name;
            private.url.succeed.name = name.toLowerCase() + private.url.succeed.name;
        },
        // 获取爬虫下载器配置
        getConfig: function () {
            return private.config;
        },
        // 设置爬虫下载器配置
        setConfig: function (config) {
            private.config = config;
            private.config.name = private.name;
        },
        // 获取最大并发数量
        getMaxOccurs: function () {
            return private.worker.maxOccurs;
        },
        // 设置最大并发数量
        setMaxOccurs: function (occurs) {
            private.worker.maxOccurs = occurs;
        },
        // url操作
        url: {
            // 获取list的数量
            getCount: function () {
                return private.url.count(private.url.list);
            },
            // 添加
            push: function (urls) {
                return private.url.push(private.url.list, urls);
            },
        },
        // 事件
        event: private.event,
        // 初始化 - 清空列表\失败\成功三者的队列
        init: function () {
            private.url.empty();
        },
        // 开始执行 - 执行列表中的队列
        start: function () {
            // console.log(private.name + ' start...');
            inQueue();
        },
        // 重新开始 - 把失败\成功队列移动到列表队列，开始任务
        restart: function () {
            // console.log(private.name + ' restart...');
            private.client.sunionstore(private.url.list.name, private.url.failed.name, private.url.succeed.name);
            inQueue();
        },
        // 错误开始 - 把失败队列移动到列表队列，开始任务
        estart: function () {
            // console.log(private.name + ' estart...');
            private.client.sunionstore(private.url.list.name, private.url.failed.name);
            inQueue();
        },
        // 马上执行
        imdtly: function (urls) {
            urls.forEach(function (url) {
                private.worker.queue.unshift({
                    url: url,
                    config: private.config,
                    run: private.loadPage,
                }, function (error, url) {
                    workerDone(error, url);
                });
            }, this);
        },
        // 停止
        stop: function () {
            private.worker.queue.kill();
        },
        // 状态
        getStatus: function () {
            if (null === private.worker.queue) {
                return {};
            }
            return {
                length: private.worker.queue.length,
                started: private.worker.queue.started(),
                concurrency: private.worker.queue.concurrency,
                running: private.worker.queue.running(),
                paused: private.worker.queue.paused,
                idle: private.worker.queue.idle(),
                workersList: private.worker.queue.workersList(),
            };
        },
    };

    // 入队函数
    function inQueue() {
        private.url.pops(private.url.list, private.worker.maxOccurs * 2).then(function (urls) {
            urls.forEach(function (url) {
                private.worker.queue.push({
                    url: url,
                    config: private.config,
                    run: private.loadPage,
                }, function (error, url) {
                    workerDone(error, url);
                });
                private.event.emit('queue', url);
            }, this);

        }, function (error) {
            console.error(error);
        });
    }

    // 任务完成
    function workerDone(error, url) {
        if (error) {
            // 失败-加入到失败列表            
            private.url.push(private.url.failed, url).then(function (result) {
                // console.log('failed count:' + private.url.failed.count);
                // console.log('push failed urls:' + url + ' (' + result + ')');
            }, function (error) {
                console.error(error);
            });
        }
        else {
            // 成功-加入到成功列表
            private.url.push(private.url.succeed, url).then(function (result) {
                // console.log('succeed count:' + private.url.succeed.count);
                // console.log('push succeed urls:' + url + ' (' + result + ')');
            }, function (error) {
                console.error(error);
            });
        }
    }

    // 构造函数
    public.setName(name);

    // redis连接错误
    private.client.on("error", function (error) {
        console.error(error);
    });


    (function init() {
        private.worker.queue = async.queue(function (task, callback) {
            // console.log('load:' + task.url);
            task.run(task.url, task.config).then(function (result) {
                callback(null, task.url);
            }, function (error) {
                // console.error('loading failed:' + task.url + ' @task\nerror:', error);
                callback(error, task.url);
            });
        }, private.worker.maxOccurs);

        // 当最后一个任务交给worker时，将调用该函数
        private.worker.queue.empty = function () {
            // console.log(private.worker.queue.workersList());
            inQueue();
        };

        // 当所有任务都执行完以后，将调用该函数
        private.worker.queue.drain = function () {

            // 获取列表的数量
            async.parallel({
                list: function (done) {
                    private.url.count(private.url.list).then(function (count) {
                        done(null, count);
                    }, function (error) {
                        done(error, null);
                    });
                },
                failed: function (done) {
                    private.url.count(private.url.failed).then(function (count) {
                        done(null, count);
                    }, function (error) {
                        done(error, null);
                    });
                },
                succeed: function (done) {
                    private.url.count(private.url.succeed).then(function (count) {
                        done(null, count);
                    }, function (error) {
                        done(error, null);
                    });
                },
            }, function (error, result) {
                private.event.emit('finished', result);
            });
        };
    } ());

    return public;
};
