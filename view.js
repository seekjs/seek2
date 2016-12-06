/**
 * seekApp - 前端轻量级MVC框架
 * Created by likaituan on 14/8/18.
 */

var data_bind = require("sys.data_bind");

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