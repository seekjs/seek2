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
    document.body.innerHTML = view.getHTML(model);

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

module.exports = app;