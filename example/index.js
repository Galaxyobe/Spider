var Nightmare = require('nightmare');
var nightmare = Nightmare({
    show: true,
    autoHideMenuBar: true,
    switches: {
        'proxy-server': '127.0.0.1:1080',
        'ignore-certificate-errors': true
    },
});
var cheerio = require('cheerio');

// nightmare
//   .goto('http://yahoo.com')
//   .type('form[action*="/search"] [name=p]', 'github nightmare')
//   .click('form[action*="/search"] [type=submit]')
//   .wait('#main')
//   .evaluate(function () {
//     return document.querySelector('#main .searchCenterMiddle li a').href
//   })
//   .end()
//   .then(function (result) {
//     console.log(result)
//   })
//   .catch(function (error) {
//     console.error('Search failed:', error);
//   });

//var jquery = require('jquery')

var products = {}

products.baseUrl = 'http://allegro.pl';
products.searchKeyWord = 'SZKŁO+HARTOWANE';



products.list = [];



function search() {

    var t = Date.now();
    nightmare
        .goto(products.baseUrl)
        .insert('#main-search', products.searchKeyWord)
        .click('#main-search > input')
        .wait('#wrapper')
        // .click('#listing > div.listing-wrapper > ul > li.next > a')
        // .wait('#wrapper')
        .evaluate(function () {
            return {
                url: document.location.href,
                document: document.body.innerHTML,
            };
        })
        .end()
        .then(function (result) {

            console.log('Loading:' + result.url + ' (use:' + (Date.now() - t) / 1000 + 's)')
            t = Date.now();
            //console.log(result.document)
            var $ = cheerio.load(result.document);

            products.searchUrl = result.url

            $(".offer-info").each(function (idx, element) {
                products.list.push({
                    name: $(element).find('.offer-title').text(),
                    href: $(element).find('.offer-title').attr('href'),
                    price: $(element).find('.offer-price').find('.buy-now').find('.statement').text().replace(/\,/g, '.').replace(/[^0-9.]/ig, ""),
                    purchasers: $(element).find('.bid-count').find('.label').text().replace(/[^0-9]/ig, ""),
                })
                count++
                // console.log('index:' + idx +
                //     ' name:' + $(element).find('.offer-title').text() +
                //     ' href:' + $(element).find('.offer-title').attr('href') +
                //     ' price:' + $(element).find('.offer-price').find('.buy-now').find('.statement').text().replace(/\,/g, '.').replace(/[^0-9.]/ig, "") +
                //     ' purchasers:' + $(element).find('.bid-count').find('.label').text().replace(/[^0-9]/ig, "")
                // );
            });

            products.totalPages = $("#listing > div.offers-options > ul > li .last").text();

            console.log('Parse:' + ' (use:' + (Date.now() - t) / 1000 + 's)')
            //console.log(JSON.stringify(products))
        })
        .catch(function (error) {
            console.error('Search failed:', error);
        });
}

function getProductList(url, keyWord, page) {
    var t = Date.now();
    var searchParam = '/listing/listing.php?string=';
    var pageParam = '&bmatch=base-relevance-ele-1-3-0629&p=';

    console.log(url + searchParam + keyWord + pageParam + page);

    nightmare
        .goto(url + searchParam + keyWord + pageParam + page)
        .wait('#wrapper')
        .evaluate(function () {
            return {
                url: document.location.href,
                document: document.body.innerHTML,
            }
        })
        .end()
        .then(function (result) {

            console.log('Loading:' + result.url + ' (use:' + (Date.now() - t) / 1000 + 's)')
            t = Date.now();
            //console.log(result.document)
            var $ = cheerio.load(result.document);
            var count = 0
            $(".offer-info").each(function (idx, element) {
                products.list.push({
                    name: $(element).find('.offer-title').text(),
                    href: $(element).find('.offer-title').attr('href'),
                    price: $(element).find('.offer-price').find('.buy-now').find('.statement').text().replace(/\,/g, '.').replace(/[^0-9.]/ig, ""),
                    purchasers: $(element).find('.bid-count').find('.label').text().replace(/[^0-9]/ig, ""),
                })
                count++
                // console.log('index:' + idx +
                //     ' name:' + $(element).find('.offer-title').text() +
                //     ' href:' + $(element).find('.offer-title').attr('href') +
                //     ' price:' + $(element).find('.offer-price').find('.buy-now').find('.statement').text().replace(/\,/g, '.').replace(/[^0-9.]/ig, "") +
                //     ' purchasers:' + $(element).find('.bid-count').find('.label').text().replace(/[^0-9]/ig, "")
                // );
            });

            console.log('get ' + count + '\'s products (use:' + (Date.now() - t) / 1000 + 's)')
            //console.log(JSON.stringify(products))
        })
        .catch(function (error) {
            console.error('Search failed:', error);
        });
}

