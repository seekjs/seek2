

	var ua = exports.ua = navigator.userAgent;

	exports.os = "window";
    exports.browser = {
        name: "ie"
    };

	if (/ios/i.test(ua)) {
		exports.os = "ios";
		exports.ios = {
			version:0
		}
	}
	if (/android/i.test(ua)) {
		exports.os = "android";
		exports.android = {
			version:0
		}
	}
	if (/Mac OS X/i.test(ua)) {
		exports.os = "mac";
		exports.browser = {
            name: /chrome/i.test(ua) ? "chrome" : "safari",
			version: 0
		}
	}

    exports.mediaMode = screen.width>screen.height ? "pad" : "phone";
    exports.isMobile = /android|ios/.test(exports.os);