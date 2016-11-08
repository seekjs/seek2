﻿/**
 * seekDataBind - 局部刷新
 * Created by likaituan on 14/8/18.
 */


//解析part
exports.parse = function(box, view){
    [...box.querySelectorAll("[data-part]")].forEach(x=>{
        var o = view[x.dataset.part] = {
            id: x.dataset.part,
            name: x.dataset.part,
            box: x,
            ui: x,
            render: function(){
                var html = view.getHTML(view.model || view);
                var div = document.createElement("div");
                div.innerHTML = html;
                html = div.querySelector(`[data-part=${o.id}`).innerHTML;
                div = null;
                o.box.innerHTML = html;
                return html;
            }
        };
    });
};