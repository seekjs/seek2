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
    _view.uri = location.hash && location.hash.slice(1) || app.iniPage;
    _view.query = urlParse(_view.uri, true).query || null;
    _view.params = _view.uri.split("?")[0].split("/");

    _view.page = _view.params.shift();
    if(_view.params.length==1){
        _view.params = {id: _view.params[0]};
    }
    _view.url = `${cfg.path}${_view.page}.sk`;

    if(window.modules){
        view = require("page."+_view.page);
        parseView2();
    }else {
        parseSkPage(_view.url);
    }
};

//解析.sk页面
var parseSkPage = function(file, callback=parseView){
    var code = require(file);
    var css = /<style.*?>([\s\S]+?)<\/style>/.test(code) && RegExp.$1;
    var tp = /<template.*?>([\s\S]+?)<\/template>/.test(code) && RegExp.$1;
    var js = /<script.*?>([\s\S]+?)<\/script>/.test(code) && RegExp.$1;
    var diy = {};
    code.replace(/<:(.*?)>([\s\S]+?)<\/:*?>/g, function(_,key,val){
        diy[key] = val;
    });
    if(!css && !tp && !js && Object.keys(diy).length==0){
        tp = code.trim();
    }
    if(!js && !tp){
        throw `the "${file}" page mush has a script or template`
    }
    return callback(css,js,tp,diy);
};

//解析view
var parseView = function (css,js,tp,diy) {
    css && parseCss(css);
    view = js && parseModule(js,_view.page+".sk") || _view;
    view.getHTML = tp && template.getFun(tp);
    view.diy = diy;
    parseView2();
};

//解析view
var parseView2 = function () {
    Object.assign(view, _view);
    pipe.mergeObj(view, app.viewEx, true);

    view.type = view.type || "main";
    view.go = app.go;
    view.render = parseHTML;

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
    var firstElement = [...box.children].shift();
    if(firstElement){
        box.removeChild(firstElement);
    }
    box.insertAdjacentHTML("afterBegin", html);
    view.ui = box.firstElementChild;
    view.toggle = function(){
        view.ui.style.display = view.ui.style.display=="none" ? "block" : "none";
    };
    view.show = function(){
        view.ui.style.display = "block";
    };
    view.hide = function(){
        view.ui.style.display = "none";
    };
    view.display===false && view.hide();
    if(view.type=="plugin"){
        app.plugin[view.id] = view;
    }

    view.up2model = function () {
        data_bind.up2model(view.ui, view);
    };

    app.onRender && app.onRender(view);
    View.setRender(app,view);
    view.onRender && view.onRender();

    event.parse(box, view);
    data_bind.parse(box, view);
    data_part.parse(box, view);
};

var app = {};
app.plugin = {};
app.viewEx = {};
app.pipeEx = {};

//配置
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
    //plugin.use(pluginName, ops);
    _view = _view || {};
    _view.type = "plugin";
    _view.id = pluginName.split("-").pop();
    _view.page = pluginName;
    _view.box = document.body;
    _view.display = ops.display;
    parseSkPage(pluginName);

};

//初始化
app.init  = function (page) {
    app.box = document.createElement("div");
    document.body.appendChild(app.box);

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


var plugin = {
    use: function(pluginName, ops={}){
        var {css,js,tp,diy} = parseSkPage(pluginName);
        css && parseCss(css);
        view = js && parseModule(js) || {};
        view.diy = diy;
        plug.langPack = o.langPack;
        plug.show = function(){

        cssCode && app.parseCss(cssCode);
        plug.getHTML = template.compile(templateCode);
        this.render(plug);

        var o = lang.getLangPack(plug.langPack, ops.langPack, ops.lang || plug.defaultLang);
        plug.lang = o.lang;
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