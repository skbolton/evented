import MessageHandler from './messageHandler'
import Metadata from './metadata'
import uuidV4 from 'uuid/v4'

const _metadata = Symbol('Metadata')
const _data = Symbol('Data')

/**
 * class for giving messages a more declarative api
 *
 */
class Message {
  /**
   * Creates a new event by "following" a previous message
   *
   * Links up metadata from previous event and offers an options
   * to copy keys over from previous message
   * @param {String} name - name of new message
   * @param {Message} preceedingMessage - message object to follow
   * @param {Object} options - options for specifying what fields to copy
   * @param {Array} [options.exclude] - what keys to exclude when copying
   * @param {Array} [options.copy=all] - what keys to copy if `exclude` is not passed
   *
   * @returns {Message}
   */
  static follow (
    name,
    preceedingMessage,
    { copy = Object.keys(preceedingMessage.attributes()), exclude } = {}
  ) {
    const newMetadata = Metadata.follow(preceedingMessage[_metadata])
    const keysToCopyOver = exclude
      ? Object.keys(preceedingMessage.attributes()).filter(
        key => !exclude.includes(key)
      )
      : copy

    const newData = keysToCopyOver.reduce((newData, key) => {
      newData[key] = preceedingMessage[key]
      return newData
    }, {})

    const message = new Message(name, newData, {})
    // add the followed metadata to message
    message[_metadata] = newMetadata

    return message
  }

  /**
   * Creates a new message
   * @param {String} name - Name of this message
   * @param {Object} data - what data to wrap
   * @param {Object} metadata - what metadata to hold
   *
   * @returns {Message}
   */
  constructor (name, data, metadata) {
    this.name = name
    this[_data] = data
    this[_metadata] = new Metadata(metadata)

    return new Proxy(this, new MessageHandler(_data, _metadata))
  }

  /**
   * Expands Message into its database ready form
   *
   * @returns {Object}
   */
  toWrite (streamName = this[_metadata].streamName) {
    return {
      id: this[_metadata].id || uuidV4(),
      streamName,
      type: this.name,
      data: this.attributes(),
      metadata: this[_metadata].toWrite()
    }
  }

  /**
   * Retrieves all keys being stored on the data of the message
   *
   * @returns {Object}
   */
  attributes () {
    return this[_data]
  }
}

export default Message