function getProductDetails(url) {
    var t = Date.now();
    nightmare
        .goto(url)
        .wait('#showitem-main')
        .evaluate(function () {
            return {
                url: document.location.href,
                domain: document.location.protocol + '//' + document.location.host,
                document: document.body.innerHTML,
            }
        })
        .end()
        .then(function (result) {

            console.log('Loading ' + result.url + ' (use:' + (Date.now() - t) / 1000 + 's)')
            t = Date.now();
            //console.log(result.document)
            var $ = cheerio.load(result.document);

            var details = {};
            details.store = {};
            details.product = {};

            //产品名称
            details.product.name = $("#showitem-main > section:nth-child(6) > div > h1").text().replace(/(^\s*)|(\s*$)/g, "");


            //产品购买人数
            details.product.purchasers = parseInt($("#preinfo-container > div > div.col-xs-12.col-sm-5.col-md-5.buyers-count > span > strong:nth-child(1)").text())
            //产品销量
            details.product.sales = parseInt($("#preinfo-container > div > div.col-xs-12.col-sm-5.col-md-5.buyers-count > span > strong:nth-child(2)").text())
            //卖家店铺名字
            details.store.name = $("#seller-details > div.btn.btn-default.btn-user > a > span").text()
            //卖家店铺信息
            details.store.info = result.domain + $("#seller-details > div.btn.btn-default.btn-user > a").attr('href')
            //卖家店铺
            details.store.shop = result.domain + $("#seller-details > ul > li:nth-child(2) > a").attr('href')
            //产品销售价格
            details.product.price = parseFloat($("#purchase-form > div.col-xm-6.col-ss-7 .price").attr('data-price'))
            //产品库存
            details.product.stock = parseInt($("#purchase-form > div.col-xm-6.col-ss-7 > div:nth-child(2) > span").text().replace(/[^0-9]/ig, ""))
            //产品发货地址
            details.product.deliveryAddr = $("#showitem-main > section:nth-child(8) > div.col-xs-12.col-sm-8.col-md-7.buynow-container > div.row.after > div:nth-child(1) > ul:nth-child(4) > li:nth-child(1) > strong").text()
            //产品发货时间
            details.product.deliveryTime = $("#showitem-main > section:nth-child(8) > div.col-xs-12.col-sm-8.col-md-7.buynow-container > div.row.after > div:nth-child(1) > ul:nth-child(4) > li:nth-child(2) > strong").text()
            //产品浏览次数
            details.product.views = parseInt($("#counter > p > strong").text().replace(/[^0-9]/ig, ""))
            //产品所示类别
            details.product.category = $("#seller-details > ul > li:nth-child(1) > a > span > strong").text()
            //卖家个人信息
            details.store.seller = result.domain + '/sellerInfoFrontend/' + details.store.info.replace(/[^0-9]/ig, "") + '/aboutSeller'

            var seller = {}
            seller.contact = []

            //判断在产品页面是否有卖家信息页的联系地址
            if ($("#showitem-main").find("div.seller-contact-data.seller-user-data.col-xm-10").length) {
                seller.cname = $("div.seller-contact-box.seller-user-cname > strong").text()
                seller.street = $("div.seller-contact-box.seller-user-street").text()
                seller.city = $("div.seller-contact-box.seller-user-city").text()
                seller.nip = $("div.seller-contact-box.seller-user-nip").text().replace(/[^0-9-]/ig, "")
                seller.regon = $("div.seller-contact-box.seller-user-regon").text().replace(/[^0-9]/ig, "")
                //判断是否有联系电话或邮箱
                if ($("#showitem-main").find("div.seller-contact-data.col-xm-10 > ul").length) {

                    $("div.seller-contact-data.col-xm-10 > ul > li").each(function (idx, element) {
                        seller.contact.push($(element).find('a').attr('href'))
                        //console.log('index:'+idx+' name:'+$(element).find('a').text()+' href:'+$(element).find('a').attr('href'));
                    });
                }
                console.log('seller:' + JSON.stringify(seller))
            }

            console.log('details:' + JSON.stringify(details))
            console.log('(use:' + (Date.now() - t) / 1000 + 's)')
            //console.log(JSON.stringify(products))
        })
        .catch(function (error) {
            console.error('Search failed:', error);
        });
}

