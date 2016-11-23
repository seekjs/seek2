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
//pipe.local = localStorage;
//pipe.session = sessionStorage;

var view;
var _view;
var mainView;
var subViewList = [];
var cfg = {};


//解析Hash
var parseHash = function() {
    subViewList = [];
    var uri = location.hash && location.hash.slice(1) || app.iniPage;
    parseURI({
        type: "main",
        box: app.box,
        uri: uri
    });
};

//解析Hash
var parseURI = function(ops){
    _view = ops;
    _view.app = app;
    _view.query = urlParse(_view.uri, true).query || null;
    var params = _view.uri.split("?")[0].split("/");
    _view.page = params.shift();
    log(`step1.parseURI: uri=${_view.uri} type=${_view.type}`);
    _view.params = {};
    if(params.length % 2){
         _view.params.id = params.shift();
    }
    while(params.length){
        _view.params[params.shift()] = params.shift();
    }
    if(cfg.page && !_view.url) {
        _view.url = `${cfg.page+_view.page}.sk`;
    }

    if(window.modules) {
        var mid = _view.page.startsWith("seekjs-plugin-") ? _view.page : "page."+_view.page;
        _view = Object.assign(require(mid), _view);
        parseSkPage();
    }else{
        loadSkPage();
    }
};

//解析.sk页面
var loadSkPage = function() {
    var css, tp, js;
    var diy = {};
    if (_view.url) {
        var code = require(_view.url);
        css = /<style.*?>([\s\S]+?)<\/style>/.test(code) && RegExp.$1;
        tp = /<template.*?>([\s\S]+?)<\/template>/.test(code) && RegExp.$1;
        js = /<script.*?>([\s\S]+?)<\/script>/.test(code) && RegExp.$1;
        code.replace(/<:(.*?)>([\s\S]+?)<\/:*?>/g, function (_, key, val) {
            diy[key] = val;
        });
    } else {
        css = cfg.css && seekjs.getCode(`${cfg.css + _view.page}.css`) || "";
        tp = cfg.tp && seekjs.getCode(`${cfg.tp + _view.page}.html`) || "";
        js = cfg.js && seekjs.getCode(`${cfg.js + _view.page}.js`) || "";
    }
    log(`step2.parseSkPage: url=${_view.url}`);
    if (!css && !tp && !js && Object.keys(diy).length == 0) {
        tp = code.trim();
    }
    if (!js && !tp) {
        throw `the "${file}" page mush has a script or template`
    }
    _view.diy = diy;
    css && parseCss(css);
    if (/getHTML/.test(js)==false) {
        js += `\n\nexports.getHTML = function($){ ${template.getJsCode(tp || "")} };`;
    }
    _view = new View(app, _view);
    view = seekjs.parseModule(js, _view.page + ".sk", _view);
    parseSkPage();
};


//解析.sk页面
var parseSkPage = function(){

    //重新索引begin
    if(view.type=="plugin") {
        if(view.parent) {
            view.parent.plugin[view.id] = view;
        }else{
            app.plugin[view.id] = view;
        }
    }
    //重新索引end
    if(view.type=="main"){
        mainView = view;
    }
    view.plugin = {};
    parseView();
};

//解析view
var parseView = function () {
    view.type!="plugin" && pipe.mergeObj(view, app.viewEx, true);
    log(`step3.parseView: uri=${view.uri}`);

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
    log(`step4.parseHTML: uri=${view.uri}`);
    app.onRenderBefore && app.onRenderBefore(view);
    view.onRenderBefore && view.onRenderBefore();

    var model = view.model || view;
    var html = view.getHTML.call(model, pipe);
    if(view.type=="plugin") {
        if(view.ui){
            view.box.removeChild(view.ui);
        }
        view.box.insertAdjacentHTML("beforeEnd", html);
        view.ui = view.box.lastElementChild;
    }else{
        view.box.innerHTML = html;
        view.ui = view.box.firstElementChild;
    }
    view.display===false && view.hide();

    //因为页面刚开始usePlugin的时候拿不到view.ui, 这时补上
    for(var k in view.plugin) {
        if(view.plugin[k].type=="plugin") {
            view.plugin[k].box = view.plugin[k].box || view.ui;
        }
    }

    data_bind.parse(view.ui, view);
    parsePart(view.ui, view);
    event.parse(view.ui, view);
    chkSubView(view, view.ui);

    app.onRender && app.onRender(view);
    view.onRender && view.onRender();

    if(subViewList.length>0) {
        loadSubView();
    }else if(mainView){
        app.onLoad && app.onLoad(view);
        view.onLoad && view.onLoad();
        log("end: load complete!")
    }
};

//解析part
var parsePart = function(box, view){
    var partList = [...box.querySelectorAll("[data-part]")];
    log(`step5.parsePart: part=[${partList.map(x=>x.dataset.part)}]`);
    partList.forEach(x=>{
        var o = view[x.dataset.part] = new View(app);
        Object.assign(o, {
            id: x.dataset.part,
            name: x.dataset.part,
            box: x,
            ui: x,
            parent: view,
            root: mainView,
            render: function(){
                var html = o.parent.getHTML.call(o.parent.model || o.parent, pipe);
                var div = document.createElement("div");
                div.innerHTML = html;
                html = div.querySelector(`[data-part=${o.id}`).innerHTML;
                div = null;
                o.box.innerHTML = html;
                data_bind.parse(o.ui, o.parent);
                event.parse(o.ui, o.parent);
            }
        });
    });
};

var loadSubView = function(){
    var subView = subViewList.shift();
    parseURI(subView);
};

var chkSubView = function(view, box){
    var viewList = [...box.querySelectorAll("[data-view]")];
    viewList.forEach(x=>{
        subViewList.push({
            type: "sub",
            box: x,
            root: mainView,
            parent: view,
            uri: x.dataset.view
        });
    });
    log(`step6.chkSubView: subview=[${viewList.map(x=>x.dataset.view)}]\n\n`);
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
app.usePlugin = function(pluginName, ops={}, __view){
    var plugin = {
        type: "plugin",
        box: !__view && document.body,
        id: pluginName.split("-").pop(),
        uri: pluginName,
        url: `/node_modules/${pluginName}/index.sk`,
        display: ops.display,
        data: ops.data || {},
        options: ops,
        parent: __view,
        root: mainView
    };
    (__view&&__view.ui&&__view||app).plugin[plugin.id] = plugin;
    if(__view&&__view.ui){
        subViewList.push(plugin);
    }else{
        parseURI(plugin);
    }
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

app.render = function(currentView){
    view = currentView;
    parseHTML();
};

module.exports = app;