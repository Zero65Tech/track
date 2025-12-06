**Book Entries:**

```
[ 'TYPE', 'yyyy-mm-dd', ₹₹₹.₹₹, 'BOOK', 'HEAD', 'TAG', ['SOURCE'], ['Note'] ]
```
- TYPE = `credit`, `debit`, `income`, `expense`, `refund`, `tax`
- debit = -credit
- refund = -expense
```
[ 'relocate', 'yyyy-mm-dd', ₹₹₹.₹₹, 'BOOK FROM', 'BOOK TO', ['Note'] ]
```



**Source Entries:**

```
[ 'TYPE', 'yyyy-mm-dd', ₹₹₹.₹₹, 'SOURCE', ['Note'] ]
```
- TYPE = `payment`, `receipt`
- receipt = -payment
```
[ 'transfer', 'yyyy-mm-dd', ₹₹₹.₹₹, 'SOURCE FROM', 'SOURCE TO', ['Note'] ]
```



**Entry Group:**
```
{
  "version" = "v2"
  "name" = " ... ",
  "starred" = true | false | undefined,
  "entries" = [
    [ ... ],
    [ ... ],
    [ ... ]
  ]
}
```

**Folder:**
```
[
  {
    ... ,
    ... ,
    ...
  },
  {
    ... ,
    ... ,
    ...
  }
]
```
