var CFScrapper = function(){
	var request = require('request');
	this.jar = request.jar();
	this.reqd = request.defaults({ jar: this.jar });
	var tf = function(text, init, end, rev) {
		if(typeof text == "undefined") return '';
		end = end || false;

		tInit = ((rev || false) ? text.lastIndexOf(init) : text.indexOf(init)) + init.length;
		return text.substring(tInit, !end ? text.length : text.indexOf(end, tInit));
	}

	this.get = function(options, callback, t) {
		var _t = t || 0;
		if(t == 3) {
			callback(null, new Error('CFIUAM challenge not passed, 3 attempts were made!'));
			return;
		}
		if(typeof options == "string") {
			options = { url: options }
		}

		if(!options.hasOwnProperty('url')) {
			callback(null, new Error('URL is required!'));
		}

		var that = this;
		var opts = options;
		return this.reqd(opts, function(err, res, data) {
			if(data.indexOf('action="/cdn-cgi/l/chk_jschl"') == -1) {
				callback(data, null); return;
			}

			var host = res.request.host,
				objInit = tf(data, "var t,r,a,f, ", "\n"),
				objUpd = tf(data, "challenge-form');\n        ;", "a.value"),
				answer = parseInt(eval(objInit+objUpd), 10) + host.length,
				jschlVC = tf(data, 'jschl_vc" value="', '"'),
				pass = tf(data, 'pass" value="', '"'),
				action = tf(data, '-form" action="', '"'),
				durl = res.request.agent.protocol + "//" + host + ':' + res.request.port + action;

			var qs =
				'?jschl_vc=' + encodeURIComponent(jschlVC) +
				'&pass=' + encodeURIComponent(pass) +
				'&jschl_answer=' + encodeURIComponent(answer);

			setTimeout(function(){
				that.reqd({url:durl + qs,headers:{referer:opts.url}}, function(err, res, data) {
					if(data.indexOf('action="/cdn-cgi/l/chk_jschl"') == -1) {
						callback(data, null);
					} else {
						that.get(opts, callback, ++t);
					}
				});
			}, 4000);
		})
		.on('error', function(e) {
			callback(data, e);
		});
	}
}

module.exports = new CFScrapper();