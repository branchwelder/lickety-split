import Split from "split.js";
import { html, render } from "lit-html";

function paneToolbar(split, close) {
  return html`<div class="pane-toolbar">
    <button @click=${() => split("vertical")}>
      <i class="fa-solid fa-grip-lines-vertical fa-xs"></i>
    </button>
    <button @click=${() => split("horizontal")}>
      <i class="fa-solid fa-grip-lines fa-xs"></i>
    </button>
    <button @click=${() => close()}>
      <i class="fa-solid fa-xmark fa-xs"></i>
    </button>
  </div>`;
}

class Pane {
  constructor({ paneEvents, id, onSplit, onRemove, size }, pane) {
    this.id = pane ? pane.id : id;
    this.pane = pane ? pane.pane : document.createElement("div");
    this.size = size;

    this.dom = document.createElement("div");
    this.dom.classList.add("pane-container");
    this.dom.id = `${this.id}-container`;

    render(paneToolbar(onSplit, onRemove), this.dom);

    this.pane.id = this.id;
    this.pane.classList.add("pane");

    this.dom.appendChild(this.pane);

    if (paneEvents) {
      Object.entries(paneEvents).forEach(
        ([ev, handler]) => (this.pane[ev] = (e) => handler(e, this.id))
      );
    }
  }

  paneDom() {
    return { [this.id]: this.dom };
  }
}

export class SplitPane {
  constructor(
    children,
    manager,
    { paneEvents, size, direction = "horizontal", id = "layout-0", onRemove }
  ) {
    this.manager = manager;
    this.direction = direction;
    this.paneEvents = paneEvents;
    this.id = id;
    this.size = size;

    this.removeSelf = onRemove;

    this.currentSplitID = 0; // incremented every time a child is added

    this.dom = document.createElement("div");
    this.dom.id = this.id;
    this.dom.classList.add(direction);

    this.children = [];

    children.forEach((child) => this.insertChild(child));

    this.split;
  }

  createSplit(children, size) {
    const splitID = `${this.id}-${this.currentSplitID}`;
    this.currentSplitID++;

    return new SplitPane(children, this.manager, {
      id: splitID,
      size: size,
      paneEvents: this.paneEvents,
      direction: this.oppositeAxis(),
      onRemove: () => this.removeChild(splitID),
    });
  }

  createPane(pane, size) {
    const paneID = pane ? pane.id : this.manager.nextPaneID();

    const config = {
      id: paneID,
      size: size,
      paneEvents: this.paneEvents,
      direction: this.oppositeAxis(),

      onSplit: (direction) =>
        direction == this.direction
          ? this.splitChild(paneID)
          : this.insertChild({}, this.getChildIndex(paneID)),
      onRemove: () => this.removeChild(paneID),
    };
    return new Pane(config, pane);
  }

  createChild(child) {
    if (child.children) {
      return this.createSplit(child.children, child.size);
    } else {
      return this.createPane(child.pane, child.size);
    }
  }

  updateSplit() {
    if (this.split) this.split.destroy();

    // let multiplier =
    //   100 / this.children.reduce((acc, cur) => acc + cur.size, 0);
    // // console.log(100 / total);

    // const sizes = this.children.map((child) => child.size * multiplier);

    this.split = Split(this.dom.children, {
      direction: this.direction,
      gutterSize: 2,
      // sizes: sizes,
    });
  }

  splitChild(paneID) {
    const index = this.getChildIndex(paneID);
    const oldPane = this.children.splice(index, 1)[0];
    const newSplit = this.createSplit([
      { size: 50, pane: oldPane },
      { size: 50 },
    ]);

    oldPane.dom.replaceWith(newSplit.dom);

    this.updateSplit();
  }

  insertChild(config, index) {
    const child = this.createChild(config);

    if (index != undefined) {
      // insert the child after the specified index
      this.children.splice(index + 1, 0, child);
      this.children[index].dom.after(child.dom);
    } else {
      // add the child to the end
      this.children.push(child);
      this.dom.appendChild(child.dom);
    }

    this.updateSplit();
  }

  oppositeAxis() {
    return this.direction == "horizontal" ? "vertical" : "horizontal";
  }

  getChildIndex(childID) {
    return this.children.findIndex((child) => child.id == childID);
  }

  removeChild(childID) {
    const removed = this.children.splice(this.getChildIndex(childID), 1)[0];
    this.manager.removePane(removed);

    if (this.children.length == 0) {
      if (this.removeSelf) this.removeSelf(this.index);
      return;
    }

    this.updateSplit();
  }

  paneDom() {
    return this.children.reduce((acc, cur) => {
      return { ...acc, ...cur.paneDom() };
    }, {});
  }
}

export class SplitLayoutManager {
  constructor(children, parentNode, sync) {
    this.currentPaneID = 0;
    this.paneMap = {};

    const paneEvents = {
      ondrop: (e, paneID) => this.onDropInPane(e, paneID, sync),
      ondragover: (e, paneID) => this.onDragOverPane(e, paneID, sync),
      ondragenter: (e, paneID) => this.onDragEnterPane(e, paneID, sync),
      ondragleave: (e, paneID) => this.onDragLeavePane(e, paneID, sync),
    };

    this.root = new SplitPane(children, this, { paneEvents });
    parentNode.appendChild(this.root.dom);
  }

  nextPaneID() {
    const paneID = `pane-${this.currentPaneID}`;
    this.currentPaneID++;
    this.paneMap[paneID] = null;
    return paneID;
  }

  removePane(pane) {
    pane.dom.remove();
    delete this.paneMap[pane.id];
  }

  onDropInPane(e, paneID, sync) {
    e.preventDefault();
    const data = e.dataTransfer.getData("text");
    console.debug(data, "dropped in", paneID);
    this.paneMap[paneID] = data;

    sync();
  }

  onDragOverPane(e, paneID) {
    e.preventDefault();

    console.debug("dragging over", paneID);
  }

  onDragEnterPane(e, paneID) {
    e.preventDefault();

    console.debug("drag entered", paneID);
  }

  onDragLeavePane(e, paneID) {
    e.preventDefault();

    console.debug("drag left", paneID);
  }

  saveLayout() {
    console.log(this.root.panes);
  }
}
