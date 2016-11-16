/**
 * Created by likaituan on 16/10/19.
 */

var urlParse = require("url").parse;

var View = require("sys.view");
var event = require("sys.event");
var data_bind = require("sys.data_bind");
var data_part = require("sys.data_part");
var lang = require("sys.lang");
var template = require("sys.template");
var pipe = require("sys.pipe");

var view;
var _view;
var cfg = {};


//解析Hash
var parseHash = function(){
    _view = {};
    _view.type = "main";
    _view.uri = location.hash && location.hash.slice(1) || app.iniPage;
    _view.query = urlParse(_view.uri, true).query || null;
    _view.params = _view.uri.split("?")[0].split("/");

    _view.page = _view.params.shift();
    if(_view.params.length==1){
        _view.params = {id: _view.params[0]};
    }
    _view.url = `${cfg.page}${_view.page}.sk`;

    if(window.modules){
        view = new View(app);
        Object.assign(view, viewrequire("page."+_view.page));
        parseView();
    }else {
        parseSkPage();
    }
};

//解析.sk页面
var parseSkPage = function(){
    var css,tp,js;
    var diy = {};
    if(_view.url) {
        var code = require(_view.url);
        css = /<style.*?>([\s\S]+?)<\/style>/.test(code) && RegExp.$1;
        tp = /<template.*?>([\s\S]+?)<\/template>/.test(code) && RegExp.$1;
        js = /<script.*?>([\s\S]+?)<\/script>/.test(code) && RegExp.$1;
        code.replace(/<:(.*?)>([\s\S]+?)<\/:*?>/g, function(_,key,val){
            diy[key] = val;
        });
    }else{
        css = cfg.css && require(`${cfg.css}/${_view.page}.css`) || "";
        tp = cfg.tp && require(`${cfg.tp}/${_view.page}.html`) || "";
        js = cfg.js && require(`${cfg.js}/${_view.page}.js`) || "";
    }
    if(!css && !tp && !js && Object.keys(diy).length==0){
        tp = code.trim();
    }
    if(!js && !tp){
        throw `the "${file}" page mush has a script or template`
    }

    css && parseCss(css);
    view = new View(app);
    view = parseModule(js,_view.page+".sk", view);

    view.getHTML = tp && template.getFun(tp);
    view.diy = diy;

    parseView();
};

//解析view
var parseView = function () {
    Object.assign(view, _view);
    view.type!="plugin" && pipe.mergeObj(view, app.viewEx, true);

    view.go = app.go;
    app.onInit && app.onInit(view);

    if(view.onInit){
        if(view.onInit.length>0){
            return view.onInit(parseHTML);
        }
        view.onInit();
    }
    parseHTML();
};

//解析样式
var parseCss = function (code) {
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = code;
    document.head.appendChild(style);
};

//解析HTML
var parseHTML = function () {
    var box = ({
        "plugin": document.body,
        "main": app.box,
        "sub": view.box
    })[view.type];

    app.onRenderBefore && app.onRenderBefore(view);
    view.onRenderBefore && view.onRenderBefore();

    var model = view.model || view;
    var html = view.getHTML.call(model, pipe);
    if(view.type=="plugin") {
        box.insertAdjacentHTML("beforeEnd", html);
        view.ui = box.lastElementChild;
    }else{
        box.innerHTML = html;
        view.ui = box.firstElementChild;
    }

    view.display===false && view.hide();
    if(view.type=="plugin"){
        app.plugin[view.id] = view;
    }

    app.onRender && app.onRender(view);
    //View.setRender(app,view);
    view.onRender && view.onRender();

    data_bind.parse(box, view);
    data_part.parse(box, view, View, app);
    event.parse(box, view);
};



var app = {};
app.plugin = {};
app.viewEx = {};
app.pipeEx = {};

//配置信息
app.config = function (_cfg) {
    pipe.mergeObj(cfg, _cfg);
};

//添加view扩展
app.addView = function(viewEx){
    pipe.mergeObj(app.viewEx, viewEx, true);
};

//添加pipe扩展
app.addPipe = function(pipeEx){
    pipe.mergeObj(app.pipeEx, pipeEx, true);
};

//使用插件
app.usePlugin = function(pluginName, ops={}){
    _view = {};
    _view.type = ops.type || "plugin";
    _view.id = pluginName.split("-").pop();
    _view.uri = pluginName;
    _view.url = `/node_modules/${pluginName}/index.sk`;
    _view.page = pluginName;
    _view.box = ops.box || document.body;
    _view.display = ops.display;
    parseSkPage();
};

//初始化
app.init  = function (page) {
    document.body.insertAdjacentHTML("afterBegin", '<div class="sk-app"></div>');
    app.box = document.body.firstElementChild;

    pipe.mergeObj(pipe, app.pipeEx, true);
    app.iniPage = page;
    parseHash();
    window.onhashchange = parseHash;
};

//跳转
app.go = function (page) {
    if(/^https?:\/\//.test(page)){
        window.open(page);
    }else{
        location.hash = page;
    }
};

app.render = parseHTML;

module.exports = app;