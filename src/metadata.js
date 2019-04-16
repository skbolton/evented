class Metadata {
  static follow (preceedingMetadata) {
    return new Metadata({
      correlationId: preceedingMetadata.correlationId,
      causationStreamName: preceedingMetadata.streamName,
      streamName: preceedingMetadata.streamName,
      correlationStreamName: preceedingMetadata.correlationStreamName,
      userId: preceedingMetadata.userId
    })
  }

  constructor ({
    streamName = null,
    id = null,
    correlationId = null,
    userId = null,
    correlationStreamName = null,
    causationStreamName = null
  } = {}) {
    this.streamName = streamName
    this.id = id
    this.correlationId = correlationId
    this.userId = userId
    this.correlationStreamName = correlationStreamName
    this.causationStreamName = causationStreamName
  }

  toWrite () {
    return {
      correlationId: this.correlationId,
      causationStreamName: this.causationStreamName,
      correlationStreamName: this.correlationStreamName,
      userId: this.userId
    }
  }
}

export default Metadata
