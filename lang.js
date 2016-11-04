//获取语言包
exports.getLangPack = function(srcPack, dstPack, defaultLang){
    if(!srcPack){
        throw "plugin's langPack is not defined!";
    }
    var langPack = this.transferPack(srcPack);
    if(dstPack){
        dstPack = transferPack(dstPack);
        langPack = this.mergePack(langPack, dstPack);
    }
    var lang = this.getLang(langPack, defaultLang);
    return {langPack, lang};
};

//获取当前所用的语言包
exports.getLang = function(langObj, lang){
    if(!langObj){
        return {};
    }

    var o = {};
    for(var k in langObj){
        if(k!="getLang"){
            o[k] = langObj[k][lang];
        }
    }
    return o;
};

//JSON转换
exports.transferPack = function(json){
    if(!json.currentLang) {
        return json;
    }
    var newJson = {};
    for (var k in json) {
        if (k != "currentLang") {
            newJson[k] = {
                [json.currentLang] : json[k]
            };
        }
    }
    return newJson;
};

//语言包合并
exports.mergePack = function(langPack, langPack2){
    var item,item2;
    for(var key in langPack2){
        item = langPack[key];
        if(!item) {
            throw `langPack not this key: ${key}`;
        }
        item2 = langPack2[key];
        for(var lang in item2) {
            item[lang]  = item2[lang];
        }
    }
    return langPack;
};