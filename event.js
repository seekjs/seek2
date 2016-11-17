/**
 * 通用事件解析模块
 * create by Li at 2014-8-18
 * edit by Li at 2014-12-28
 */

	var env = require("sys.env");
	
	//两段分隔符
	var split2 = function (str, flag) {
		var a = str.split(flag);
		var ret = [a.shift().trim()];
		a.length > 0 && ret.push(a.join(flag).trim());
		return ret;
	};

	/**
		@title 解析事件
		@param box 容器 element
		@parem Scope 作用域 object
	*/
	exports.parse = function (box, Scope) {
        var elements = [].slice.call(box.querySelectorAll("[data-event],[data-enter]"));
        box.dataset && (box.dataset.event||box.dataset.enter) && elements.push(box);
		var enter;
		elements.forEach(function (ele) {
            var dataset = ele.dataset;
			enter = enter || dataset.enter && ele;
			var eventStr = dataset.event || dataset.submit || dataset.enter;
			eventStr.split(";").map(function (ema) {
				ema = split2(ema, ">");
				if (ema.length == 1) {
					ema = ["click", ema[0]];
				}
				var ma = split2(ema[1], ":");
				var e = ema[0];
				if(!env.isMobile && e=="tap"){
					e = "click";
				}
				var m = ma[0].split(".");
				var scope = Scope;
				while (m.length > 1) {
					scope = scope[m.shift()];
				}
				m = m[0];
				if (!scope[m]){
					var pos = scope.type && scope.path ? scope.type + "View [" + scope.path + "]" : "targetView";
					throw "method [" + m + "] is no define on the " + pos;
				}
				var args = ma[1] ? ma[1].split(",") : [];

				var fun = `fun_${e}`;
				ele[fun] && ele.removeEventListener(e, ele[fun]);
				ele[fun] = function (event) {
					Scope.element = ele;
					Scope.event = event;
					Scope.up2model && Scope.up2model();
					scope[m].apply(scope, args);
				};
				ele.addEventListener(e, ele[fun]);
			});
		});

		//临时加上的,写的比较死,需要重构
		document.onkeyup = enter ? function(e){
			e.keyCode==13 && enter.click();
		} : Scope.type=="main" ? null : document.onkeyup;
	};
