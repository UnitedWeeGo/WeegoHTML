(function($) {
	
	var defaults = {
		fb_token: null
	};
	
	var methods = {
		
		init: function(options) {
			return this.each(function() {
				
				var o = $.extend(defaults, options);
				
				if (!!this._init) {
					return this.update();
				}
				this._init = true;
				
				var $this = $(this);
				
				var update = this.update = function() {
					$(window).resize(function() {
						
					});
					setUpUI();
					setUpFB();
				};
				
				update();
				
				function setLogoCenter() {
					
				}
				
				function setUpUI() {
					
				}
				
				function setUpFB() {
					window.fbAsyncInit = function() {
						FB.init({ appId: '221300981231092', 
							status: true, 
							cookie: true,
							xfbml: true,
							oauth: true});
						FB.getLoginStatus(updateButton);
						FB.Event.subscribe('auth.statusChange', updateButton);	
					}
				}
				
				function updateButton(response) {
					var ui = $this.find('#fbSignup');
					ui.html('');
					if (response.authResponse) {
						//user is already logged in and connected
						o.fb_token = response.authResponse.accessToken;
						verifyLoggedInFacebook();
					} else {
						//user is not connected to your app or logged out
						showLoginFacebook();
					}
				}
				
				function verifyLoggedInFacebook() {
					FB.api('/me', function(response) {
						var ui = $this.find('#fbSignup');
						ui.html('');
						ui.append('<h2>Is this you?</h2>');
						ui.append('<ul class="collapseableList participantList">');
						ui.find('.participantList').append('<li><img src="https://graph.facebook.com/' + response.id + '/picture"><h3>'+ response.name +'</h3>');
						ui.append('<div class="yesNo"><div class="no">No</div></div><div class="yesNo"><div class="yes">Yes</div></div>');
						ui.find('.no').bind('click', function() {
							FB.logout(function(response) {
								showLoginFacebook();
							});
						});
						ui.find('.yes').bind('click', function() {
							onFBLogin();
						});
						
					});
				}
				
				function showLoginFacebook() {
					var ui = $this.find('#fbSignup');
					ui.html('');
					ui.append('<div class="fbButton"><div class="text"><img src="/assets/images/icon_facebook.png" />Login with Facebook</div></div>');
					ui.find('.fbButton').bind('click', function() {
						showLoginFacebookInProgress();
						FB.login(function(response) {
							if (response.authResponse) {
								o.fb_token = response.authResponse.accessToken;
								onFBLogin();  
							} else {
								showLoginFacebook();
							}
						}, {scope:'email,offline_access,publish_checkins,user_checkins,friends_checkins,user_birthday'});  	
					});
				}
				
				function showLoginFacebookInProgress() {
					var ui = $this.find('#fbSignup');
					ui.html('');
					ui.find('.fbButton').unbind('click');
					ui.append('<div class="fbButton"><div class="text"><img src="/assets/images/icon_facebook.png" />Logging in...</div></div>');
				}
				
				function onFBLogin () {
					if (o.fb_token.length > 0) {
						loginWithFacebookAccessToken();
					}
				}
				
				function loginWithFacebookAccessToken() {
//					document.getElementById('fbSignup').style.display = "none";
//					document.getElementById('working').style.display = "block";
//					document.getElementById('working').innerHTML = '<h2>Please Wait...</h2>';
				
					var url = domain + "/xml.facebook.php";
					
					$.post(url, {access_token:o.fb_token}, handleLoginResponse);
				}
				
				function handleLoginResponse(data) {
					if ($(data).find('response').attr('code') == "201") {
//						document.getElementById('working').style.display = "none";
						ruid = $(data).find('ruid').text();
						$.cookie('ruid',ruid);
						Model.getInstance().createLoginParticipant($(data).find('participant'));
						ViewController.getInstance().showDashboard();
					}
				}
				
			});
		}		
	};
	
	$.fn.login = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on Login');
		}
	};

})(jQuery);