/**
 * seekDataBind - 前端轻量级数据绑定模块
 * Created by likaituan on 14/8/18.
 */



    var oo = {
        val: {
            get: function(ele){
                return ele.value;
            },
            set: function(ele, v){
                ele.value = v;
            }
        },
        txt: {
            get: function(ele){
                if(ele.tagName=="SELECT"){
                    return ele.options[ele.selectedIndex].innerHTML;
                }else {
                    return ele.innerHTML;
                }
            },
            set: function(ele, v){
                if(ele.tagName!="SELECT") {
                    ele.innerHTML = v;
                }
            }
        },
        data: {
            get: function(ele, k){
                if(ele.tagName=="SELECT"){
                    return ele.options[ele.selectedIndex].dataset[k];
                }else {
                    return ele.innerHTML;
                }
            },
            set: function(ele, k, v){
                if(ele.tagName!="SELECT") {
                    ele.dataset[k] = v;
                }
            }
        }
    };

    //查找bind
    exports.findBind = function(box) {
        [].forEach.call(box.children, function (ele) {
            if(!ele.dataset.view) {
                //ele.dataset.bind && exports.elements.push(ele);
	            ele.getAttribute("data-bind") && exports.elements.push(ele); //为了兼容safiri新版本9.0.3
	            exports.findBind(ele);
            }
        });
    };

    //解析绑定 add by Li at 2014-12-9
    exports.parse = function (box, view) {
        //[].forEach.call(box.querySelectorAll("[data-bind]"), function (ele) {
        exports.elements = [];
        exports.findBind(box);
        exports.elements.forEach(function (ele) {
            if (ele.dataset.bind == "") {
                return console.warn(ele,"未绑定事件");
            }
            ele.dataset.bind.split(";").forEach(function(item) {
                var pm = item.split(":");
                if (pm.length == 1) {
                    pm = ["val"].concat(pm);
                }
                var p = oo[pm[0]];
                var s = pm[1].split(".");
                var v = view.model || view;
                var k;
                var t = [];
                while (k = s.shift()) {
                    t.push(k);
                    if (s.length > 0 && !v[k]) {
                        throw "the data-bind scope [" + t.join(".") + "] is not defined in the view [" + view.path + "]";
                    }
                    v = v[k];
                }
                p ? p.set(ele, v) : oo.data.set(ele,pm[0],v);
            });
        });
    };

    //更新到模板 add by Li at 2014-12-9
    exports.up2model = function (box, view, index) {
        //[].forEach.call(box.querySelectorAll("[data-bind]"), function (ele) {
        if(index>-1){
            box = box.querySelector("[data--index="+index+"]") || box;
        }
        exports.elements = [];
        exports.findBind(box);
        exports.elements.forEach(function (ele) {
            ele.dataset.bind.split(";").forEach(function(item) {
                var pm = item.split(":");
                if (pm.length == 1) {
                    pm = ["val"].concat(pm);
                }
                var p = oo[pm[0]];
                var s = pm[1].split(".");
                var scope = view.model || view;
                while (s.length > 1) {
                    scope = scope[s.shift()];
                }
                var key = s[0];
                scope[key] = p ? p.get(ele) : oo.data.get(ele,pm[0]);
            });
        });
    };
