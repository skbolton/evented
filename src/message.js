import MessageHandler from './messageHandler'
import Metadata from './metadata'
import uuidV4 from 'uuid/v4'

const _metadata = Symbol('Metadata')
const _data = Symbol('Data')

class Message {
  static follow (
    eventName,
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

    const message = new Message(eventName, newData, {})
    // add the followed metadata to message
    message[_metadata] = newMetadata

    return message
  }
  constructor (eventName, data, metadata) {
    this.eventName = eventName
    this[_data] = data
    this[_metadata] = new Metadata(metadata)

    return new Proxy(this, new MessageHandler(_data, _metadata))
  }

  toWrite (streamName = this[_metadata].streamName) {
    return {
      id: this[_metadata].id || uuidV4(),
      streamName,
      type: this.eventName,
      data: this.attributes(),
      metadata: this[_metadata].toWrite()
    }
  }

  attributes () {
    return this[_data]
  }
}

export default Message
