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
var mainView;
var cfg = {};


//解析Hash
var parseHash = function() {
    _view = new View(app);
    var uri = location.hash && location.hash.slice(1) || app.iniPage;
    Object.assign(_view, {
        type: "main",
        box: app.box,
        uri: uri
    });
    parseURI();
};

//解析Hash
var parseURI = function(){
    _view.query = urlParse(_view.uri, true).query || null;
    var params = _view.uri.split("?")[0].split("/");
    _view.page = params.shift();
    log(`step1.parseURI: page=${_view.page} type=${_view.type}`);
    _view.params = {};
    if(params.length % 2){
         _view.params.id = params.shift();
    }
    while(params.length){
        _view.params[params.shift()] = params.shift();
    }
    _view.url = _view.url || `${cfg.page}${_view.page}.sk`;

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
    log(`step2.parseSkPage: url=${_view.url}`);
    if(!css && !tp && !js && Object.keys(diy).length==0){
        tp = code.trim();
    }
    if(!js && !tp){
        throw `the "${file}" page mush has a script or template`
    }

    css && parseCss(css);
    view = new View(app);
    view.plugin = {};
    if(!view.getHTML) {
        js += `\n\nexports.getHTML = function($){ ${template.getJsCode(tp || "")} };`;
    }
    view = parseModule(js,_view.page+".sk", view);
    view.diy = diy;
    parseView();
};

//解析view
var parseView = function () {
    Object.assign(view, _view);
    view.type!="plugin" && pipe.mergeObj(view, app.viewEx, true);
    log(`step3.parseView: page=${view.page}`);

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
    log(`step4.parseHTML: page=${view.page}`);
    app.onRenderBefore && app.onRenderBefore(view);
    view.onRenderBefore && view.onRenderBefore();

    var model = view.model || view;
    var html = view.getHTML.call(model, pipe);
    if(view.type=="main"){
        mainView = view;
    }
    if(view.type=="plugin") {
        view.box.insertAdjacentHTML("beforeEnd", html);
        view.ui = view.box.lastElementChild;
    }else{
        view.box.innerHTML = html;
        view.ui = view.box.firstElementChild;
    }

    view.display===false && view.hide();

    data_bind.parse(view.box, view);
    //data_part.parse(box, view);
    parsePart(view.ui, view);
    event.parse(view.ui, view);
    log({page:view.page});

    app.onRender && app.onRender(view);
    view.onRender && view.onRender();

    chkSubView(view.ui);
};

//解析part
var parsePart = function(box, view){
    var partList = [...box.querySelectorAll("[data-part]")];
    log(`step5.parsePart: page=${view.page} part.length=${partList.length}`);
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
        data_bind.parse(o.ui, o.parent);
        event.parse(o.ui, o.parent);
    });
};

var chkSubView = function(box){
    var subViewList = [...box.querySelectorAll("[data-view]")];
    log(`step6.chkSubView: page=${view.page} subview.length=${subViewList.length}\n\n`);
    subViewList.forEach(x=>{
        _view = new View(app);
        Object.assign(_view, {
            type: "sub",
            box: x,
            root: mainView,
            parent: view,
            uri: x.dataset.view
        });
        parseURI();
    });
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
    _view = (view||app).plugin[pluginName] = new View(app);
    Object.assign(_view, {
        type: ops.type || "plugin",
        box: ops.box || document.body,
        id: pluginName.split("-").pop(),
        uri: pluginName,
        url: `/node_modules/${pluginName}/index.sk`,
        display: ops.display
    });
    log(`step0: app.usePlugin: ${_view.uri}`);
    parseURI();
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