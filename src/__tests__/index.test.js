import Message from '../index'

/**
 * Here we are testing if you just create a message without following a previous message
 * or without creating one by reading an event that was already
 *
 * @returns {undefined}
 */
describe('creating new messages', () => {})

describe('MessageCreator(eventName)', () => {
  describe('Message(attrs)', () => {
    // create an instance of a message
    const MyEvent = Message('MyEvent')

    it('returns a message creator function', () => {
      const expected = 'function'
      const actual = typeof MyEvent

      expect(actual).toEqual(expected)
    })

    it('has the correct static methods', () => {
      const expected = 'function'

      expect(typeof MyEvent.follow).toEqual(expected)
      expect(typeof MyEvent.fromRead).toEqual(expected)
    })
  })

  describe('Message instances', () => {
    const AccountOpened = Message('AccountOpened')

    it('allows keys to be passed in on construction of instance', () => {
      const accountOpened = AccountOpened({ accountId: '1' })

      const expected = '1'
      const actual = accountOpened.accountId

      expect(actual).toEqual(expected)
    })

    it('allows keys to be added after construction', () => {
      const accountOpened = AccountOpened()
      accountOpened.balance = 1000

      const expected = 1000
      const actual = accountOpened.balance

      expect(actual).toEqual(expected)
    })

    it('can convert itself into a database ready event', () => {
      const accountId = '1'
      const balance = 100
      const accountOpened = AccountOpened({ accountId, balance })

      const expected = {
        id: expect.any(String),
        data: {
          accountId,
          balance
        },
        // since we are not passing in an event to follow or supplying
        // this it will be null
        streamName: null,
        type: 'AccountOpened',
        // since we didn't have any metadata these will be null
        // see #follow() tests for more on how this object gets its keys
        metadata: {
          correlationId: null,
          userId: null,
          causationStreamName: null,
          correlationStreamName: null
        }
      }

      const actual = accountOpened.toWrite()

      expect(actual).toEqual(expected)
    })

    it('has a `attributes()` function to retrieve all keys on `data`', () => {
      const accountOpened = AccountOpened({ accountId: '1', balance: 50 })

      const expected = { accountId: '1', balance: 50 }
      const actual = accountOpened.attributes()

      expect(actual).toEqual(expected)
    })
  })

  describe('creating message instances by consuming raw db events', () => {
    const AccountOpened = Message('AccountOpened')
    const rawDbEvent = {
      id: '1',
      streamName: 'accounts-123',
      type: 'AccountOpened',
      data: {
        accountId: '1',
        balance: 100
      },
      metadata: {
        correlationId: '2',
        causationStreamName: 'accounts:command',
        userId: '3',
        correlationStreamName: 'marketing-456'
      }
    }
    it('makes all keys under the `data` key of raw event available', () => {
      const accountOpened = AccountOpened.fromRead(rawDbEvent)

      expect(accountOpened.accountId).toEqual('1')
      expect(accountOpened.balance).toEqual(100)
    })

    // if we read in the event and move back to write model they should look the exact same
    it('has the exact same shape when going back to write model', () => {
      const accountOpened = AccountOpened.fromRead(rawDbEvent)

      const expected = rawDbEvent
      const actual = accountOpened.toWrite()

      expect(actual).toEqual(expected)
    })
  })

  describe('creating new messages by following a previous event', () => {
    const compressFileAcceptedEvent = {
      id: '1',
      type: 'CompressFileAccepted',
      streamName: 'compression-123',
      data: {
        fileLocation: 'somes3url',
        amount: '50%'
      },
      metadata: {
        userId: '3',
        correlationId: '4',
        // showing that we are in a workflow
        causationStreamName: 'compression-123',
        // marketing stream is asking for file to be compressed
        correlationStreamName: 'marketing-456'
      }
    }
    const CompressfileAccepted = Message('CompressFileAccepted')
    const CompressFileDownloaded = Message('CompressFileDownloaded')

    it('copies over all data fields by default when no options are passed to `follow`', () => {
      const compressFileAccepted = CompressfileAccepted.fromRead(
        compressFileAcceptedEvent
      )

      const compressFileDownloaded = CompressFileDownloaded.follow(
        compressFileAccepted
      )

      const expected = { fileLocation: 'somes3url', amount: '50%' }
      const actual = compressFileDownloaded.attributes()

      expect(actual).toEqual(expected)
    })

    it('copies over all keys other than `exclude` if `exclude` is passed', () => {
      const compressFileAccepted = CompressfileAccepted.fromRead(
        compressFileAcceptedEvent
      )

      const compressFileDownloaded = CompressFileDownloaded.follow(
        compressFileAccepted,
        { exclude: ['amount'] }
      )

      const expected = { fileLocation: 'somes3url' }
      const actual = compressFileDownloaded.attributes()

      expect(actual).toEqual(expected)
    })

    it('copies over only `copy` keys if `exclude` option is not passed', () => {
      const compressFileAccepted = CompressfileAccepted.fromRead(
        compressFileAcceptedEvent
      )

      const compressFileDownloaded = CompressFileDownloaded.follow(
        compressFileAccepted,
        { copy: ['amount'] }
      )

      const expected = { amount: '50%' }
      const actual = compressFileDownloaded.attributes()

      expect(actual).toEqual(expected)
    })
  })
})
