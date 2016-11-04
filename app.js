/**
 * Created by likaituan on 16/10/19.
 */

var urlParse = require("url").parse;

var View = require("sys.view");
var event = require("sys.event");
var data_bind = require("sys.data_bind");
var lang = require("sys.lang");
var template = require("sys.template");
var pipe = require("sys.pipe");

var view;
var cfg = {};

//解析Hash
var parseHash = function(){
    view = {};
    view.uri = location.hash && location.hash.slice(1) || app.iniPage;
    view.query = urlParse(view.uri, true).query || null;
    view.params = view.uri.split("?")[0].split("/");

    view.page = view.params.shift();
    if(view.params.length==1){
        view.params = {id: view.params[0]};
    }
    view.url = `${cfg.path}${view.page}.sk`;
    parseSkPage(view.url);
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
    view.getHTML = tp && template.compile(tp);
    view.diy = diy;
    js = js && parseModule(js) || {};
    Object.assign(view, js);
    pipe.mergeObj(view, app.viewEx, true);

    view.go = app.go;
    view.render = parseHTML;

    app.onInit && app.onInit(view);
    view.onInit && view.onInit();
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
    })(view.type);

    var model = view.model || view;
    var html = view.getHTML(model);
    var firstElement = [...box.children].shift();
    if(firstElement){
        box.removeChild(firstElement);
    }
    box.insertAdjacentHTML("afterBegin", html);

    app.onRender && app.onRender(view);
    View.setRender(app,view);
    view.onRender && view.onRender();

    event.parse(box, view);
    data_bind.parse(box, view);
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
app.usePlugin = function(pluginName, ops){
    //plugin.use(pluginName, ops);
    parseSkPage(pluginName, ops);

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
        view = js && parseModule(js) || {}; ha
        view.diy = diy;
        plug.langPack = o.langPack;
        plug.show = function(){mnm


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