//解析
exports.parse = function(uri, parseQueryString){
    var query = uri.split("?")[1];
    if(parseQueryString && query) {
        var a = query.split("&");
        query = {};
        a.forEach( x => {
            x = x.split("=");
            query[x[0]] = x[1];
        });
    }
    return {
        query: query
    };
};