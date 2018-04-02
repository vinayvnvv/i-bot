'use strict';

var _BotWindow_ = function() {
	this.init = function() {
		this.setStyle();
		this.setIframe();
	}

	this.setIframe = function() {
		var ifrm = document.createElement('iframe');
	    ifrm.setAttribute('id', 'chatbotframe');
	    ifrm.setAttribute('src', 'prod.html');
	    // ifrm.setAttribute('src', 'https://agridoc.herokuapp.com/prod.html');
	    ifrm.setAttribute("class", "_bot_frame_out");
	    document.body.appendChild(ifrm);
	}

	this.setStyle = function() {
		var css = "\
		._bot_frame_out { width: 400px; height: 100%; position: fixed; top: 0; right: 0; border: 0; outline: none;  } \
		@media only screen and (max-width: 768px) { ._bot_frame_out {\
		height: 100%; width: 100%; top: 0px; left: 0px;\
		}	}\
		";
		var style = document.createElement('style');
		style.setAttribute('type', 'text/css');
		style.innerHTML = css;
		document.body.appendChild(style);
	}

}

window.addEventListener("load", function() {
	var _botWindow_ = new _BotWindow_();
	_botWindow_.init();
});



