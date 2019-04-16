import uuidV4 from 'uuid/v4'
import MessageHandler from './messageHandler'
import Metadata from './metadata'

const _metadata = Symbol('Metadata')
const _data = Symbol('Data')

const MessageCreator = eventName => {
  const createMessage = (attrs = {}) => {
    const prototypeMethods = {
      toWrite (streamName = this[_metadata].streamName) {
        return {
          id: this[_metadata].id || uuidV4(),
          streamName,
          // TODO: need to add streamname here or have writer add it
          type: eventName,
          data: this[_data],
          metadata: this[_metadata].toWrite()
        }
      },
      attributes () {
        return this[_data]
      }
    }

    const message = Object.create(prototypeMethods)
    message[_data] = {}
    message[_metadata] = new Metadata()
    const proxiedMessage = new Proxy(
      message,
      new MessageHandler(_data, _metadata)
    )
    Object.entries(attrs).forEach(([key, value]) => {
      proxiedMessage[key] = value
    })

    return proxiedMessage
  }

  createMessage.follow = (
    preceedingEvent,
    { copy = Object.keys(preceedingEvent.attributes()), exclude } = {}
  ) => {
    const metadata = preceedingEvent[_metadata]
    const data = preceedingEvent.attributes()

    const keysToCopyOver = exclude
      ? Object.keys(data).filter(key => !exclude.includes(key))
      : copy

    const nextMetadata = Metadata.follow(metadata)
    const nextData = keysToCopyOver.reduce((nextData, key) => {
      nextData[key] = preceedingEvent[key]
      return nextData
    }, {})

    return createMessage(
      nextData,
      Object.assign({}, nextMetadata.toWrite(), {
        id: data.id,
        streamName: data.streamName
      })
    )
  }

  createMessage.fromRead = rawEvent => {
    const metadata = Object.assign({}, rawEvent.metadata, {
      id: rawEvent.id,
      streamName: rawEvent.streamName
    })

    const createdMessage = createMessage(rawEvent.data)
    // add metadata before returning
    createdMessage[_metadata] = new Metadata(metadata)

    return createdMessage
  }

  return createMessage
}

export default MessageCreator
