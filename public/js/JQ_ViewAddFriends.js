(function($) {
	
	var defaults = {
			event: null,
			invitees: null,
			facebook: null,
			recents: null
	};
	
	var methods = {
		
		init: function(options) {
			return this.each(function() {
				
				var o = $.extend(defaults, options);
				
				o.invitees = new Array();
				o.facebook = new Array();
				o.recents = new Array();
				o.allFriends = new Array();
				
				if (!!this._init) {
					return this.update();
				}
				this._init = true;
				
				var $this = $(this);
				
				var update = this.update = function() {
					$(window).resize(function() {
						setViewSize();
					});
					
					clearSearchResults();
					
					$this.find('.content').html('');
					
					getFriends();
					
					setEvents();
					setViewSize();
					//setScroll();
					//setUpUI();
					//resetScroll();
				};
				
				update();
				
				function getFriends() {
					var url = domain + "/get.participantinfo.php";
					$.get(url, {registeredId:ruid}, function(data) {
						handleGetFriendsResponse(data);
					});
				}
				
				function handleGetFriendsResponse(data) {
					var allParticipantsXML = $(data).find('participant');
					for (var i=0; i<allParticipantsXML.length; i++) {
						var pXML = allParticipantsXML[i];
						var p = new Participant();
						p.populateWithXML(pXML);
						if (p.type == "facebook") {
							o.facebook.push(p);
						} else if (p.type == "recent") {
							o.recents.push(p);
						}
						o.allFriends.push(p);
					}
					setUpUI();
				}
				
				function setViewSize() {
					var participantSearchHeight = ($this.find('.participantSearch')) ? $this.find('.participantSearch').outerHeight() : 0;
					$this.find('.contentContainer').css('height',document.documentElement.clientHeight - resizeOffset - participantSearchHeight); // one pixel adjustment for bottom of scrolling list
					$this.find('.content').css('height', (document.documentElement.clientHeight - (resizeOffset + participantSearchHeight)));
					$this.find('#participantSearchField').css('width',document.documentElement.clientWidth - $this.find('.participantSearch').find('.buttons').outerWidth() - 28);
				}
				
				function setScroll() {
					if (!!('ontouchstart' in window)) {
						$this.find('.content:first-child').touchScroll();
					}
				}
				
				function resetScroll() {
					if (!!('ontouchstart' in window)) {
						$this.find('.contentContainer').find('.content:first-child').touchScroll('setPosition', 0);
					}
				}
				
				function getSingleEvent() {
					var url = domain + "/get.event.php";
					var params = {registeredId:ruid, eventId:o.eventId};
					if (o.event && o.event.lastUpdatedTimestamp) params.timestamp = o.event.lastUpdatedTimestamp;
					$.get(url, params, function(data) {
						handleGetSingleEvent(data);
						setUpUI();
						//ViewController.getInstance().showEventDetail(o.event.eventId, false, o.event.showCountMeIn(), true);
					});
				}

				function handleGetSingleEvent(data) {
					Model.getInstance().populateEventsWithXML(data);
					o.lastUpdatedTimestamp = $(data).find('response').attr('timestamp');
					var allEventsXML = $(data).find('event');
					for (var i=0; i<allEventsXML.length; i++) {
						var evXML = allEventsXML[i];
						var id = $(evXML).attr('id');
						o.event = Model.getInstance().getEventById(id); // new Event();
						o.event.lastUpdatedTimestamp = $(data).find('response').attr('timestamp');
						o.event.populateWithXML(evXML);
					}
					o.reloading = false;
					degree = 0;
					if (!!('ontouchstart' in window)) {
						$this.find('.content').touchScroll('setRestPosition', 0);
					}
					Model.getInstance().currentEvent = o.event;
					Model.getInstance().getModelDataAsJSON();
				}
				
				function resetScroll() {
					if (!!('ontouchstart' in window)) {
						$this.find('.content').touchScroll('setPosition', 0);
					}
				}
				
				function setEvents() {
					$this.find('.participantSearch').find('#submit').unbind('click');
					$this.find('.participantSearch').find('#submit').click(function() {
						validateAndAdd();
					});
					
					$this.find('#participantSearchField').keypress(function(e) {
						$this.find('#participantSearchField').removeClass('error');
						if(e.which == 13) {
							if (validateAndAdd()) {
								jQuery(this).blur();
							}
						}
					});
					
					$this.find('.participantSearch').find('#cancel').unbind('click');
					$this.find('.participantSearch').find('#cancel').click(function() {
						clearSearchResults();
					});
				
					$this.find('#participantSearchField').focusin(function(){
						if ($(this).hasClass('default')) {
							$(this).val('');
							$(this).removeClass('default');
						}
					});
				}
				
				function validateEmail(email) {
					var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
					return re.test(email);
				}
				
				function validateAndAdd() {
					var email = $this.find('#participantSearchField').val();
					if (validateEmail(email)) {
						var p = new Participant();
						p.email = email;
						o.invitees.push(p);
						clearSearchResults();
						setUpUI();
						return true;
					} else {
						$this.find('#participantSearchField').addClass('error');
						return false;
					}
				}
				
				function clearSearchResults() {
					$this.find('#participantSearchField').removeClass('error');
					$this.find('#participantSearchField').addClass('default');
					$this.find('#participantSearchField').val('Type a friend\'s email');
				}
				
				function setUpUI() {
					$this.find('.content').html('');
					$this.find('.content').append('<ul class="participantList">');
					var inviteCount = 0; 
					if (o.invitees.length > 0) {
						$this.find('.content').find('.participantList').append('<li class="header headerInvite"><span class="headerText">Invite</span></li>');
						for (var i=0; i<o.invitees.length; i++) {
							inviteCount++;
							var p = o.invitees[i];
							$this.find('.content').find('.participantList').append(p.displayForAddFriends());
						}
					}
					if (inviteCount > 0) $this.find('.content').find('.headerInvite').css('display','block');
					var recentCount = 0;
					if (o.recents.length > 0) {
						$this.find('.content').find('.participantList').append('<li class="header headerRecent"><span class="headerText">Recent</span></li>');
						for (var i=0; i<o.recents.length; i++) {
							var p = o.recents[i];
							if (isInvitee(p.email)) continue;
							recentCount++;
							var type = "recent";
							type += (o.event.getParticipantById(p.email)) ? " disabled" : " addable";
							$this.find('.content').find('.participantList').append(p.displayForAddFriends(type, p.email));
						}
					}
					if (recentCount > 0) $this.find('.content').find('.headerRecent').css('display','block');
					var facebookCount = 0;
					if (o.facebook.length > 0) {
						$this.find('.content').find('.participantList').append('<li class="header headerFacebook"><span class="headerText">Facebook friends on weego</span></li>');
						for (var i=0; i<o.facebook.length; i++) {
							var p = o.facebook[i];
							if (isInvitee(p.email)) continue;
							facebookCount++;
							var type = "facebook";
							type += (o.event.getParticipantById(p.email)) ? " disabled" : " addable";
							$this.find('.content').find('.participantList').append(p.displayForAddFriends(type, p.email));
						}
					}
					if (facebookCount > 0) $this.find('.content').find('.headerFacebook').css('display','block');
					
					$this.find('UL.participantList').find('.addable').each(function() {
						$(this).unbind('click');
						$(this).click(function() {
							handleParticipantCellClick($(this).attr("email"));
						});
					});
					
					setViewSize();
					setScroll();
				}
				
				function isInvitee(email) {
					for (var i=0; i<o.invitees.length; i++) {
						var p = o.invitees[i];
						if (p.email == email) return true;
					}
					return false;
				}
				
				function getFriend(email) {
					for (var i=0; i<o.allFriends.length; i++) {
						var p = o.allFriends[i];
						if (p.email == email) return p;
					}
					return null;
				}
				
				function handleParticipantCellClick(email) {
					var p = getFriend(email);
					o.invitees.push(p);
					setUpUI();
				}
				
				function submitInvitees() {
					var needsValidate = false;
					if (!$this.find('#participantSearchField').hasClass('default')) {
						var email = $this.find('#participantSearchField').val();
						var emailWoWhitespace = email.replace(/ /g,'');
						if (emailWoWhitespace.length > 0) {
							needsValidate = true;
						}
					}
					if (needsValidate && !validateAndAdd()) return;
					var xmlStr = '<event id="'+ o.event.eventId +'"><participants>';
					for (var i=0; i<o.invitees.length; i++) {
						var p = o.invitees[i];
						xmlStr += '<participant email="'+ p.email +'" />';
					}
					xmlStr += '</participants></event>';
					var url = domain + "/xml.invite.php";
					var params = {registeredId:ruid, xml:xmlStr};
					$.post(url, params, function(data) {
						handleSubmitInviteesResponse(data);
					});
				}
				
				function handleSubmitInviteesResponse(data) {
					if (Model.getInstance().currentAppState == Model.appState.createEvent) {
						ViewController.getInstance().showCreateEvent();
					} else {
						ViewController.getInstance().showEventDetail(Model.getInstance().currentEvent.eventId);
					}
				}
								
				this.submitInvitees = function() {
					return submitInvitees();
				};
				
			});
		},
		
		done: function () {
			return this.each(function() {
				this.submitInvitees();
			});
		}
	};
	
	$.fn.addFriends = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.addFriends');
		}
	};

})(jQuery);