function getSellerDetails(url) {
    var t = Date.now();
    nightmare
        .goto(url)
        .wait('#wrapper')
        .evaluate(function () {
            return {
                url: document.location.href,
                domain: document.location.protocol + '//' + document.location.host,
                document: document.body.innerHTML,
            }
        })
        .end()
        .then(function (result) {

            console.log('Loading ' + result.url + ' (use:' + (Date.now() - t) / 1000 + 's)')
            t = Date.now();
            //console.log(result.document)
            var $ = cheerio.load(result.document);

            var seller = {}
            seller.contact = []

            //#sellerUserData > div > div.col-ss-12.col-sm-9.col-md-10 > div > div.seller-info-data.contact-user-data.col-ss-12.col-sm-6.col-md-6 > section > div.seller-contact-data.seller-user-data.col-xm-10
            //判断在产品页面是否有卖家信息页的联系地址
            if ($("#sellerUserData").find("div.seller-contact-data.seller-user-data.col-xm-10").length) {
                seller.cname = $("div.seller-contact-box.seller-user-cname > strong").text()
                seller.street = $("div.seller-contact-box.seller-user-street").text()
                seller.city = $("div.seller-contact-box.seller-user-city").text()
                seller.nip = $("div.seller-contact-box.seller-user-nip").text().replace(/[^0-9-]/ig, "")
                seller.regon = $("div.seller-contact-box.seller-user-regon").text().replace(/[^0-9]/ig, "")
                //#showItemSellerInfo > section:nth-child(2) > div > div.seller-info-data.col-ss-6.col-sm-4.col-md-5 > section > div.seller-contact-data.col-xm-10 > ul > li
                //判断是否有联系电话或邮箱
                if ($("#showItemSellerInfo").find("div.seller-contact-data.col-xm-10 > ul").length) {
                    $("div.seller-contact-data.col-xm-10 > ul > li").each(function (idx, element) {
                        seller.contact.push($(element).find('a').attr('href'))
                        //console.log('index:'+idx+' name:'+$(element).find('a').text()+' href:'+$(element).find('a').attr('href'));
                    });
                }
                console.log('seller:' + JSON.stringify(seller))
            }

            console.log('(use:' + (Date.now() - t) / 1000 + 's)')

        })
        .catch(function (error) {
            console.error('Search failed:', error);
        });
}

function getStoreDetails(url) {
    var t = Date.now();
    nightmare
        .goto(url)
        .wait('#wrapper')
        .evaluate(function () {
            return {
                url: document.location.href,
                domain: document.location.protocol + '//' + document.location.host,
                document: document.body.innerHTML,
            };
        })
        .end()
        .then(function (result) {

            console.log('Loading ' + result.url + ' (use:' + (Date.now() - t) / 1000 + 's)')
            t = Date.now();
            //console.log(result.document)
            var $ = cheerio.load(result.document);

            var store = {}

            //店铺评级
            store.rating = $("div.main-title-breadcrumbs.clearfix > div > h1 > span > span.user-rating").text().replace(/[^0-9]/ig, "")
            //店铺注册时间
            store.since = $("#pagecontent1 > div.summaryBox > div.additionalInfoBox.roundCornerWhiteBG.corAll5 > ul > li:nth-child(1)").text().replace(/[^0-9.,:]/ig, "")
            //店铺店主最后登录时间
            store.loginLast = $("#pagecontent1 > div.summaryBox > div.additionalInfoBox.roundCornerWhiteBG.corAll5 > ul > li:nth-child(2)").text().replace(/[^0-9.,:]/ig, "")
            //店铺好评率
            store.feedback = $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.innerGreenBox.corAll5 > div.igbCol1 > span").text()
            //店铺最后7天的好评率
            store.feedback7 = {
                positive: $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.feedbacksSummary.roundCornerWhiteBG.corAll5 > table > tbody > tr.pos > td:nth-child(2)").text(),
                neutrals: $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.feedbacksSummary.roundCornerWhiteBG.corAll5 > table > tbody > tr.neu > td:nth-child(2)").text(),
                negative: $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.feedbacksSummary.roundCornerWhiteBG.corAll5 > table > tbody > tr.neg > td:nth-child(2)").text(),
            }
            //店铺最后30天的好评率
            store.feedback30 = {
                positive: $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.feedbacksSummary.roundCornerWhiteBG.corAll5 > table > tbody > tr.pos > td:nth-child(3)").text(),
                neutrals: $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.feedbacksSummary.roundCornerWhiteBG.corAll5 > table > tbody > tr.neu > td:nth-child(3)").text(),
                negative: $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.feedbacksSummary.roundCornerWhiteBG.corAll5 > table > tbody > tr.neg > td:nth-child(3)").text(),
            }
            //店铺所有的好评率
            store.feedbackAll = {
                positive: $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.feedbacksSummary.roundCornerWhiteBG.corAll5 > table > tbody > tr.pos > td:nth-child(4)").text(),
                neutrals: $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.feedbacksSummary.roundCornerWhiteBG.corAll5 > table > tbody > tr.neu > td:nth-child(4)").text(),
                negative: $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.feedbacksSummary.roundCornerWhiteBG.corAll5 > table > tbody > tr.neg > td:nth-child(4)").text(),
            }
            //店铺买家/卖家的好评率
            store.feedbackBoth = {
                positive: $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.feedbacksSummary.roundCornerWhiteBG.corAll5 > table > tbody > tr.pos > td:nth-child(5)").text().replace(/\s+/g, ""),
                neutrals: $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.feedbacksSummary.roundCornerWhiteBG.corAll5 > table > tbody > tr.neu > td:nth-child(5)").text().replace(/\s+/g, ""),
                negative: $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.feedbacksSummary.roundCornerWhiteBG.corAll5 > table > tbody > tr.neg > td:nth-child(5)").text().replace(/\s+/g, ""),
            }
            //店铺销售评级
            store.salesratings = {
                "conformity of the description": $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.ratingSummary.roundCornerWhiteBG.corAll5 > ul > li:nth-child(1) > div > span").text(),
                "contact the Seller": $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.ratingSummary.roundCornerWhiteBG.corAll5 > ul > li:nth-child(2) > div > span").text(),
                "delivery time": $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.ratingSummary.roundCornerWhiteBG.corAll5 > ul > li:nth-child(3) > div > span").text(),
                "shipping cost": $("#pagecontent1 > div.summaryBox > div.overallBox.roundCornerGreyBG.corAll5 > div.ratingSummary.roundCornerWhiteBG.corAll5 > ul > li:nth-child(4) > div > span").text(),
            }
            //最近30天评论页数
            store.comments = parseInt($("#maWrapper > div > div:nth-child(2) > ul > li.next").prev().text().replace(/[^0-9]/ig, ""))

            console.log('store:' + JSON.stringify(store));

            console.log('(use:' + (Date.now() - t) / 1000 + 's)')

        })
        .catch(function (error) {
            console.error('Search failed:', error);
        });
}

