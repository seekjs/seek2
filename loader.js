/**
 * Created by likaituan on 07/12/2016.
 */

var template = require("sys.template");

var parseModule = function (mid, code) {
    if(mid.endsWith(".json")){
        return `modules["${mid}"] = ${code};`;
    }
    return `\n\n
    modules["${mid}"] = function(require, exports, module, __dirname, __filename){
        ${code}
        return module.exports;
    };`;
};

var chkCode = function(code){
    code = code.replace(/require\(["'](.+?)["']\);?/g, function(_,mid){
        return chkModule(mid) ? "" : _;
    });
    code = code.replace(/usePlugin\(["'](.+?)["']\s*[),]/g, function(_,mid){
        chkModule(mid, true);
        return _;
    });
    return chkImage(code);
};

var chkImage = function(code){
    code = code.replace(/(src|href)=["']?(.+?)\.(png|jpg|gif|ico|bmp)["']?/g, function(_,p,imageName,imageExt){
        var newImage = parseImage(imageName, imageExt);
        return `${p}="${newImage}?${timestamp}"`;
    });
    code = code.replace(/url\(["']?(.+?)\.(png|jpg|gif|ico|bmp)["']?\)/g, function(_,imageName, imageExt){
        var newImage = parseImage(imageName, imageExt);
        return `url("${newImage}?${timestamp}")`;
    });
    return code;
};

module.exports = function(mid){
    var skFile;
    var jsFile;
    var tpFile;
    var cssFile;
    var jsCode;
    var tpCode;
    var cssCode;
    var file = seekjs.getPath(mid);
    if(file.endsWith(".sk")){
        skFile = file;
        var code = seekjs.getCode(skFile);
        cssCode = /<style.*?>([\s\S]+?)<\/style>/.test(code) ? RegExp.$1 : "";
        tpCode = /<template.*?>([\s\S]+?)<\/template>/.test(code) ? RegExp.$1 : "";
        jsCode = /<script.*?>([\s\S]+?)<\/script>/.test(code) ? RegExp.$1 : "";
    }else{
        jsFile = file;
        if(mid.startsWith("seekjs-plugin-")){
            cssFile = jsFile.replace(/\.js/, ".css");
            tpFile = jsFile.replace(/\.js/, ".html");
        }else{
            cssFile = seekjs.getPath(mid.replace("js.","css."));
            tpFile = seekjs.getPath(mid.replace("js.","tp."));
        }
        cssCode = seekjs.getCode(cssFile);
        tpCode = seekjs.getCode(tpFile);
        jsCode = seekjs.getCode(jsFile);
    }

    jsCode = chkCode(jsCode);
    tpCode = chkCode(tpCode);
    cssCode = chkCode(cssCode);

    tpCode = template.getJsCode(tpCode);
    jsCode = `
    exports.getHTML = function($){
        ${tpCode}
    };
    ${jsCode}`;
    mid = mid.replace("js.", "page.");
    jsCode = parseModule(mid, jsCode);
    return {mid,skFile,jsFile,tpFile,cssFile,jsCode,tpCode,cssCode};
};