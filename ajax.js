/**
 * seekjs 内置 ajax 插件
 * @param ops
 */

module.exports = function (ops) {
	var xhr = new XMLHttpRequest();
	var type = (ops.type || this.options.type).toLowerCase();
	xhr.open(type, ops.url, true);
	xhr.responseType = ops.dataType || this.options.dataType;
	this.options.onBefore && this.options.onBefore(xhr);
	xhr.onload = () => {
		log({cp: this.options.onComplete});
		this.options.onComplete && this.options.onComplete(xhr);
		var data = xhr.response;
		ops.success && ops.success(data);
		ops.callback && ops.callback(data);
	};
	xhr.timeout = ops.timeout || this.options.timeout;
	xhr.ontimeout = event => {
		alert('请求超时！');
	} ;
	//if(type=="post") {
		xhr.setRequestHeader('Content-Type', this.options.contentType);
	//}
	for (var k in this.headers) {
		xhr.setRequestHeader(k, this.headers[k]);
	}
	var dataStr = [];
	if (ops.data) {
		for (var k in ops.data) {
			dataStr.push(`${k}=${encodeURIComponent(ops.data[k])}`);
		}
	}
	dataStr = dataStr.join('&');
	xhr.send(dataStr);
};

module.exports.options = {
	type: 'get',
	dataType: 'json',
	timeout: 30000,
	contentType: 'application/x-www-form-urlencoded'
};

// 配置
module.exports.config = function (options) {
	Object.assign(this.options, options);
};

// get请求
module.exports.get = function (url, data, callback) {
	if (typeof data === 'function') {
		callback = data;
		data = {};
	}
	var qs = [];
	for (var key in data) {
		qs.push(`${key}=${data[key]}`);
	}
	if (qs.length) {
		url += '?' + qs.join('&');
	}
	var ops = {url, callback, type:'get'};
	return this.call(this,ops);
};

// post请求
module.exports.post = function (url, data, callback) {
	if (typeof data === 'function') {
		callback = data;
		data = {};
	}
	var ops = {url, data, callback, type:'post'};
    return this.call(this, ops);
};