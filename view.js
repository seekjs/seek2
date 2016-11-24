/**
 * seekApp - 前端轻量级MVC框架
 * Created by likaituan on 14/8/18.
 */

var template = require("sys.template");
var pipe = require("sys.pipe");
var event = require("sys.event");
var data_bind = require("sys.data_bind");
var data_part = require("sys.data_part");

/*
module.exports = class {
    constructor(app, ops={}) {
        this.app = app;
        this.plugin = {};
        Object.assign(this, ops);
    }

    //使用插件
    usePlugin (pluginName, ops={}) {
        this.app.usePlugin(pluginName, ops, this);
    };

    //切换
    toggle () {
        this.ui.style.display = this.ui.style.display=="none" ? "block" : "none";
    }

    //显示
    show () {
        this.ui.style.display = "block";
    }

    //隐藏
    hide () {
        this.ui.style.display = "none";
    }

    //跳转
    go (page) {
        if(/^https?:\/\//.test(page)){
            window.open(page);
        }else{
            location.hash = page;
        }
    }

    / *
    render (){
        parseHTML(this);
    }
    * /

    render () {
        this.app.render(this);
    }

    up2model () {
        data_bind.up2model(this.ui, this);
    }
};
*/


var Prototype = {
    //使用插件
    usePlugin: function(pluginName, ops = {}) {
        this.app.usePlugin(pluginName, ops, this);
    },

    //切换
    toggle: function(){
        this.ui.style.display = this.ui.style.display == "none" ? "block" : "none";
    },

    //显示
    show: function() {
        this.ui.style.display = "block";
    },

    //隐藏
    hide: function() {
        this.ui.style.display = "none";
    },

    //跳转
    go: function(page){
        if (/^https?:\/\//.test(page)) {
            window.open(page);
        } else {
            location.hash = page;
        }
    },

    render: function(){
        this.app.render(this);
    },

    up2model: function() {
        data_bind.up2model(this.ui, this);
    }
};

module.exports = function View(ops, app){
    this.app = app;
    this.plugin = {};
    Object.assign(this, ops);
    Object.assign(this, Prototype);
};