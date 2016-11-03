/**
 * Created by likaituan on 16/10/19.
 */

var View = require("sys.view");
var event = require("sys.event");
var data_bind = require("sys.data_bind");
var $ = require("sys.pipe");
var url = require("url");

var app = {};
var view;

var cfg = {};

app.plugin = {};
app.viewEx = {};
app.pipeEx = {};

app.config = function (_cfg) {
    $.mergeObj(cfg, _cfg);
};

var getHash = function(){
    var uri = location.hash && location.hash.slice(1) || app.iniPage;
    var query = url.parse(uri, true).query || null;
    var params = uri.split("?")[0].split("/");

    var page = params.shift();
    if(params.length==1){
        params = {id: params[0]};
    }
    app.go2(page, params, query);
};

app.init  = function (page) {
    $.mergeObj($, app.pipeEx, true);
    app.iniPage = page;
    getHash();
    window.onhashchange = getHash;
};

//跳转
app.go = function (page) {
    if(/^https?:\/\//.test(page)){
        window.open(page);
    }else{
        location.hash = page;
    }
};

//跳转
app.go2 = function (page, params, query) {
    var file = `${cfg.path}${page}.sk`;
    var code = require(file);
    var jsCode = /<script.*?>([\s\S]+?)<\/script>/.test(code) && RegExp.$1;
    var cssCode = /<style.*?>([\s\S]+?)<\/style>/.test(code) && RegExp.$1;
    var templateCode = /<template.*?>([\s\S]+?)<\/template>/.test(code) && RegExp.$1;
    if(!cssCode && !templateCode && !jsCode){
        templateCode = code.trim();
    }
    if(jsCode){
        view = parseModule(jsCode);
    }else if(templateCode) {
        view = {};
    }else{
        throw `the "${page}" page mush has a script or template`
    }

    cssCode && app.parseCss(cssCode);
    var ops = {templateCode,page,params,query};
    $.mergeObj(view, app.viewEx, true);
    View.setInit(app,view,ops);
    app.render();
};

//解析样式
app.parseCss = function (code) {
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = code;
    document.head.appendChild(style);
};

//解析模版
app.render = function () {
    app.onInit && app.onInit(view);
    view.onInit && view.onInit();

    var model = view.model || view;
    var html = view.getHTML(model);
    var firstElement = [...document.body.children].shift();
    if(firstElement){
        document.body.removeChild(firstElement);
    }
    document.body.insertAdjacentHTML("afterBegin", html);

    app.onRender && app.onRender(view);
    View.setRender(app,view);
    view.onRender && view.onRender();

    event.parse(document.body, view);
    data_bind.parse(document.body, view);
};

//添加view扩展
app.addView = function(viewEx){
    $.mergeObj(app.viewEx, viewEx, true);
};

//添加pipe扩展
app.addPipe = function(pipeEx){
    $.mergeObj(app.pipeEx, pipeEx, true);
};

//获取当前所用的语言包
app.getLang = function(langObj, lang){
    if(!langObj){
        return {};
    }

    var o = {};
    for(var k in langObj){
        if(k!="getLang"){
            o[k] = langObj[k][lang];
        }
    }
    return o;
};


//JSON转换
var transferLangPack = function(json){
    if(!json.currentLang) {
        return json;
    }
    var newJson = {};
    for (var k in json) {
        if (k != "currentLang") {
            newJson[k] = {
                [json.currentLang] : json[k]
            };
        }
    }
    return newJson;
};

//语言包合并
var mergeLangPack = function(langPack, langPack2){
    var item,item2;
    for(var key in langPack2){
        item = langPack[key];
        if(!item) {
            throw `langPack not this key: ${key}`;
        }
        item2 = langPack2[key];
        for(var lang in item2) {
            item[lang]  = item2[lang];
        }
    }
    return langPack;
};

//使用插件
app.usePlugin = function(pluginName, ops){
    plugin.use(pluginName, ops);
};

var plugin = {
    use: function(pluginName, ops={}){
        var code = require(pluginName);
        log({code});

        var jsCode = /<script.*?>([\s\S]+?)<\/script>/.test(code) && RegExp.$1;
        var cssCode = /<style.*?>([\s\S]+?)<\/style>/.test(code) && RegExp.$1;
        var templateCode = /<template.*?>([\s\S]+?)<\/template>/.test(code) && RegExp.$1;
        if(!cssCode && !templateCode && !jsCode){
            templateCode = code.trim();
        }
        var plug = {};
        if(jsCode){
            plug = parseModule(jsCode);
        }else if(!templateCode) {
            throw `the "${page}" page mush has a script or template`
        }

        cssCode && app.parseCss(cssCode);
        var template = require("sys.template");
        plug.getHTML = template.compile(templateCode);
        this.render(plug);

        if(plug.langPack) {
            plug.langPack = transferLangPack(plug.langPack);
            if(ops.langPack){
                ops.langPack = transferLangPack(ops.langPack);
                plug.langPack = mergeLangPack(plug.langPack, ops.langPack);
            }
            plug.lang = app.getLang(plug.langPack, ops.lang || plug.defaultLang);
        }
        plug.show = function(){
            plug.ui.style.display = "block";
        };
        plug.name = pluginName;
        plug.id = ops.id || pluginName;
        app.plugin[plug.id] = plug;
        log({plug});
        return plug;
    },
    render: function(plug){
        plug.onInit && plug.onInit();

        var model = plug.model || plug;
        var html = plug.getHTML(model);
        document.body.insertAdjacentHTML("beforeEnd", html);
        plug.ui = [...document.body.children].pop();

        event.parse(plug.ui, plug);
        data_bind.parse(plug.ui, plug);
    }
};

module.exports = app;