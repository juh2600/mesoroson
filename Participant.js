const UMessage = require('./UMessage');

/**
 * Represents a thing that can join Communities and send and receive {@link UMessage}s.
 */
class Participant {
	/**
	 * @constructor
	 * @param {string} name - Identifier to distinguish this participant from others. Be creative.
	 * @param {string} type - Platform of this participant (e.g., 'discord', 'irc').
	 * @param {Object} mind - Object that sends/receives messages. This is usually the object created by a node.js package for a client on a given platform.
	 * @param {function(UMessage)} distributor - Function that handles receiving messages from abroad.
	 * @param {Object} options List of additional options, callbacks, etc. See code for details. (Good luck.)
	 */
	constructor(name, type, mind, distributor, options = {}) {
		let defaults = {
			join_callback: function(community){},
			refresh_channels: function(){},
			reload: function(){}
		};
		let o = Object.assign({}, defaults, options);
		/**
		 * String to identify this Participant.
		 */
		this.name = name;
		/**
		 * Logger for this Participant to use.
		 */
		this.logger = require('./logger').get(name);
		/**
		 * String to identify the platform of this Participant (e.g., 'discord', 'irc').
		 */
		this.type = type;
		/**
		 * Object that manages interfacing with the platform. This is usually the object created by a node.js package.
		 */
		this.mind = mind;
		/**
		 * When in the Course of logic events, it becomes necessary for one object to dissolve the lexical scope which has isolated it from another, and to assume among the powers of the globe, the separate and equal station to which the Laws of Javascript and Javascript's Documentation entitle it, a decent respect to the opinions of developers requires that it should declare the causes which impel it to the elevation. Sometimes it's good to know the thing's parent.
		 */
		if(this.mind != null) this.mind.parent = this;
		/**
		 * Method that takes a {@link UMessage} from a {@link Community} and makes the appropriate calls on this.mind to send it to its destination here.
		 */
		this.distribute = distributor;
		/**
		 * Array of {@link Community Communities} to which this Participant belongs.
		 */
		this.communities = [];
		/**
		 * Array of channels to which this Participant listens.
		 * Often, this list should be populated when the participant emits a 'ready' event.
		 */
		this.channels = [];
		/**
		 * Function to be called upon joining a community. ~~One might consider calling `reload()` in here, if joining a community means this Participant needs to join more channels.~~ Just kidding, don't do that! Reloading on Community changes happens automatically; see {@link Community}.
		 * @callback Participant~join_callback
		 * @param {Community} community
		 */
		this.join_callback = o.join_callback;
		/**
		 * Custom function used to refresh the list of channels to which this Participant should be listening.
		 */
		this.refresh_channels = o.refresh_channels;
		/**
		 * Custom function to reload this Participant. This function is intended to contain platform-specific operations, such as joining newly added channels.
		 */
		this.reload = o.reload;
		/**
		 * When this Participant is added to a {@link Community}, the Community calls this method, which appends the Community to this Participant's array and calls the join_callback method.
		 */
		this.join = function(community) {this.communities.push(community); this.join_callback(community);};
		/**
		 * Upon receiving a message from the wild (where the users are, not a {@link Community}), the Participant converts it to a {@link UMessage}. The UMessage is then passed into this `propagate` method, which sends it to each of this Participant's Communities. This method also optionally logs some information.
		 * @param {UMessage} message Message to be relayed to the rest of the world
		 */
		this.propagate = function(message) {
			if(process.env.NODE_ENV == 'debug') this.logger.debug('Propagating message from ' + message.source);
			this.communities.forEach(c => c.distribute(message));
		};
	}
}

module.exports = Participant;
