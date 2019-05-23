/**
 * If 'debug', then some additional debugging output will be logged.
 * Otherwise, nothing.
 */
process.env.NODE_ENV = 'debug';
package = require('./package.json');

console.log('Starting ' + package.name + ' v' + package.version);

// Configure logging for context 'main'
logger = require('./logger').get('main');

// Load classes and things
const Community 	= require('./Community');
const Participant 	= require('./Participant');
const DiscordClient 	= require('./DiscordClient');
const IRCClient 	= require('./IRCClient');
const NullClient 	= require('./NullClient');

// Load the definitions of participants and communities
participants_config 	= require('./participants.json');
communities_config 	= require('./communities.json');
participants = {};
communities = {};

// Construct participants from list
logger.info('Initializing Participants...');
for(var p in participants_config) {
	p = participants_config[p];
	console.log(p);
	switch(p.type) {
		case 'discord': 
			logger.info('Constructing DiscordClient: '+p.name);
			participants[p.name] = new DiscordClient(p.name, p.auth);
			logger.info('Constructed '+p.name);
			break;
		case 'irc':
			logger.info('Constructing IRCClient: '+p.name);
			participants[p.name] = new IRCClient(p.name, p.auth);
			logger.info('Constructed '+p.name);
			break;
		case null:
			logger.info('Constructing null client for '+p.name);
			participants[p.name] = new NullClient(p.name);
			logger.info('Constructed null client for '+p.name);
			break;
		default: break;
	}
}
logger.info('Initialized Participants.');

// Construct Communities
logger.info('Initializing Communities...');
for(var c in communities_config) {
	c = communities_config[c];
	console.log(c);
	communities[c.id] = new Community(c.name, c.id);
	for(var p in c.members) {
		p = c.members[p];
		console.log(p);
		communities[c.id].add(participants[p]);
	}
}
logger.info('Initialized Communities.');

/*
// Construct Discord client
logger.info('Initializing Discord client...');
discord_client = require('./discord_client');
logger.info('Initialized Discord client.');

// Construct IRC client
logger.info('Initializing IRC client...');
irc_client = require('./irc_client');
logger.info('Initialized IRC client.');

const Community = require('./Community');
// Construct a new community
logger.info('Creating community...');
community = new Community();
logger.info('...done.');

logger.info('Adding participants to community...');
community.add(discord_client);
community.add(irc_client);
logger.info('...done.');

// More clients and communities may be constructed as shown here
/**/
