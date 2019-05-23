// Configure logging for context 'Discord'
var logger = require('./logger').get('Discord');
const Participant = require('./Participant');
const UMessage = require('./UMessage');
const Discord = require('discord.io');

class DiscordClient extends Participant {
	constructor(name, auth) {
		super(
			name,
			'discord',
			new Discord.Client({token: auth.token, autorun: true}),
			function(msg){
				// This function must take in a UMessage from a Community and send it to all its endpoints (in the direction of users, not Communities).
				// Array of objects containing a "channel" (id, string) and a "server" (object)
				var destinations = this.getDestinations(msg.channel, msg.source);
				for(var d in destinations) {
					this.logger.debug('Destination #'+d);
					d = destinations[d];
					this.logger.debug(d);
					// Handle emoji :D
					var emojis = d.server.emojis;
					// Not sure what this is about tho
					var emoji_regex = /:([a-zA-Z0-9_]{1,32}):/g;
					var either = /:?([a-zA-Z0-9_]{1,32}):?/g;
					var content = msg.content.replace(either,function(whole,name){
						for(var emoji in emojis) {
							if(emojis[emoji].name == name)
								return '<:' + name + ':' + emoji + '>';  // this server has a match, so return resolved emoji 
						}
						return whole;  // no match, so return plaintext unchanged
					});

					this.logger.debug(d.channel);
					var discordMessage = {
						to: d.channel,
						message: '**' + msg.user.realName + ':** ' + content
					};
					//this.logger.debug('Sending message: ');
					//this.logger.debug(discordMessage); // uhhh prepends [Discord] to the actual message ¯\_(ツ)_/¯
					this.mind.sendMessage(discordMessage);
				}
			},
			{}
		);
		this.mind.getServerFromChannel = function(channel_id) {
			return this.servers[Object.keys(this.servers).filter(s => this.servers[s].channels.hasOwnProperty(channel_id))[0]];
		}
		this.mind.getNickFromServer = function(user_id, server_id) {
			return this.servers[server_id].members[user_id].nick;
		}
		this.mind.getNickFromChannel = function(user_id, channel_id) {
			return this.getNickFromServer(user_id, this.getServerFromChannel(channel_id).id);
		}
		this.getDestinations = function(destName, source) {
			this.logger.debug('Destination: '+destName);
			this.logger.debug('Source: '+JSON.stringify(source,null,'\t'));
			var destinations = [];
			this.logger.debug('Results:');
			var mind = this.mind; // screw scoping
			var name = this.name;
			// for each server
			for(var s in this.mind.servers) {
				s =  this.mind.servers[s];
				// get a list of channel objects that have the right name
				var name_matches = Object.keys(s.channels).filter(
					function(channel_id) {
						// if it's the source channel, nope out
						if((name === source.participant) && (channel_id == source.channel)) return false;
						return destName === mind.channels[channel_id].name;
					}
				);
				for(var c in name_matches) {
					c =  name_matches[c];
					destinations.push({server: s, channel: c});
				}
			}
			return destinations;
		};
		/**
		 * The Discord client won't know what servers or channels it has access to until it's set up and connected and generally ready.
		 * Once it is ready, we can populate the list of channels that we can see.
		 */
		this.mind.on('ready', function (evt) {
			// Within this function, `this` refers to the mind
			this.parent.logger.info('Enrolling channels');
			var channels = this.channels;
			for(var c in channels) {
				c = channels[c];
				var name = c.name.toLowerCase();
				if(c.type == 0 && !this.parent.channels.includes(name))
					this.parent.channels.push(name);
			}
			// We've changed our channel list. Rouse the troops.
			this.parent.communities.forEach(c => {
				for(var chan in this.parent.channels) {
					chan =  this.parent.channels[chan];
					if(!c.channels.includes(chan))
						c.channels.push(chan);
				}
			});
			this.parent.communities.forEach(c => c.reload());
			this.parent.logger.info('Channels enrolled. Ready');
		});
		this.mind.on('message', function(user, user_id, channel_id, msg, event) {
			// Within this function, the keyword `this` refers to the mind.
			// ignore our own messages
			if(user_id == auth.id) return;

			// UMessage expects a channel name, not prefixed with '#'
			var channel_name = this.channels[channel_id].name;
			var content = event.d.content;

			// Strip emoji reference garbage
			var emoji_trash = /<:([a-zA-Z0-9_]{1,32}):[0-9]+>/g;
			content = content.replace(emoji_trash,function(whole,name){
				return ':' + name + ':';
			});

			// Some platforms don't support multi-line messages (e.g., IRC)
			// Split the message at newlines
			var lines = content.split('\n');
			lines.forEach(line => {
				event.d.content = line; // haha suck on that, pass by reference // i wonder what inspired that
				var message = new UMessage(
					{
						participant: name,
						channel: channel_id
					},
					{
						displayName: this.getNickFromChannel(user_id, channel_id),
						realName: user
					},
					channel_name,
					line
				);
				this.parent.logger.debug(JSON.stringify(message,null,'\t'));
				this.parent.propagate(message);
			});
		});
	}
}

module.exports = DiscordClient;
