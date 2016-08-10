var spider = require('./spider');



module.exports = function Spiders(name) {

    var private = {
        name: name,
        list: [],
    };


    var public = {
        // 获取爬虫名称
        getName: function () {
            return private.name;
        },
        // 设置爬虫名称
        setName: function (name) {
            private.name = name;
        },
        // 创建
        create: function (name) {
            var spd = new spider(name);
            private.list.push({
                name: name,
                spider: spd,
            });
            return spd;
        },
        // 数量
        getCount: function () {
            return private.list.length;
        },

    };

    // 构造函数
    public.setName(name);
    return public;
};
