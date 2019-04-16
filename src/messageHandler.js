class MessageHandler {
  constructor (dataKey, metadataKey) {
    this.dataKey = dataKey
    this.metadataKey = metadataKey
  }

  get (event, key) {
    const prototypeMethod = Reflect.get(event, key)
    return prototypeMethod || event[this.dataKey][key]
  }

  set (event, key, value) {
    if (key === this.metadataKey) {
      event[this.metadataKey] = value
      return true
    }
    event[this.dataKey][key] = value
    return true
  }
}

export default MessageHandler
