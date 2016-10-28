/**
 * seekApp - 前端轻量级MVC框架
 * Created by likaituan on 14/8/18.
 */

var template = require("sys.template");
var pipe = require("sys.pipe");

//初始化
exports.setInit = function(app, view, ops){log(ops);
    view.go = app.go;
    view.render = app.render;

    view.getHTML = template.compile(ops.templateCode);
    view.page = ops.page;
    view.params = ops.params;
    view.query = ops.query;
    pipe.mergeObj(view, app.viewEx);
};

//DOM渲染完成
exports.setRender = function(app, view){
    view.ui = document.body.children[0];
};