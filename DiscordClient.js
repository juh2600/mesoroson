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
				this.logger.debug(JSON.stringify(msg,null,'\t'))
				// Array of objects containing a "channel" (id, string) and a "server" (object)
				var destinations = this.getDestinations(msg.channel, msg.source);
				for(var d in destinations) {
					logger.info('Destination #'+d);
					d = destinations[d];
					console.log(d);
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

					console.log(d.channel);
					var discordMessage = {
						to: d.channel,
						message: '**' + msg.user.displayName + ':** ' + content
					};
					logger.info('Sending message: ');
					console.log(discordMessage);
					this.mind.sendMessage(discordMessage);
				}
			},
			{}
		);
		this.getDestinations = function(destName, source) {
			console.log('Destination: '+destName);
			console.log('Source: '+JSON.stringify(source,null,'\t'));
			console.log('         '+source.participant+' '+source.channel+' '); // FIXME
			var destinations = [];
			console.log('Results:');
			var mind = this.mind; // screw scoping
			var logger = this.logger;
			var name = this.name;
			// for each server
			for(var s in this.mind.servers) {
				s =  this.mind.servers[s];
				// get a list of channel objects that have the right name
				var name_matches = Object.keys(s.channels).filter(
					function(channel_id) {
						// if it's the source channel, nope out
						if((name === source.participant) && (channel_id == source.channel)) return false;

						// get channel object from the mind's channel list instead of the server's channel list
						// maybe they're the same, iunno
						/*
						var channels_with_id = mind.channels.filter(c => c.id === channel_id);
						if(channels_with_id.length < 1) return false;
						if(channels_with_id.length > 1) logger.warn('Found '+channels_with_id.length+' channels with ID '+channel_id);
						*/
						// check the channel's name and return
						return destName === mind.channels[channel_id].name;
					}
				);
				for(var c in name_matches) {
					c =  name_matches[c];
					destinations.push({server: s, channel: c});
				}
			}
			/*
			for(var c in this.mind.channels) {
				c = this.mind.channels[c];
				// if the channel has the right name and isn't the source channel
				if(destName.split('#')[1] == c.name && (srcPart != this.name || srcChan != c.id)) {
					console.log('Found channel: '+c.id+' '+c.name);
					for(var s in this.mind.servers) {
						s = this.mind.servers[s];
						if(s.channels.hasOwnProperty(c.id))
							console.log('Adding destination');
							console.log('Length before: '+destinations.length);
							destinations.push({
								channel: c,
								server: s
							});
							console.log('Length after: '+destinations.length);
					}
				}
			}
			*/
			//console.log(JSON.stringify(destinations,null,'\t'));
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
			this.parent.communities.forEach(c => c.reload());
			this.parent.logger.info('Channels enrolled. Ready');
		});
		this.mind.on('message', function(user, user_id, channel_id, msg, event) {
			// Within this function, the keyword `this` refers to the mind.
			// ignore our own messages
			if(user_id == auth.id) return;

			// UMessage expects a channel name, not prefixed with '#'
			var channel_name = this.channels[channel_id].name;

			// Some platforms don't support multi-line messages (e.g., IRC)
			// Split the message at newlines
			var lines = event.d.content.split('\n');
			lines.forEach(line => {
				event.d.content = line; // haha suck on that, pass by reference // i wonder what inspired that
				var message = new UMessage(
					{
						participant: name,
						channel: channel_id
					},
					{
						displayName: user,
						realName: user
					},
					channel_name,
					line
				);
				console.log(JSON.stringify(message,null,'\t'));
				this.parent.propagate(message);
			});
		});
	}
}

module.exports = DiscordClient;
