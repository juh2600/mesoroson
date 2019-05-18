/**
 * A Community contains a group of {@link Participant}s and a method for distributing a {@link UMessage} to each Participant,
 * along with methods for managing the list of Participants.
 * @constructor
 */
class Community {
	constructor() {
		/**
		 * Array containing the {@link Participant}s in this Community.
		 */
		this.participants = [];
		/**
		 * Informs each {@link Participant} that it should reload its information about this Community.
		 * The specific effects this has on a Participant are dependent on its platform.
		 * For example, if a Discord client joins this Community, then calling this method should cause
		 * IRC clients to update the list of channels they should listen to.
		 */
		this.reload = function() {
			this.participants.forEach(p => {p.reload();});
		};
		/**
		 * Adds a {@link Participant} to this Community. This functionality is wrapped here instead of just pushing
		 * the Participant into the participants array. This is done because this Community also needs to be added
		 * to the Participant's list of Communities. After the new Participant is added, the Community is reloaded.
		 */
		this.add = function(participant) {
			this.participants.push(participant);
			participant.join(this);
			this.reload();
		};
		/**
		 * Distributes a {@link UMessage} to every {@link Participant} in this Community.
		 */
		this.distribute = function(message) {
			this.participants.forEach(p => {p.distribute(message);});
		};
	}
}

module.exports = Community;
