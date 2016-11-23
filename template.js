/**
 * seekTemplate - 前端轻量级模板插件
 * Created by likaituan on 14/8/18.
 */

//根据指定的分隔符截成两半
var split2 = function (str, flag) {
	var a = str.split(flag);
	var ret = [a.shift()];
	a.length > 0 && ret.push(a.join(flag));
	return ret;
};

//生成JS代码
exports.getJsCode= function (tmpCode) {
	tmpCode = tmpCode.replace(/\r\n|\r|\n/g, ""); //去除换行符
	var jscode = [];
	jscode.push('var buf = [];');
	var R = RegExp;
	var literalRe = /\{literal\}([\s\S]+?)\{\/literal\}/;
	var jsRe = /<%([\s\S]+?)%>/;
	var smartyRe = /\{(.+?)\}/;

	//添加HTML代码
	var addHTML = function (s) {
		s = s.replace(/【/g, "{").replace(/】/g, "}");
		s = s.replace(/'/g, "\\'");
		jscode.push("buf.push('" + s + "');");
	};

	//添加JS代码
	var addJs = function (ss) {
		ss = ss.replace(/\$\((.+?)\);?/g, "buf.push($1);");
		jscode.push(ss);
	};

	//解析Smarty代码
	var o;
	var parseSmarty = function (ss) {
		//ss = ss.replace(/\$/g, "this.");
		var aa = ss.split(" ");
		var s0 = aa.shift();
		if (s0 == "foreach") {
			o = {};
			aa.map(function (exp) {
				exp = exp.split("=");
				o[exp[0]] = exp[1];
			});
			var key = o.key || "i";
			var item = o.item || "item";
			if (o.start) {
				jscode.push("for(var " + key + "=" + o.start + ";" + key + "<=" + o.end + "; " + key + "++){");
			} else {
				var a = o.from||o.src;
				jscode.push("var sn,src;for(var " + key + " in " + a + "){");
				jscode.push("var " + item + "=" + a + "[" + key + "];");
				jscode.push("sn="+key+"*1+1;");
				jscode.push("src={length:"+a+".length, first:"+key+"==0, last:"+key+"=="+a+".length-1};");
			}
		} else if (s0 == "elseforeach" || s0=="elseach") {
			jscode.push("}; if(" + (o.from||o.src) + ".length==0){");
		} else if (s0 == "/foreach") {
			jscode.push("}");

		} else if (s0 == "if") {
			jscode.push("if(" + aa[0] + "){");
		} else if (s0 == "elseif" || s0=="elsif") {
			jscode.push("}else if(" + aa[0] + "){");
		} else if (s0 == "else") {
			jscode.push("}else{");
		} else if (s0 == "/if") {
			jscode.push("}");


		} else if (s0 == "loop") {
			jscode.push(filter.stringFormat("for(var {0}={1}; {0}<={2}; {0}++){", aa[0], aa[2], aa[4]));
		} else if (s0 == "/loop") {
			jscode.push("}");


		} else if (ss[0] == "=") {
			jscode.push("console.log("+ss.slice(1)+");");
		} else {
			var smf = split2(ss, "|");
			//避免碰到||的时候
			if (smf[1] && smf[1][0] == "|") {
				smf = [ss];
			}
			var s = smf[0];
			if (smf[1]) {
				var mf = split2(smf[1], ":");
				var m = mf[0].trim();
				var f = mf[1];
				s = f ? `$.${m}(${s}, ${f.split(",").map(x=>'"'+x+'"')})` : `$.${m}(${s})`;
			}
			s && jscode.push("buf.push(" + s + ");");
		}
	};

	//先编译literal字面量
	var compileLiteral = function (code) {
		if (literalRe.test(code)) {
			var a = [R.leftContext, R.$1.trim(), R.rightContext];
			a[0] && compileJs(a[0]);
			a[1] && addHTML(a[1]);
			a[2] && compileLiteral(a[2]);
		} else {
			compileJs(code);
		}
	};

	//然后编译JS
	var compileJs = function (code) {
		if (jsRe.test(code)) {
			var a = [R.leftContext, R.$1, R.rightContext];
			a[0] && compileSmarty(a[0]);
			a[1] && addJs(a[1]);
			a[2] && compileJs(a[2]);
		} else {
			compileSmarty(code);
		}
	};


	//最后编译Smarty语法
	var compileSmarty = function (code) {
		code = code.replace(/\{\{/g, "【").replace(/\}\}/g, "】");
		if (smartyRe.test(code)) {
			var a = [R.leftContext, R.$1, R.rightContext];
			a[0] && addHTML(a[0]);
			a[1] && parseSmarty(a[1]);
			a[2] && compileSmarty(a[2]);
		} else {
			addHTML(code);
		}
	};

	compileLiteral(tmpCode);

	jscode.push('return buf.join("");');
	jscode.push(``)
	jscode = jscode.join("\n");
	//console.log(jscode);
	return jscode;
};

//获得编译函数
exports.getFun = function (tplCode) {
	var jscode = exports.getJsCode(tplCode);
	return new Function("$", jscode);
};

//编译函数
exports.compileFun = function (tplFun) {
	return function (data) {
		return tplFun.call(data, $);
	};
};

//直接编译模板代码
exports.compile = function (tplCode) {
	var jscode = exports.getJsCode(tplCode);
	//console.log(jscode);
	var templateFun = new Function("$", jscode);
	return exports.compileFun(templateFun);
};