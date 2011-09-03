var fb_token = '';
var ruid = '';

/*
try {
    var jqueryLoaded=jQuery;
    jqueryLoaded=true;
} catch(err) {
    var jqueryLoaded=false;
}
var head = document.getElementsByTagName('head')[0];
if (!jqueryLoaded) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js';
    head.appendChild(script);
}
*/

window.onload = function () {
    jQuery(document).ready( function($) {
    	var head = document.getElementsByTagName('head')[0];
    	var fb_js = document.createElement('script');
    	fb_js.async = true;
  		fb_js.type = 'text/javascript';
  		fb_js.src = document.location.protocol + '//connect.facebook.net/en_US/all.js';
		head.appendChild(fb_js);
    });
    
    window.fbAsyncInit = function() {
		FB.init({ appId: '221300981231092', 
			status: true, 
			cookie: true,
			xfbml: true,
			oauth: true});
		FB.getLoginStatus(updateButton);
		FB.Event.subscribe('auth.statusChange', updateButton);	
	};
}

function updateButton(response) {
	var button = document.getElementById('fb-auth');
	var userInfo = document.getElementById('user-info');
	var weegoAuth = document.getElementById('weego-auth');
	
	if (response.authResponse) {
		//user is already logged in and connected
		fb_token = response.authResponse.accessToken;
		FB.api('/me', function(response) {
			userInfo.innerHTML = '<span class="fbIcon"></span><img class="fbAvatar" src="https://graph.facebook.com/' + response.id + '/picture"><span class="spacer"></span>' + response.name +'. Is this you?';
			weegoAuth.innerHTML = '<a class="fb_yes_no"><span class="fb_button_text">Yes</span></a>';
			button.innerHTML = '<a class="fb_yes_no last"><span class="fb_button_text">No</span></a>';
		});
		button.onclick = function() {
			FB.logout(function(response) {
				userInfo.innerHTML="";
				weegoAuth.innerHTML = "";
			});
		};
		weegoAuth.onclick = function() {
			onFBLogin();
		};
	} else {
		//user is not connected to your app or logged out
		button.innerHTML = '<a class="fb_button fb_button_xlarge"><span class="fb_button_text">Sign-up with Facebook</span></a>';
		userInfo.innerHTML="";
		userInfo.style.display = 'none';
		weegoAuth.innerHTML = "";
		button.onclick = function() {
			button.innerHTML = '<a class="fb_button fb_button_xlarge"><span class="fb_button_text">Signing up...........</span></a>';
			FB.login(function(response) {
				if (response.authResponse) {
					fb_token = response.authResponse.accessToken;
					onFBLogin();  
				} else {
					button.innerHTML = '<a class="fb_button fb_button_xlarge"><span class="fb_button_text">Sign-up with Facebook</span></a>';
				}
			}, {scope:'email,offline_access,publish_checkins,user_checkins,friends_checkins,user_birthday'});  	
		}
	}
}

function onFBLogin () {
	if (fb_token.length > 0) {
		loginWithFacebookAccessToken();
	}
}

function loginWithFacebookAccessToken() {
	document.getElementById('fbSignup').style.display = "none";
	document.getElementById('working').style.display = "block";
	document.getElementById('working').innerHTML = '<h2>Please Wait...</h2>';

	var url = domain + "/xml.facebook.php";
	
	$.post(url, {access_token:fb_token}, handleLoginResponse);
}

function handleLoginResponse(data) {
	if ($(data).find('response').attr('code') == "201") {
		document.getElementById('working').style.display = "none";
		ruid = $(data).find('ruid').text();
		ViewController.getInstance().showDashboard();
	}
}



