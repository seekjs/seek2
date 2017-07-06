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

	//根据相对路径获取绝对路径
	seekjs.getResolvePath = function (mid, refPath) {
		refPath = refPath.replace(/\/$/,"").split("/");
		mid = mid.split("/");
		var x;
		while (x=mid[0]){
			if(x=="."){
				mid.shift();
			}else if(x==".."){
				mid.shift();
				refPath.pop();
			}else{
				break;
			}
		}
		return refPath.concat(mid).join("/");
	};

    //获取绝对路径
    seekjs.getPath = function (mid, refPath) {
	    //系统模块
        if(node_sys_module_re.test(mid)){
            return `${seekjs.sysPath}/node/${mid}.js`;
        }
        var isAlias = false;
	    //别名
        for(let k in seekjs.alias){
            if(mid==k){
                mid = seekjs.alias[k];
                isAlias = true;
                break;
            }
        }
        var isNs = false;
	    //命名空间
        for(let k in seekjs.ns) {
            if(mid.startsWith(`${k}.`)){
                var o = seekjs.ns[k];
                mid = mid.replace(`${k}.`, o.path);
                if(o.type && /\.\w+$/.test(mid)===false){
                    mid += o.type;
                }
                isNs = true;
                break;ed
            }
        }
        if(!isAlias && !isNs){
	        //相对路径
	        if(/^\./.test(mid)) {
				if(refPath){
					mid = seekjs.getResolvePath(mid, refPath);
				}
	        //绝对路径
	        }else if(/^\//.test(mid)){

	        //用户模块
	        }else {
		        var prefix = seekjs.isNode ? seekjs.rootPath.replace(/\/$/, "") : "";
		        var jsonStr = seekjs.getCode(`${prefix}/node_modules/${mid}/package.json`);
		        var pk = JSON.parse(jsonStr);
		        var main = pk.main || "index.js";
		        mid = `${prefix}/node_modules/${mid}/${main}`;
	        }
        }
        if(!/\.\w+$/.test(mid)){
            mid += ".js";
        }
        return mid;
    };

    var modules = {};
	//seekjs.modules  = modules;

    //解析模块
    seekjs.parseModule = function (module) {
        module.resolve = function(path){
            return path;
        };
	    var require = function (mid) {
		    return seekjs.getModule(mid, module.dir||module.path).exports;
	    };

        var code = `
        exports = exports ||  {};
        module.exports = module.exports || exports;
        \n\n\n
        ${module.code}
        \n\n\n
        return module.exports;`;
        if(module.file) {
            code += `\n\n//# sourceURL=${module.file}`;
        }
        var fun = Function("require", "exports", "module", "__dirname", "__filename", code);
	    new fun(require, module.exports, module, module.dir, module.file);
    };

    var iii=0;
    //加载模块
    seekjs.getModule = function (mid, refPath) {
        if(++iii==99999){
            throw "call times is too more!";
        }
	    var path = seekjs.getPath(mid, refPath); //绝对路径
	    if(/\.(?:js|json|css|html|sk|txt)$/.test(path)==false){
		    path += ".js";
	    }
	    var module = modules[path];
        if (!module) {
	        var pathParts = path.split("/");
	        module = modules[path] = {};
	        module.path = path;
            module.file = pathParts.pop();
	        module.dir = pathParts.join("/");
            if (path.endsWith(".css")) {
                seekjs.loadCss(path);
            }else {
                module.code = seekjs.getCode(path);
                if(path.endsWith(".js")) {
                    seekjs.parseModule(module);
                }else if(path.endsWith(".json")) {
                    module.exports = JSON.parse(module.code);
                }else{
                    module.exports = module.code;
                }
            }
        }
        return module;
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
            rootPath: location.href.replace(/#.*$/, "").replace(/\w+\.html/, "").replace(/\/$/,""),
            sysPath: lastScript.src.replace(/\/\w+\.js/, "")
        });
        var main = lastScript.dataset.main;
        if (main) {
            global.onload = function () {
                seekjs.getModule(main, seekjs.rootPath);
            };
        }
    }

    //针对node端
    if(seekjs.isNode) {
        module.exports = seekjs;
    }
}(typeof(global)=="object"&&global ||  typeof(window)=="object"&&window || {});