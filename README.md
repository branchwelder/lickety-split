# lickety split, a nested split layout manager

Lickety split is a little drag-and-drop split layout manager built on top of
[Split.js](https://split.js.org/). See the live
[demo](https://twigg.gg/lickety-split/). I made this for another project, and am
posting it separately in case the code is useful for anyone else. Your milage
may vary.

## Usage

You'll need `layout.js` and `layout.css` from this repository, as well as the
NPM packages `split.js` and `lit-html`. I'll figure out better distribution
eventually. To create a new layout, you create an instance of the
`SplitLayoutManager` class like so:

```js
let layoutManager = new SplitLayoutManager(baseLayout, parentNode, sync);
```

where:

- `baseLayout` is the layout data structure to load (documented below),
- `parentNode` is the dom node to render the layout into, and
- `sync` is a function which the layout manager will run when:
  - external data is dropped into a pane,
  - a pane is closed,
  - a pane is split (horizontally or vertically), or
  - a pane is dropped into another pane (and consequently their data is
    swapped).

### Assigning Data to Panes

The `SplitLayoutManager` class maintains an object (`paneMap`) that tracks which
data is assigned to which pane ID. To set up drag and drop, use the layout
managers `attachPaneDropData` method to assign data to a drag event. If the drag
target is dropped into a pane, the data will then be assigned to that pane and
consequently represented in the `paneMap`.

```js
const dragStartHandler = (e) => layout.attachPaneDropData(e, someData);
```

There is probably a better way to do this (isn't there always?) but this works
for my purposes.

### Rendering into the panes

`SplitLayoutManager.paneMap` is an object where each key is the id of the pane's
DOM node and each value is the pane data currently assigned to that pane. When
loaded, the demo `paneMap` looks like this:

```js
{
    "pane-0": "green",
    "pane-1": "magenta",
    "pane-2": "yellow",
    "pane-3": "purple",
    "pane-4": "blue",
    "pane-5": "green"
}
```

The layout manager increments the pane ID whenever a pane is added, so you
shouldn't have a problem with conflicting pane IDs unless you create multiple
`SplitLayoutManager` instances. Someone else can fix that if they feel like it.

To render into a pane, you can query the dom for the pane element and add
children to it using normal DOM API methods:

```js
const pane = document.getElementById(paneID);
pane.appendChild(paneUI);
```

The demo's `sync` function iterates over the current `paneMap` and renders a
template into each pane based on the data assigned to the pane.

```js
function sync() {
  // Iterate through the key-value pairs in the pane map
  Object.entries(layoutManager.paneMap).forEach(([paneID, paneData]) => {
    // Get the DOM node for the pane using the pane ID
    const pane = document.getElementById(paneID);

    // If the paneData is empty render empty pane UI. Otherwise render a
    // pane UI based on whatever data is currently in the pane.
    if (paneData == "empty") {
      render(emptyPane(paneID), pane);
    } else {
      render(colorPickerPane(paneID, paneData), pane);
    }
  });

  // Render the options array as well, just so the previews update. may not
  // be necessary depending on what you're doing
  render(paneOptions(), paneOptionsContainer);
}
```

This example uses the `lit-html` library to render a color picker into each pane
based on a global `colors` state object. Changing the color will change the base
`colors` object and re-synchronize the layout. With this pattern, it is easy to
have multiple panes referring to the same data open at the same time and keep
them syncronized.

### Saving and loading layouts

The layout data structure is a tree where each branch node is a `SplitGroup` and
each leaf node is a `Pane`. The `SplitGroup` class maintains an array of child
nodes (which can either be a `Pane` or another `SplitGroup`), along with a
corresponding array of sizes (percentage values that are passed to Split.js).
Panes are represented in the layout data structure as the data they were
assigned. In the demo, the pane-data is a string which is a key in an object
containing a collection of color values. The demo layout looks like this:

```js
const test = {
  sizes: [20, 50, 30],
  children: [
    { sizes: [30, 40, 30], children: ["green", "magenta", "yellow"] },
    "purple",
    { sizes: [50, 50], children: ["blue", "green"] },
  ],
};
```

## todo

Current priority:

- Pane toolbar customization
- "insert pane" drop zones

For what started as a simple project, there are a surprising number of
UX-related open questions which I don't have the capacity to address right now.
Documenting them here anyway:

- pane toolbar
  - Currently it is hard-coded with three buttons: split vertical, split
    horizontal, and close. However, I am not sure if those should be properties
    of the pane or properties of the pane's container.
  - How to enable toolbar customization? E.g. assigning a title to the pane
    toolbar? or perhaps additional menu items?
- dragging and dropping panes
  - Add drop zones to insert pane instead of swapping panes
  - Should inserting a pane through dragging create a new split group where it
    is a sibling of the destination pane? Or should it be a child of the closest
    split group?
  - When dragging a pane into another pane, should it be swapped with the
    destination or overwrite it? If the destination is overwritten, what happens
    to the source? Should it become empty, stay the same, or be removed?
- Tabs in panes
  - If there are tabs in panes, they would clearly be part of the containing
    pane. But that opens more questions than it answers.
  - What would be the difference between dragging a tab vs. dragging a pane? In
    VSCode dragging a pane drags all the tabs in it and assigns them to a
    destination pane.
- Empty panes
  - How to handle the toolbar on root-level empty panes?
  - When a split happens, should it duplicate the source pane or be empty?
- Mobile
  - Pane gutter drag targets are too small on mobile. How to improve without
    sacrificing gutter space? Invisible targets could interfere with pane UI.
- Active panes
  - There is no concept of "active" panes, which is a feature of many code
    editors. Unsure whether to put effort into implementing this. It would
    enable "click-to-open" Pane UI instead of drag-and drop.

## done

- [x] split pane horizontally/vertically
- [x] remove pane
- [x] drag and drop data into pane
- [x] return object mapping pane ids to data
- [x] drag-and-drop panes to swap data between them
- [x] save and load layout
- [x] save and load with percentage sizes
- [x] write some passable documentation
