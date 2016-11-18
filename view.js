/**
 * seekApp - 前端轻量级MVC框架
 * Created by likaituan on 14/8/18.
 */

var template = require("sys.template");
var pipe = require("sys.pipe");
var event = require("sys.event");
var data_bind = require("sys.data_bind");
var data_part = require("sys.data_part");

class View {
    constructor(app) {
        this.app = app;
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

    render () {
        this.app.render(this);
    };

    up2model () {
        data_bind.up2model(this.ui, this);
    }
}

module.exports = View;