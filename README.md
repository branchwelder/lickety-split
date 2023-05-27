# Split Pane Layout

This is a split pane layout library. The NestedSplitLayout class holds a te

### SplitLayout

Class representing one "split": an ordered collection of children that are
grouped along the same axis.

#### Properties

- `axis`: either horizontal or vertical
- `children`: an array of children
- `dom`: the dom node containing the collection of children

#### Methods

- `insertChild`: inser

### Pane

- a unique ID
- a toolbar

### Events

- drop
- remove
- hSplit
- vSplit

## layout data structure

```js
[
  { size: 80 },
  {
    size: 20,
    children: [{ size: 40 }, { size: 50 }],
  },
];

// [[20,40,40], [30,70]];
```
