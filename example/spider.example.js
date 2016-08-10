var spider = require('./lib/spider');

(function demo() {
    var demo = new spider('demo');

    var urls = ['www.baidu.com', 'http://www.360.com', 'http://www.163.com', 'http://www.qq.com', 'http://www.qq.com'];


    function parse(result) {
        // console.log('事件触发:loaded');
        // console.log('result.use:' + result.use);

        console.log('loaded:' + result.url + ' (' + result.use + 'ms)');
    }


    // 错误
    demo.event.on('error', function (error) {
        console.log('事件触发:error');
        console.error('@error\nerror:', error);
    });
    // 加载完成事件
    demo.event.on('succeed', parse);
    // 处理完成事件
    demo.event.on('finished', function () {
        console.log('事件触发:finished');
    });

    // 入队事件
    demo.event.on('queue', function (url) {
        console.log('In Queue Url:', url);
    });

    console.log('demo:' + demo.getName());


    demo.url.push(urls).then(function (result) {
        console.log('push urls:' + urls + ' (' + result + ')');
    }, function (error) {
        console.log(error);
    });

    demo.url.getCount().then(function (result) {
        console.log('count:' + result);
    }, function (error) {
        console.log(error);
    });

    demo.start();
})();



