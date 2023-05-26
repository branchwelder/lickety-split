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
  constructor({
    children,
    parentNode,
    paneEvents,
    index = 0,
    onSplit,
    onRemove,
  }) {
    this.id = children;
    this.index = index;

    this.dom = document.createElement("div");
    this.dom.classList.add("pane-container");

    render(paneToolbar(onSplit, onRemove), this.dom);

    this.pane = document.createElement("div");
    this.pane.id = this.id;
    this.pane.classList.add("pane");

    this.dom.appendChild(this.pane);

    if (paneEvents) Object.assign(this.pane, paneEvents);

    parentNode.appendChild(this.dom);
  }

  panes() {
    return { [this.id]: this.dom };
  }
}

export class NestedSplitLayout {
  constructor({
    children,
    parentNode,
    paneEvents,
    direction = "horizontal",
    index = 0,
    onSplit,
    onRemove,
  }) {
    this.direction = direction;
    this.paneEvents = paneEvents;
    this.id = index;
    this.onSplit = onSplit;
    this.onRemove = onRemove;

    this.index = index;
    this.currentChildIndex = 0;

    this.dom = document.createElement("div");
    this.dom.classList.add(direction);
    parentNode.appendChild(this.dom);

    this.children = children.map((child) => this.addChild(child));

    this.children.forEach((child) => this.dom.appendChild(child.dom));
    this.split = this.doSplit();
  }

  doSplit() {
    if (this.split) this.split.destroy();

    return Split(this.dom.children, {
      direction: this.direction,
      gutterSize: 3,
    });
  }

  addChild(child) {
    const index = this.currentChildIndex;
    const config = {
      children: child,
      index: index,
      parentNode: this.dom,
      paneEvents: this.paneEvents,
      direction: this.direction == "horizontal" ? "vertical" : "horizontal",
      onSplit: (direction) => this.splitChild(index, direction),
      onRemove: () => this.removeChild(index),
    };
    this.currentChildIndex++;
    return Array.isArray(child)
      ? new NestedSplitLayout(config)
      : new Pane(config);
  }

  splitChild(childIndex, direction) {
    console.log("splitting child", childIndex, direction);
    if (direction == this.direction) {
      // we need to actually add the split the parent
    } else {
      // we add a new child
    }
  }

  removeChild(childIndex) {
    const removeIndex = this.children.findIndex(
      (child) => child.index == childIndex
    );

    const removed = this.children.splice(removeIndex, 1);
    this.dom.removeChild(removed[0].dom);

    if (this.children.length == 0) {
      this.onRemove(this.index);
      return;
    }

    this.split = this.doSplit();
  }

  panes() {
    return this.children.reduce((acc, cur) => {
      return { ...acc, ...cur.panes() };
    }, {});
  }
}
