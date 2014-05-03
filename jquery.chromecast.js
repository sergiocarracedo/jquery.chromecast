/**
 * Send your pictures gallery to chromecast
 *
 * This file is part of jquery.chromecast
 *
 * jquery.chromecast is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * jquery.chromecast is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for
 * more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with jquery.chromecast. If not, see <http://www.gnu.org/licenses/>.
 *
 * @author      Sergio Carracedo Martinez <info@sergiocarracedo.es>
 * @copyright   2014 Sergio Carracedo Martinez
 * @license     http://www.gnu.org/licenses/lgpl-3.0.txt GNU LGPL 3.0
 * @version     SVN: $Id: jquery.chromecast.js 1 2014-05-03 14:02:00Z sergiocarracedo $
 */


(function( $ ){


	$.fn.chromecast = function(options) {
		var defaults = { 		
			timeout												: 5000,
			onInitSuccess 								: function() { launch() },
			onRequestSessionSuccess 			: function() {},
			onError 											: function() {},
			onLaunchError 								: function() {},
			onMediaDiscovered							: function() {},
			onMediaError									: function() {},
			receiverListener							: function() {},
			onMediaStatusUpdate						: function() {},
			onMediaDiscovered							: function() {},
		};

		var session 						= null;
		var currentMedia 				= null;
		var items								= [];
		var timer								= null;
		var currentIndex				= -1;
	 	
		$.extend(defaults, options);
	 	options = defaults;
		
		/*var isMethodCall = typeof options === "string",
			args = Array.prototype.slice.call( arguments, 1 ),
			returnValue = this;
			
		if (isMethodCall) {
			this.each(function() {
				if (!$(this).hasClass("chromecast-processed")) {
					globalContainer = $(this).parent().parent();				
					container = $('.tagger',globalContainer);
					realInput = this;
					eval(options + "('" + args.join("','") + "')");
				}
			});
		} else {*/
		
			return this.each(function(){   
				if (!$(this).hasClass("chromecast-processed")) {							
					$(this).addClass('chromecast-processed');
					$('img', this).each(function(e) {
						items.push($(this).attr('src'));
					});

					init();					
					initSlide();

				}
			});  
		/*} */

		function init() {
			window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
		  	if (loaded) {
		      return initializeCastApi();
		  	} 
			}
		}

		function initSlide() {
			setInterval(doSlide, options.timeout);
		}

		function doSlide() {
			currentIndex++;
			if (currentIndex >= items.length) {
				currentIndex = 0;
			}
			loadMedia(items[currentIndex]);			
		}

		function initializeCastApi() {	
			var applicationID = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
  		var sessionRequest = new chrome.cast.SessionRequest(applicationID);
  		var apiConfig = new chrome.cast.ApiConfig(
  			sessionRequest,
    		sessionListener,
    		receiverListener
  		);

  		chrome.cast.initialize(apiConfig, onInitSuccess, onError);
		}

		function onInitSuccess() {
			options.onInitSuccess();

		}

		function launch() {
			chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
		}

		function onRequestSessionSuccess(e) {
  		session = e;  
  		session.addUpdateListener(sessionUpdateListener.bind(this));  

  		if (session.media.length != 0) {
    		onMediaDiscovered('onRequestSession', session.media[0]);
  		}
  
  		session.addMediaListener(onMediaDiscovered.bind(this, 'addMediaListener'));
  		session.addUpdateListener(sessionUpdateListener.bind(this));  

  		/* USER CALLBACK */
			options.onRequestSessionSuccess();
		}

		function onLaunchError(e) {
			options.onLaunchError(e);
		}

		function onError(e) {
			options.onError(e);	
		}


		function loadMedia(mediaURL, contentType) {	
  		if (!session) {
    		return;
  		}

		  if (contentType == undefined) {
		  	contentType = 'image/jpeg';
		  }

  		if (mediaURL) {
    		var mediaInfo = new chrome.cast.media.MediaInfo(mediaURL);
  		} else {    
    		var mediaInfo = new chrome.cast.media.MediaInfo(currentMediaURL);
  		}
  		mediaInfo.contentType = contentType;
  		var request = new chrome.cast.media.LoadRequest(mediaInfo);  
  		request.autoplay = true;
  		request.currentTime = 0;
  
	  	session.loadMedia(
	  		request,
	    	onMediaDiscovered.bind(this, 'loadMedia'),
	    	onMediaError
	  	);

		}

		function onMediaError(e) {
			options.onMediaError();
		}

		function sessionListener(e) {	
			session = e;
		  if (session.media.length != 0) {
    		onMediaDiscovered('sessionListener', session.media[0]);
  		}

  		session.addMediaListener(onMediaDiscovered.bind(this, 'addMediaListener'));
  		session.addUpdateListener(sessionUpdateListener.bind(this));  
		}

		function sessionUpdateListener(isAlive) {
  		if (!isAlive) {
    		session = null;
  		}
		}

		function receiverListener(e) {
	  	options.receiverListener(e);
		}

		function onMediaDiscovered(how, media) {
  		currentMedia = media;
  		currentMedia.addUpdateListener(onMediaStatusUpdate);

  		options.onMediaDiscovered(how, media);
		}

		function onMediaStatusUpdate(isAlive) {
			options.onMediaStatusUpdate(isAlive);
		}

	};

})( jQuery );