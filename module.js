//add by Li at 2016-10-19

~function (global, undefined) {
    global.seekjs = {};
    global.log = console.log;

    seekjs.alias = {};
    seekjs.ns = {};

    seekjs.isNode = typeof(module)=="object";
    seekjs.isBrowser = !seekjs.isNode;

    //配置命名空间和别名
    seekjs.config = function (ops) {
        var ns = ops.ns || {};
        for (let k in ns) {
            var item = ns[k];
            seekjs.ns[k] = item.path ? item : {path:item, type:".js"};
            if(seekjs.isNode){
                seekjs.ns[k].path = (seekjs.rootPath + seekjs.ns[k].path).replace("//","/");
            }
        }
        var alias = ops.alias || {};
        for(let k in alias){
            seekjs.alias[k] = seekjs.isNode ? seekjs.rootPath+alias[k] : alias[k];
        }
    };

    //加载CSS文件(only浏览器)
    seekjs.loadCss = function (path) {
        var style = document.createElement("link");
        style.rel = "stylesheet";
        style.type = "text/css";
        style.href = path;
        document.head.appendChild(style);
    };

    //获取代码(only浏览器)
    seekjs.getCode = function (path) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", path, false);
        xhr.send();
        return xhr.responseText;
    };

    //获取绝对路径
    seekjs.getPath = function (mid) {
        if(node_sys_module_re.test(mid)){
            return `${seekjs.sysPath}/node/${mid}.js`;
        }
        var isAlias = false;
        for(let k in seekjs.alias){
            if(mid==k){
                mid = seekjs.alias[k];
                isAlias = true;
                break;
            }
        }
        var isNs = false;
        for(let k in seekjs.ns) {
            if(mid.startsWith(`${k}.`)){
                var o = seekjs.ns[k];
                mid = mid.replace(`${k}.`, o.path);
                if(o.type && mid.includes(".")===false){
                    mid += o.type;
                }
                isNs = true;
                break;
            }
        }
        if(!isNs && !/^[\.\/]/.test(mid)){
            var prefix = seekjs.isNode ? seekjs.rootPath.replace(/\/$/,"") : "";
            var jsonStr = seekjs.getCode(`${prefix}/node_modules/${mid}/package.json`);
            var pk = seekjs.parseModule(`module.exports=${jsonStr}`);
            var main = pk.main || "index.js";
            mid = `${prefix}/node_modules/${mid}/${main}`;
        }
        if(!/\.\w+$/.test(mid)){
            mid += ".js";
        }
        return mid;
    };

    var modules = {};

    //解析模块
    seekjs.parseModule = function (code, iniExports, file) {
        var require = function (mid) {
            return seekjs.getModule(mid);
        };
        var module = {};
        module.resolve = function(path){
            return path;
        };
        var exports = module.exports = iniExports || {};

        code = `
        \n\n\n
        ${code}
        \n\n\n
        return module.exports;`;
        if(file) {
            code += `\n\n//# sourceURL=${file}`;
        }
        return new Function("require", "exports", "module", "dirname", "filename", code)(require, exports, module, file, file);
    };

    var iii=0;
    //加载模块
    seekjs.getModule = function (mid) {
        if(++iii==99999){
            throw "call times is too more!";
        }
        if (!modules[mid]) {
            var path = seekjs.getPath(mid);
            var file = path.split("/").pop();
            if (path.endsWith(".css")) {
                modules[mid] = path;
                seekjs.loadCss(path);
            }else {
                var code = seekjs.getCode(path);
                if(path.endsWith(".js")) {
                    modules[mid] = seekjs.parseModule(code,null,file);
                }else if(path.endsWith(".json")) {
                    modules[mid] = JSON.parse(code);
                }else {
                    modules[mid] = code;
                }
            }
        }
        return modules[mid];
    };

    seekjs.getJson = function(jsonStr){
        return new Function(`return ${jsonStr}`)();
    };

    seekjs.getJsonFile = function(file){
        var code = seekjs.getCode(file);
        return seekjs.getJson(code);
    };

    var node_sys_module_re;
    seekjs.init = function(ops){
        Object.assign(seekjs, ops);
        seekjs.ns.root = {
            path: ops.rootPath + "/"
        };
        seekjs.ns.sys = {
            path: ops.sysPath + "/"
        };
        var code = seekjs.getJsonFile(`${ops.sysPath}/node/node_sys_files.json`).join("|");
        node_sys_module_re = new Function(`return /^(${code})$/`)();
    };

    //针对浏览器端
    if(global.document) {
        var lastScript = [...document.scripts].pop();
        seekjs.init({
            rootPath: location.href.replace(/#.*$/, "").replace(/\w+\.html/, ""),
            sysPath: lastScript.src.replace(/\w+\.js/, "")
        });
        var main = lastScript.dataset.main;
        if (main) {
            global.onload = function () {
                seekjs.getModule(main);
            };
        }
    }

    //针对node端
    if(seekjs.isNode) {
        module.exports = seekjs;
    }
}(typeof(global)=="object"&&global ||  typeof(window)=="object"&&window || {});