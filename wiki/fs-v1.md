**Book Entries:**

`credit`, `debit`, `income`, `expense`, `refund`, `tax` =
```
[ 'yyyy-mm-dd', ₹₹₹.₹₹, 'BOOK', 'HEAD', 'TAG', ['SOURCE'], ['Note'], [seq] ]
```

- debit = -credit
- refund = -expense

**Source Entries:**

`payment`, `receipt` =
```
[ 'yyyy-mm-dd', ₹₹₹.₹₹, 'SOURCE', ['Note'], [seq] ]
```

`transfer` =
```
[ 'yyyy-mm-dd', ₹₹₹.₹₹, 'SOURCE FROM', 'SOURCE TO', ['Note'], [seq] ]
```

- receipt = -payment

**Plurals:**
- credits = [credit]
- debits = [debit]
- incomes = [income]
- expenses = [expense]
- refunds = [refund]
- taxes = [tax]
- payments  = [payment]
- receipts = [receipt]
- transfers = [transfer]

**Entry Group:**
```
{
  "note" = " ... ",
  "starred" = true | false | undefined,
  "credit" = [ ... ],
  "debit" = [ ... ],
  "expenses" = [
    [ ... ],
    [ ... ],
    [ ... ]
  ],
  "taxes" = [
    [ ... ],
    [ ... ],
    [ ... ]
  ],
  "payment" = [ ... ],
  "receipt" = [ ... ]
}
```

**Folder:**
```
[
  [ ... ],
  [ ... ],
  {
    ... ,
    ... ,
    ...
  },
  [ ... ]
]
```
