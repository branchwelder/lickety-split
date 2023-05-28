import Split from "split.js";
import { html, render } from "lit-html";

function paneToolbar(split, close) {
  return html`<div draggable="true" class="pane-toolbar">
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
  constructor({ paneEvents, id, split, close, paneDom, manager }) {
    this.id = id;

    this.dom = document.createElement("div");
    this.dom.classList.add("pane-container", "dropzone");
    this.dom.id = `${this.id}-container`;

    this.manager = manager;

    render(paneToolbar(split, close), this.dom);

    this.paneDom = paneDom ?? document.createElement("div");
    this.paneDom.id = this.id;
    this.paneDom.classList.add("pane");

    this.dom.appendChild(this.paneDom);

    if (paneEvents) {
      Object.entries(paneEvents).forEach(
        ([ev, handler]) => (this.dom[ev] = (e) => handler(e, this.id))
      );
    }
  }

  createToolbar() {
    const toolbarContainer = document.createElement("div");
  }

  saveLayout() {
    return this.manager.paneMap[this.id];
  }
}

export class SplitPane {
  constructor(
    children,
    manager,
    { sizes, direction = "horizontal", id, collapse }
  ) {
    if (children.length < 2) {
      console.warn(
        "Problem building split layout: SplitPanes must have at least two children"
      );
    }
    this.manager = manager;
    this.direction = direction;
    this.id = id;
    this.sizes = sizes;

    this.collapse = collapse;

    this.currentSplitID = 0; // incremented every time a child is added

    this.dom = document.createElement("div");
    this.dom.id = this.id;
    this.dom.classList.add(direction);

    this.children = children.map((child) => this.createChild(child));
    this.children.forEach((child) => this.dom.appendChild(child.dom));

    this.split;
    this.updateSplit();
  }

  createSplit(config) {
    const splitID = `${this.id}-${this.currentSplitID}`;
    this.currentSplitID++;

    return new SplitPane(config.children, this.manager, {
      id: splitID,
      sizes: config.sizes,
      direction: this.oppositeAxis(),
      collapse: (grandChild) => this.collapseSplitPane(splitID, grandChild),
    });
  }

  adoptSplit(existingSplit) {
    const splitID = `${this.id}-${this.currentSplitID}`;
    this.currentSplitID++;

    existingSplit.id = splitID;
    existingSplit.collapse = (grandChild) =>
      this.collapseSplitPane(splitID, grandChild);

    return existingSplit;
  }

  createPane({ id, paneDom }) {
    return new Pane({
      id,
      paneDom,
      manager: this.manager,
      paneEvents: this.manager.paneEvents,
      split: (direction) =>
        direction == this.direction
          ? this.convertPaneToSplit(id)
          : this.insertChild(this.createChild("empty"), this.getChildIndex(id)),
      close: () => this.closePane(id),
    });
  }

  createChild(child) {
    // Returns either a Pane or a SplitPane based on what the child is.

    if (child instanceof Pane) {
      // Create a pane, but reuse the ID and DOM
      return this.createPane({
        id: child.id,
        paneDom: child.paneDom,
      });
    } else if (child instanceof SplitPane) {
      // Adopt the split
      return this.adoptSplit(child);
    } else if (child.children) {
      // If it has children, then we need to make a new split to hold them
      return this.createSplit(child);
    } else {
      // Otherwise create pane
      return this.createPane({
        id: this.manager.registerPane(child),
      });
    }
  }

  updateSplit() {
    if (this.split) this.split.destroy();

    if (this.sizes.length != this.children.length) {
      throw new Error("Error: Children array out of sync with sizes");
    }

    let multiplier = 100 / this.sizes.reduce((acc, cur) => acc + cur, 0);

    this.sizes = this.sizes.map((size) => size * multiplier);

    this.split = Split(this.dom.children, {
      direction: this.direction,
      gutterSize: 2,
      sizes: this.sizes,
      onDragEnd: (sizes) => (this.sizes = sizes),
    });
  }

  convertPaneToSplit(paneID) {
    const index = this.getChildIndex(paneID);

    // remove the pane from the array of children
    const oldPane = this.children.splice(index, 1)[0];

    // Create a new split where the first child is the old pane
    const newSplit = this.createSplit({
      children: [oldPane, "empty"],
      sizes: [50, 50],
    });

    // Put the new split into the children array
    this.children.splice(index, 0, newSplit);
    // Don't need to change this.sizes because it is a 1:1 element swap

    // Replace the dom of the old pane with the dom of the new split
    oldPane.dom.replaceWith(newSplit.dom);

    this.updateSplit();
    this.manager.sync();
  }

  insertChild(child, index) {
    this.children.splice(index + 1, 0, child);
    this.children[index].dom.after(child.dom);

    // Insert a size equal to the size at the index
    this.sizes.splice(index, 0, this.sizes[index]);

    this.updateSplit();
    this.manager.sync();
  }

  oppositeAxis() {
    return this.direction == "horizontal" ? "vertical" : "horizontal";
  }

  getChildIndex(childID) {
    return this.children.findIndex((child) => child.id == childID);
  }

  collapseSplitPane(childID, grandchild) {
    // If one of the children only has one child left, it should collapse itself.
    const index = this.getChildIndex(childID);

    if (grandchild instanceof Pane) {
      // if the grandchild is a pane, we should create pane from pane and replace the split with the pane
      const newPane = this.createPane({
        id: grandchild.id,
        paneDom: grandchild.paneDom,
      });
      const oldSplit = this.children.splice(index, 1, newPane)[0];

      // Replace the dom of the old pane with the dom of the new split
      oldSplit.dom.replaceWith(newPane.dom);
    } else if (grandchild instanceof SplitPane) {
      // else if it is a split pane, all of its children should become our children
      // because it should be on the same axis as this one

      const newChildren = grandchild.children.map((child) => {
        if (child instanceof Pane) {
          return this.createPane({
            id: child.id,
            paneDom: child.paneDom,
          });
        } else if (child instanceof SplitPane) {
          return this.adoptSplit(child);
        } else {
          console.error(
            "Error collapsing SplitPane: Encountered grandchild that is not a Pane or SplitPane"
          );
        }
      });

      const oldSplit = this.children.splice(index, 1, ...newChildren)[0];

      oldSplit.dom.replaceWith(...newChildren.map((child) => child.dom));

      // Remap the sizes so they fill the size of the removed split
      const insertSizes = grandchild.sizes;
      const newSizes = insertSizes.map(
        (size) => (size * this.sizes[index]) / 100
      );
      this.sizes.splice(index, 1, ...newSizes);
    }

    this.updateSplit();
  }

  closePane(childID) {
    // Do not close the pane if this is the root split and the pane is the only child
    // There is probably a better way of handling this
    if (this.id == "root" && this.children.length == 1) return;

    const index = this.getChildIndex(childID);
    const removed = this.children.splice(index, 1)[0];
    this.sizes.splice(index, 1)[0];
    this.manager.removePane(removed);

    if (this.children.length == 1 && this.id != "root") {
      this.collapse(this.children[0]);
    } else {
      this.updateSplit();
    }
  }

  saveLayout() {
    return {
      sizes: this.sizes,
      children: this.children.map((child) => child.saveLayout()),
    };
  }
}

export class SplitLayoutManager {
  constructor(baseLayout, parentNode, sync) {
    this.currentPaneID = 0;
    this.paneMap = {};
    this.sync = sync;
    this.sourcePane = null;

    this.paneEvents = {
      ondrop: (e, paneID) => this.onDropInPane(e, paneID),
      ondragover: (e, paneID) => this.onDragOverPane(e, paneID),
      ondragenter: (e, paneID) => this.onDragEnterPane(e, paneID),
      ondragleave: (e, paneID) => this.onDragLeavePane(e, paneID),
      ondragstart: (e, paneID) => this.onStartDragPane(e, paneID),
      ondragend: (e, paneID) => this.onDragEndPane(e, paneID),
    };

    this.root = new SplitPane(baseLayout.children, this, {
      id: "root",
      sizes: baseLayout.sizes,
    });
    parentNode.appendChild(this.root.dom);
  }

  registerPane(data) {
    // Adds the pane to the pane map. Returns the pane's ID.
    const paneID = `pane-${this.currentPaneID}`;
    this.currentPaneID++;
    this.paneMap[paneID] = data;
    return paneID;
  }

  removePane(pane) {
    pane.dom.remove();
    delete this.paneMap[pane.id];
    this.saveLayout();
  }

  onStartDragPane(e, paneID) {
    e.dataTransfer.setData("text", this.paneMap[paneID]);
    e.dataTransfer.setData("source-pane", paneID);
    e.dataTransfer.setDragImage(e.currentTarget, 10, 10);
  }

  onDragEndPane(e, paneID) {
    console.log("drag end");
  }

  onDropInPane(e, paneID) {
    e.preventDefault();
    e.currentTarget.classList.remove("targeted");

    const data = e.dataTransfer.getData("text");

    const sourcePane = e.dataTransfer.getData("source-pane");

    if (sourcePane) {
      this.paneMap[sourcePane] = this.paneMap[paneID];
    }

    this.paneMap[paneID] = data;
    this.sync();
  }

  onDragOverPane(e, paneID) {
    e.preventDefault();
  }

  onDragEnterPane(e, paneID) {
    if (e.currentTarget.classList.contains("dropzone")) {
      e.currentTarget.classList.add("targeted");
    }
  }

  onDragLeavePane(e, paneID) {
    // don't remove the class if the leave event is triggered by a child
    if (e.currentTarget.contains(e.relatedTarget)) return;

    if (e.currentTarget.classList.contains("dropzone")) {
      e.currentTarget.classList.remove("targeted");
    }
  }

  saveLayout() {
    return this.root.saveLayout();
  }
}
