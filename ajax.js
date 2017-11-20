/**
 * seekjs 内置 ajax 插件
 * @param ops
 */

const OPTIONS = {
	type: 'get',
	dataType: 'json',
	timeout: 30000,
	contentType: 'form'
};

const contentTypeMaps = {
	json: 'application/json',
	form: 'application/x-www-form-urlencoded'
};

let Ajax = function (options) {
	return new Promise((resolve, reject) => {
		let url = options.url;
		let data = options.data || {};
		let type = (options.type || OPTIONS.type).toLowerCase();

		let contentTypeKey = options.headers && options.headers.contentType || OPTIONS.contentType;
		let contentType = contentTypeMaps[contentTypeKey] || contentTypeKey;

		let query;
		if (contentTypeKey === 'json') {
			query = JSON.stringify(data);
		} else {
			query = Object.entries(data).map(([key,val]) => {
				return `${key}=${encodeURIComponent(val)}`;
			}).join('&');
			if (query && type === 'get') {
				url += '?' + query;
				query = '';
			}
		}

		let xhr = new XMLHttpRequest();
		xhr.open(type, url, true);
		xhr.responseType = options.dataType || OPTIONS.dataType;
		options.onBefore && options.onBefore(xhr);
		xhr.onload = () => {
			options.onComplete && options.onComplete(xhr);
			resolve(xhr.status === 200 ? xhr.response : {code: xhr.status});
		};
		xhr.timeout = options.timeout || OPTIONS.timeout;
		xhr.ontimeout = event => {
			console.log(`xhr event: ${event}`);
			alert('请求超时！');
			reject({code:504, message:'system timeout'});
		};
		xhr.setRequestHeader('Content-Type', contentType);
		let headers = Object.assign({}, options.headers || {});
		Object.keys(headers).forEach(key => {
			xhr.setRequestHeader(key, headers[key]);
		});
		xhr.send(query);
	});
};

// get请求
Ajax.get = function (url, data, options) {
	options = options || {};
	options.url = url;
	options.data = url;
	options.type = 'get';
	return Ajax(options);
};

// post请求
Ajax.post = function (url, data, options) {
	options = options || {};
	options.url = url;
	options.data = url;
	options.type = 'post';
    return Ajax(options);
};

module.exports = Ajax;