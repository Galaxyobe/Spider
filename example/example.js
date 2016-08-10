var Group = require('../index').Group,
    Spiders = require('../index').Spiders;


var urls = [
    'http://allegro.pl/listing/listing.php?bmatch=s0-ele-1-4-0629&search_scope=&string=SZKŁO+HARTOWANE',
    'http://allegro.pl/listing/listing.php?string=SZKŁO+HARTOWANE&bmatch=s0-ele-1-4-0629&p=2',
    'http://allegro.pl/listing/listing.php?string=SZKŁO+HARTOWANE&bmatch=s0-ele-1-4-0629&p=3',
    'http://allegro.pl/listing/listing.php?string=SZKŁO+HARTOWANE&bmatch=s0-ele-1-4-0629&p=4'
];




var urls2 = [
    'https://www.google.com',
    'http://allegro.pl',
    'http://www.baidu.com',
    'http://www.bing.com'
];


var spiders = new Spiders('demo');

Group.push(spiders);

console.log(Group.length);

function demo(name, urls) {

    var demo = spiders.create(name);

    demo.setConfig({
        show: true,
        autoHideMenuBar: true,
        gotoTimeout: 80000,
        switches: {
            'proxy-server': '127.0.0.1:1080',
            'ignore-certificate-errors': true
        },
    });

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
    demo.event.on('finished', function (report) {
        console.log('finished @' + name + ' report:' + JSON.stringify(report));
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

//demo('demo1', urls);
//demo('demo2', urls2);


var urls3 = [
    'https://www.google.com',
    'www.baidu.com',
];

function demo3(name,urls) {

    var demo = spiders.create(name);

    demo.setConfig({
        show: false,
        autoHideMenuBar: true,
        gotoTimeout: 80000,
        wait:3000,
        switches: {
            'proxy-server': '127.0.0.1:1080',
            'ignore-certificate-errors': true
        },
    });

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
    demo.event.on('finished', function (report) {
        console.log('finished @' + name + ' report:' + JSON.stringify(report));
    });

    // 入队事件
    demo.event.on('queue', function (url) {
        console.log('In Queue Url:' + url + ' @' + name);
    });


    console.log('Spider:' + demo.getName());


    // demo.url.push(urls).then(function (result) {
    //     console.log('push urls:' + urls + ' (' + result + ')');
    // }, function (error) {
    //     console.log(error);
    // });

    // demo.start();

    // demo.restart();

    // demo.estart();

    demo.init();
}

demo3('Demo3',urls3);
