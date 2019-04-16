import Message from '../index'

/**
 * This block is testing when creating brand new messages - meaning messages that are
 * not following other messages in a sequence or aren't created by reading in a raw
 * event that was persisted to a database. This use case is not as common
 * as the others and only happens if you have a command that is the starting point
 * in a workflow. In this case you have to set all the metadata and data so that
 * events downstream will be able to get at the metadata
 */
describe('creating brand new messages', () => {
  const SomeCommand = Message('SomeCommand')

  it('allows user to set data fields by passing in `data`', () => {
    const command = SomeCommand.build({
      data: {
        something: true,
        foo: 'bar'
      }
    })

    const expected = { something: true, foo: 'bar' }
    const actual = command.attributes()

    expect(actual).toEqual(expected)
  })

  it('allows users to set keys on metadata, applying defaults to non supplied keys', () => {
    const command = SomeCommand.build({
      data: {},
      metadata: {
        correlationId: '1'
      }
    })

    // with the defaults applied
    const expected = {
      correlationId: '1',
      userId: null,
      causationStreamName: null,
      correlationStreamName: null
    }
    // this is the only way to get the metadata for an event
    // this library abstracts metadata aways quite a bit so that
    // users don't accidentally write it wrong
    const actual = command.toWrite().metadata

    expect(actual).toEqual(expected)
  })
})

/**
 * This block is testing creating a message by reading in data that was persisted
 * to the event store. This raw form is the fully expanded view of the event. The
 * fromRead function essentially just wraps this form and gives a more user friendly
 * api into the data of the event
 */
describe('creating a message by reading in the raw database event form', () => {
  // here is an example of what a database event looks like
  const AnEvent = Message('AnEvent')
  const rawDatabaseEvent = {
    id: '1', // normally some guid
    type: 'AnEvent',
    streamName: 'entity-123',
    data: {
      field1: true,
      amount: 5
    },
    metadata: {
      correlationId: '2',
      userId: '3',
      correlationStreamName: 'other-456',
      causationStreamName: 'entity-123'
    }
  }

  it('makes all `data` keys available', () => {
    const anEvent = AnEvent.fromRead(rawDatabaseEvent)

    const expected = { field1: true, amount: 5 }
    const actual = anEvent.attributes()

    expect(actual).toEqual(expected)
  })

  // once the user has written the metadata we don't show it again
  // this way they don't accidentally change it later and break the workflow
  it('hides the metadata', () => {
    const anEvent = AnEvent.fromRead(rawDatabaseEvent)

    const expected = undefined
    const actual = anEvent.metadata

    expect(actual).toEqual(expected)
  })

  // we should be able to freely move from raw db event -> event -> raw
  // without any data changing
  it('has same shape when putting back to the raw database form', () => {
    const anEvent = AnEvent.fromRead(rawDatabaseEvent)

    const expected = rawDatabaseEvent
    const actual = anEvent.toWrite()

    expect(actual).toEqual(expected)
  })
})

/**
 * This block is testing when an event needs to "follow" a previous event in a workflow.
 * Following means that its metadata needs to relate to the previous events metadata.
 * Optionally, users can also supply through `opts` key what values from the data
 * they would like copied over to the new event
 *
 */
describe('creating a message by following a previous message', () => {
  const PenDropped = Message('PenDropped')
  const PenDroppedNoticed = Message('PenDroppedNoticed')

  const aPendroppedRaw = {
    id: '1',
    type: 'PenDropped',
    streamName: 'pens-987',
    data: {
      height: 1,
      drama: 'too much'
    },
    metadata: {
      correlationId: '2',
      userId: '3',
      causationStreamName: 'pens-987',
      correlationStreamName: 'pens:command'
    }
  }

  const penDropped = PenDropped.fromRead(aPendroppedRaw)

  it('copies over data keys of preceeding message by default', () => {
    const penDroppedNoticed = PenDroppedNoticed.follow(penDropped)

    const expected = { height: 1, drama: 'too much' }
    const actual = penDroppedNoticed.attributes()

    expect(actual).toEqual(expected)
  })

  it('allows user to set what keys to exclude', () => {
    const penDroppedNoticed = PenDroppedNoticed.follow(penDropped, {
      exclude: ['drama']
    })

    const expected = { height: 1 }
    const actual = penDroppedNoticed.attributes()

    expect(actual).toEqual(expected)
  })

  it('allows user to set what keys to copy', () => {
    const penDroppedNoticed = PenDroppedNoticed.follow(penDropped, {
      copy: ['height']
    })

    const expected = { height: 1 }
    const actual = penDroppedNoticed.attributes()

    expect(actual).toEqual(expected)
  })
})
