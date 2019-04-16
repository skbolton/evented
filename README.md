# Sauced

```js
const OpenAccount = Message('OpenAccount')
const AccountOpened = Message('AccountOpened')
// making a message out of the blue. No event to follow or steal data from
const openAccount = OpenAccount.build(
  { name: 'stephen' },
  { correlationId: '1' }
)

// following an event
const accountOpened = AccountOpened.follow(openAccount)

// creating an event from reading db event
const accountOpened = AccountOpened.fromRead(someRawEvent)
```
