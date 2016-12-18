/**
 * Created by likaituan on 16/10/19.
 */
seekjs.config({
    ns: {
        data: "/test/",
        css: {
            path: "/test/",
            type: ".css"
        }
    }
});

require("css.class");

var app = require("sys.app");
    app.config({
        page: "/test/"
    });
    app.init("home");