function getStoreProductList(url, page) {
    var t = Date.now();
    nightmare
        .goto(url)
        .wait('#listing')
        .evaluate(function () {
            return {
                url: document.location.href,
                domain: document.location.protocol + '//' + document.location.host,
                document: document.body.innerHTML,
            }
        })
        .end()
        .then(function (result) {

            console.log('Loading ' + result.url + ' (use:' + (Date.now() - t) / 1000 + 's)')
            t = Date.now();
            //console.log(result.document)
            var $ = cheerio.load(result.document);


            var shop = {}

            shop.subcategories = []
            shop.list = []

            $("#sidebar-categories > div.widget-content > nav > ul > li").each(function (idx, element) {

                var count = $(element).find('.count').text().replace(/[^0-9]/ig, "")
                if (count != '0') {
                    shop.subcategories.push({
                        name: $(element).find('.name').text(),
                        count: count,
                    })
                }
                //console.log('index:' + idx + ' name:' + $(element).find('.name').text() + ' count:' + $(element).find('.count').text().replace(/[^0-9]/ig, ""))
            });

            //#item-6064717805 > div > div.details > header > h2 > a
            shop.count = 0
            $(".offer").each(function (idx, element) {
                //shop.list.push({ name: +$(element).find('a').text(), href: $(element).find('a').attr('href'),purchasers:$() })
                shop.count++
                console.log('index:' + idx +
                    ' name:' + $(element).find('.details').find('a').text() +
                    ' href:' + $(element).find('.details').find('a').attr('href') +
                    ' price:' + $(element).find('.price').find('span.buy-now.dist').text().replace(/\,/g, '.').replace(/[^0-9.]/ig, "") +
                    ' currency:' + $(element).find('.price').find('span.buy-now.dist').find('.currency').text() +
                    ' purchasers:' + $(element).find('.details').find('.popularity').text().replace(/[^0-9]/ig, "") +
                    ' stock:' + $(element).find('.details').find('.amount').text().replace(/[^0-9]/ig, "")
                );


            });

            shop.totalPages = parseInt($("#pager-top > ul > li.suffix").next().text())


            console.log('shop:' + JSON.stringify(shop));

            console.log('(use:' + (Date.now() - t) / 1000 + 's)')

        })
        .catch(function (error) {
            console.error('Search failed:', error);
        });
}



var fs = require("fs");
function demo() {
    var t = Date.now();
    var html = fs.readFileSync("./html/product-list.html", "utf-8");

    var $ = cheerio.load(html);
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    console.log('(use:' + (Date.now() - t) / 1000 + 's)')

}

//getProductList(products.baseUrl, products.searchKeyWord, 10);

getProductDetails('http://allegro.pl/etui-case-samsung-galaxy-j5-szklo-hartowane-i6293370271.html');

//getSellerDetails('http://allegro.pl/sellerInfoFrontend/37003231/aboutSeller');

//getStoreDetails('http://allegro.pl/show_user.php?uid=3886580')
