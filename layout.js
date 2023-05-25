import Split from "split.js";

class Pane {
  constructor(id, parentNode, props) {
    this.id = id;

    this.dom = document.createElement("div");
    this.dom.id = this.id;
    this.dom.classList.add("pane");

    if (props) Object.assign(this.dom, props);

    parentNode.appendChild(this.dom);
  }
}

export class NestedSplitLayout {
  constructor(children, parentNode, props, direction = "horizontal") {
    this.direction = direction;

    this.dom = document.createElement("div");
    this.dom.classList.add(direction);
    parentNode.appendChild(this.dom);

    this.children = children.map((child) =>
      Array.isArray(child)
        ? new NestedSplitLayout(
            child,
            this.dom,
            props,
            direction == "horizontal" ? "vertical" : "horizontal"
          )
        : new Pane(child, this.dom, props)
    );

    this.children.forEach((child) => this.dom.appendChild(child.dom));
    Split(this.dom.children, { direction: this.direction });
  }
}
