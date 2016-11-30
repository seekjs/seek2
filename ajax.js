var getData = function(data){
    return JSON.stringify(data);
};

module.exports = function (ops) {
    var data = getData(ops.data);
    var xhr = new XMLHttpRequest();
    xhr.open(ops.type||"POST", ops.url, true);
    xhr.onload = function(){
        var text = xhr.responseText;
        if(ops.dataType=="json"){
            text = new Function(`return ${text};`)();
        }
        ops.success(text);
    };
    xhr.send(data);
};