var Spiders = require('./lib/spiders');

var spiders = new Spiders('Demos');


var urls = ['www.baidu.com', 'http://www.360.com', 'http://www.163.com', 'http://www.qq.com', 'http://www.qq.com'];
var urls2 = ['http://www.hao123.com', 'https://www.github.com', 'http://www.qq.com', 'http://www.qq.com'];


function demo(name, urls) {

    var demo = spiders.create(name);

    function parse(result) {
        console.log('loaded:' + result.url + ' (' + result.use + 'ms) @' + name);
    }

    // 加载错误事件
    demo.event.on('error', function (error) {
        console.error('error @' + name + '\nerror:', error);
    });
    // 加载完成事件
    demo.event.on('succeed', parse);
    // 处理完成事件
    demo.event.on('finished', function () {
        console.log('finished @' + name);
    });

    // 入队事件
    demo.event.on('queue', function (url) {
        console.log('In Queue Url:' + url + ' @' + name);
    });


    console.log('Spider:' + demo.getName());


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
}

demo('demo1', urls);
demo('demo2', urls2);

console.log('spiders count:' + spiders.getCount());