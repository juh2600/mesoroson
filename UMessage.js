/**
 * Represents the most basic message format, which can be interpreted by any Participant.
 */
class UMessage {
	/**
	 * Constructs the UMessage type.
	 * @constructor
	 * @param {Object} source - Identifier of the source of this message, in the form {participant: string, channel: string}. Should uniquely identify the channel from which the message originated; this is used to prevent feedback.
	 * @param {Object} user - Contains the displayName and realName of the user, as applicable.
	 * @param {string} channel - Display name of the channel to which this message belongs. Does not start with '#' unless that's the first character in the channel name.
	 * @param {string} content - Content of the message.
	 * @return {UMessage} An object having this structure:
	 * 	{
	 * 		source:
	 * 			{
	 * 				participant: string,
	 * 				channel: string (channel ID where available)
	 * 			},
	 * 		user:
	 * 			{
	 * 				displayName: string,
	 * 				realName: string
	 * 			},
	 * 		channel: string,
	 * 		content: string
	 *	}
	 */
	constructor(source, user, channel, content) {
		this.source = source;
		this.user = user;
		this.channel = channel;
		this.content = content;
		if(process.env.NODE_ENV == 'debug') console.log(this);
	}
}

module.exports = UMessage;
