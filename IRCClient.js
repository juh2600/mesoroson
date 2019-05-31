// set up logging for constructor
var logger = require('./logger').get('IRC');
const UMessage = require('./UMessage');
const Participant = require('./Participant');
const IRC = require('irc');

class IRCClient extends Participant {
	constructor(name, auth, options={}, chanlist=null) {
		super(
			name,
			'irc',
			new IRC.Client(auth.server, auth.nick, options),
			function(msg) {
				// This function must take in a UMessage from a Community and send it to all its endpoints (in the direction of users, not Communities).
				this.logger.silly(JSON.stringify(msg));
				if((msg.source.participant == this.name) && (msg.source.channel == msg.channel)) return;
				if(this.channels.includes(msg.channel))
				this.mind.send('PRIVMSG','#'+msg.channel,msg.user.realName+' > '+msg.content);
				else this.logger.debug('Ignoring message to #'+msg.channel+' because we don\'t operate there');
			},
			{
				refresh_channels: function() {
					if(this.chanlist != null && this.chanlist.type === 'whitelist') {
						this.channels = this.chanlist.list;
						return;
					}
					this.channels = [];
					for(var C in this.communities) {
						C = this.communities[C];
						for(var c in C.channels) {
							c = C.channels[c];
							if(!this.channels.includes(c) && !(this.chanlist != null && this.chanlist.type === 'blacklist' && this.chanlist.list.includes(c)))
								this.channels.push(c);
						}
					}
				},
				reload: function() {
					if(!this.registered) {
						this.logger.warn('Disregarding request to reload, because we are not registered.');
						return;
					}
					this.logger.info('Reloading and joining new channels');
					this.refresh_channels();
//			this.channels = ['booty']; // FIXME removv
					var joined = Object.keys(this.mind.chans).map(function(c){c = c.split('#'); c.shift(); c = c.join('#'); return c;});
					console.log('Joined: ');
					console.log(joined)
					console.log('Need to be in: ');
					console.log(this.channels);
					var genCallback = function(string) {return function(u) {this.parent.logger.info('Joined #'+string);};};
					for(var c in this.channels) {
						c =  this.channels[c];
						if(!joined.includes(c))
							this.logger.info('Joining #'+c+'...');
							this.mind.join('#'+c,genCallback(c));
					}
					this.logger.info('Finished joining new channels.');
				}
			}
		);
		if(chanlist!=null) {
			this.logger.debug('Received not-null black or whitelist');
			this.chanlist = chanlist;
		}
		this.registered = false;
		this.mind.on('registered', function(message) {
			// Within this function, `this` refers to the mind
			// probably
			this.parent.registered = true;
			this.parent.refresh_channels();
			this.parent.reload();
		});
		this.mind.on('message', function(nick, to, text, message) {
			if(nick == this.parent.name) return;
			var channel = (function(c){c = c.split('#');c.shift();return c.join('#');})(to)
			var umessage = new UMessage(
				{
					participant: this.parent.name,
					channel: channel
				},
				{
					displayName: nick,
					realName: message.user
				},
				channel,
				text
			);
			this.parent.logger.debug(JSON.stringify(message,null,'\t'));
			this.parent.propagate(umessage);
		});
		this.mind.on('error', function(msg){
			this.parent.logger.error('Reeeeee:');
			console.debug(msg);
		});
		this.mind.on('raw', function(msg){
			if(msg.command === 'PRIVMSG') return;
			if(!this.opt.debug) return;
			this.parent.logger.debug('Received non-PRIVMSG:');
			console.debug(msg);
		});
	}
}

module.exports = IRCClient;
