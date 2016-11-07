var getData = function(data){
    return JSON.stringify(data);
};

module.exports = function (ops) {
    var data = getData(ops.data);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", ops.url, true);
    xhr.onload = function(){
        ops.success(xhr.responseText);
    };
    xhr.send(data);
};