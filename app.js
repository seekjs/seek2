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
    view = new View(ops, app);
    if(view.type=="main"){
        mainView = view;
    }
    if(view.type=="plugin"){
        view.owner.plugin[view.id] = view;
    }
    view.query = urlParse(view.uri, true).query || null;
    var params = view.uri.split("?")[0].split("/");
    view.page = params.shift();
    log(`step1.parseURI: uri=${view.uri} type=${view.type}`);
    view.params = {};
    if(params.length % 2){
         view.params.id = params.shift();
    }
    while(params.length){
        view.params[params.shift()] = params.shift();
    }
    if(cfg.page && !view.url) {
        view.url = `${cfg.page+view.page}.sk`;
    }

    if(window.modules) {
        var mid = view.page.startsWith("seekjs-plugin-") ? view.page : "page."+view.page;
        require(mid, view);
        parseView();
    }else{
        parseSkPage();
    }
};

//解析.sk页面
var parseSkPage = function() {
    var css, tp, js;
    var diy = {};
    if (view.url) {
        var code = require(view.url);
        css = /<style.*?>([\s\S]+?)<\/style>/.test(code) && RegExp.$1;
        tp = /<template.*?>([\s\S]+?)<\/template>/.test(code) && RegExp.$1;
        js = /<script.*?>([\s\S]+?)<\/script>/.test(code) && RegExp.$1;
        code.replace(/<:(.*?)>([\s\S]+?)<\/:*?>/g, function (_, key, val) {
            diy[key] = val;
        });
    } else {
        css = cfg.css && seekjs.getCode(`${cfg.css + view.page}.css`) || "";
        tp = cfg.tp && seekjs.getCode(`${cfg.tp + view.page}.html`) || "";
        js = cfg.js && seekjs.getCode(`${cfg.js + view.page}.js`) || "";
    }
    log(`step2.parseSkPage: url=${view.url}`);
    if (!css && !tp && !js && Object.keys(diy).length == 0) {
        tp = code.trim();
    }
    if (!js && !tp) {
        throw `the "${file}" page mush has a script or template`
    }
    //view.diy = diy;
    css && parseCss(css);
    if (/exports\.getHTML\s*=/.test(js)==false) {
        js += `\n\nexports.getHTML = function($){ ${template.getJsCode(tp || "")} };`;
    }
    seekjs.parseModule(js, view, `page.${view.page}.sk`);
    parseView();
};

//解析view
var parseView = function () {
    view.type!="plugin" && pipe.mergeObj(view, app.viewEx, true);
    log(`step3.parseView: uri=${view.uri}`);

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
    for(var k in view.plugin){
        view.plugin[k].box = view.ui;
        subViewList.push(view.plugin[k]);
    }
    log(`step6.chkSubView: subview=[${subViewList.map(x=>x.uri)}]\n\n`);
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
app.usePlugin = function(pluginName, ops={}, _view){
    var owner =  _view || app;
    var plugin = {
        owner,
        type: "plugin",
        box: !_view && document.body,
        id: pluginName.split("-").pop(),
        uri: pluginName,
        url: `/node_modules/${pluginName}/index.sk`,
        display: ops.display,
        data: ops.data || {},
        options: ops,
        parent: _view,
        root: mainView
    };
    owner.plugin[plugin.id] = plugin;
    !_view && parseURI(plugin);
};

//初始化
app.init  = function (page) {
    if(!cfg.page && !cfg.js){
        console.error(`please use "app.config" method set a sk page directory or a js directory before!`);
        return;
    }
    document.body.insertAdjacentHTML("afterBegin", '<div class="sk-app"></div>');
    app.box = document.body.firstElementChild;

    pipe.mergeObj(pipe, app.pipeEx, true);
    app.iniPage = page;
    parseHash();
    window.onhashchange = parseHash;
};

app.render = function(currentView){
    view = currentView;
    parseHTML();
};

module.exports = app;