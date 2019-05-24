// set up logging for constructor
var logger = require('./logger').get('IRC');
const UMessage = require('./UMessage');
const Participant = require('./Participant');
const IRC = require('irc');

class IRCClient extends Participant {
	constructor(name, auth) {
		super(
			name,
			'irc',
			new IRC.Client(auth.server, auth.nick, auth.options),
			function(msg) {
				// This function must take in a UMessage from a Community and send it to all its endpoints (in the direction of users, not Communities).
				this.logger.debug(JSON.stringify(msg));
				if((msg.source.participant == this.name) && (msg.source.channel == msg.channel)) return;
				this.mind.send('PRIVMSG','#'+msg.channel,msg.user.realName+' > '+msg.content);
			},
			{
				refresh_channels: function() {
					this.channels = [];
					for(var C in this.communities) {
						C = this.communities[C];
						for(var c in C.channels) {
							c = C.channels[c];
							if(!this.channels.includes(c))
								this.channels.push(c);
						}
					}
				},
				reload: function() {
					this.logger.info('Reloading and joining new channels');
					this.refresh_channels();
			this.channels = ['booty']; // FIXME removv
					var joined = Object.keys(this.mind.chans).map(function(c){c = c.split('#'); c.shift(); c = c.join('#'); return c;});
					for(var c in this.channels) {
						c =  this.channels[c];
						if(!joined.includes(c))
							this.mind.join('#'+c,function(msg){
								this.parent.logger.info('Joined #'+c);
							});
					}
					this.logger.info('Finished joining new channels.');
				}
			}
		);
		this.mind.on('registered', function(message) {
			// Within this function, `this` refers to the mind
			// probably
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
