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
    };
    xhr.send(data);
};