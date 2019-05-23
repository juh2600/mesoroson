
// Configure logging for context 'Discord'
var logger = require('./logger').get('Discord');
var Participant = require('./Participant');

class NullClient extends Participant {
	constructor(name) {
		super(
			name,
			'null',
			null,
			function(msg){this.logger.debug(JSON.stringify(msg,null,'\t'))},
			{}
		);
	}
};

module.exports = NullClient;
