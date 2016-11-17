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
        ops.box = this.ui;
        ops.type = "sub";
        this.app.usePlugin(pluginName, ops);
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

    /*
    render () {
        if(this.type=="main") {
            this.app.render(this);
        }else{
            //this.app.render(this);
            //由于bug问题, 暂时这么写

            var model = this.model || this;
            var html = this.getHTML.call(model, pipe);
            this.box.insertAdjacentHTML("beforeEnd", html);
            var newUI = this.box.lastElementChild;
            this.box.replaceChild(newUI, this.ui);
            this.ui = newUI;
            event.parse(this.ui, this);
            data_bind.parse(this.ui, this);
            data_part.parse(this.ui, this);
        }
    }*/

    up2model () {
        data_bind.up2model(this.ui, this);
    }
}

module.exports = View;