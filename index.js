/**
 * If 'debug', then some additional debugging output will be logged.
 * Otherwise, nothing.
 */
process.env.NODE_ENV = 'debug';
package = require('./package.json');

console.log('Starting ' + package.name + ' v' + package.version);

// Configure logging for context 'main'
logger = require('./logger').get('main');

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
