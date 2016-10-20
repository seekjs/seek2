//add by Li at 2016-10-19

~function (global,undefined) {
    global.log = console.log;

    var ns = {};

    global.seekjs = {
        config: function (ops) {
            var _ns = ops.ns || {};
            for (var k in _ns) {
                var item = _ns[k];
                ns[k] = item.path ? item : {path:item, type:".js"};
            }
        }
    };

    //加载CSS文件
    var loadCss = function (path) {
        var style = document.createElement("link");
        style.rel = "stylesheet";
        style.type = "text/css";
        style.href = path;
        document.head.appendChild(style);
    };

    //获取代码
    var getCode = function (path) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", path, false);
        xhr.send();
        return xhr.responseText;
    };

    //获取真实路径
    var getPath = function (mid) {
        for(var k in ns) {
            if(mid.startsWith(k)){
                var o = ns[k];
                mid = mid.replace(k, o.path);
                if(o.type){
                    mid += o.type;
                }
                break;
            }
        }
        if(!/\.\w+$/.test(mid)){
            mid += ".js";
        }
        return mid;
    };

    var modules = {};

    //解析模块
    var parseModule = global.parseModule = function (code) {
        code = `
        var require = function (mid) {
            return getModule(mid);
        };
        var module = {};
        module.resolve = function(path){
            return path;
        };
        var exports = module.exports = {};
        \n\n\n
        ${code}
        \n\n\n
        return module.exports;
        `;
        return new Function(code)();
    };

    //加载模块
    var getModule = global.getModule = function (mid) {
        if (!modules[mid]) {
            var path = getPath(mid);
            if (path.endsWith(".css")) {
                modules[mid] = path;
                loadCss(path);
            }else {
                var code = getCode(path);
                if(path.endsWith(".js")) {
                    modules[mid] = parseModule(code);
                }else {
                    modules[mid] = code;
                }
            }
        }
        return modules[mid];
    };

    var lastScript = [...document.scripts].pop();
    ns["root."] = {
        path: location.href.replace(/#.*$/,"").replace(/\w+\.html/,"")
    };
    ns["sys."] = {
        path: lastScript.src.replace(/\w+\.js/,"")
    };
    var main = lastScript.dataset.main;
    if(main){
        window.onload = function() {
            getModule(main);
        };
    }
}(window);