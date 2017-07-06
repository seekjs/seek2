/**
 * seekjs 内置 ajax 插件
 * @param ops
 */

module.exports = function (ops) {
	var xhr = new XMLHttpRequest();
	var type = (ops.type || "get").toLowerCase();
	xhr.open(type, ops.url, true);
	xhr.responseType = ops.dataType || 'json';
	xhr.onload = function () {
		var data = xhr.response;
		ops.success && ops.success(data);
		ops.callback && ops.callback(data);
	};
	//if(type=="post") {
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	//}
	var dataStr = [];
	if (ops.data) {
		for (var k in ops.data) {
			dataStr.push(`${k}=${encodeURIComponent(ops.data[k])}`);
		}
	}
	dataStr = dataStr.join('&');
	xhr.send(dataStr);
};

module.exports.get = function (url, callback) {
	return this({url, callback, type:'get'});
};

module.exports.post = function (url, data, callback) {
    return this({url, data, callback, type:'post'});
};