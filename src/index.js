import Message from './message'

const createMessageConstructor = eventName => {
  /**
   * Creates new message by "following" a previous message.
   *
   * The term follow comes from eventide docs. Following means to line up
   * the metadata so that a new event is linked to the previous event. In
   * debugging it would be available to see the whole workflow and get
   * and accurate picture as to what happened if something goes wrong.
   * See Metadata.follow for details on how metadata gets linked between
   * events.
   *
   * Following can also include copying over fields from the preceeding events
   * data.
   *
   * @param {Message} preceedingMessage - the event that you would like to follow
   * @param {Object} opts - the options of what keys to possibly copy over
   * @param {Array} opts.exclude - the keys to exclude when copying over keys
   * @param {Array} [opts.copy=all] - the keys to copy over if `exclude` option not passed
   *
   * @returns {Message}
   */
  const follow = (preceedingMessage, opts) =>
    Message.follow(eventName, preceedingMessage, opts)

  /**
   * Creates a new event by reading in the raw form that was persisted to message store
   *
   * @param {object} rawEvent - a raw event tide database message
   *
   * @returns {Message}
   */
  const fromRead = rawEvent =>
    new Message(
      eventName,
      rawEvent.data,
      Object.assign({}, rawEvent.metadata, {
        id: rawEvent.id,
        streamName: rawEvent.streamName
      })
    )

  /**
   * Creates a message by manually building one
   *
   * Usually events will come from either hydrating one from a previous database
   * write or by following a previous event. This case handles when you have the
   * very first message in a workflow that does not have any messages before it
   * and you need to fully scaffold one out with all the requried metadata and data
   *
   * @param {Object} buildArgs - options for how to build event
   * @param {Object} [buildArgs.data={}] - what data to put on new event
   * @param {Object} [buildArgs.metadata={}] - what metadata to put on new event
   *
   * @returns {Message}
   */
  const build = ({ data = {}, metadata = {} } = {}) =>
    new Message(eventName, data, metadata)

  return {
    follow,
    fromRead,
    build
  }
}

export default createMessageConstructor
