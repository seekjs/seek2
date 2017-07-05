var getData = function(data){
    return JSON.stringify(data);
};

module.exports = function (ops) {
    var data = getData(ops.data);
    var type = (ops.type || "POST").toLowerCase();
    var xhr = new XMLHttpRequest();
    xhr.open(type, ops.url, true);
    if(type=="post") {
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    }
    xhr.onload = function(){
        var text = xhr.responseText;
        if(ops.dataType=="json"){
            text = new Function(`return ${text};`)();
        }
        ops.success && ops.success(text);
        ops.callback && ops.callback(text);
    };
    xhr.send(data);
};

module.exports.get = function () {

};

module.exports.post = function (url, data, callback) {
    return this({url, data, callback});
};