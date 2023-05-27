import { SplitLayoutManager } from "./layout";
import { html, render } from "lit-html";
import { live } from "lit-html/directives/live.js";

const children = [
  {
    size: 90,
    children: [
      { size: 40, children: [{ size: 40 }, { size: 20 }, { size: 40 }] },
      {
        size: 20,
        children: [{ size: 10 }, { size: 40 }, { size: 30 }, { size: 20 }],
      },
      { size: 40, children: [{ size: 20 }, { size: 50 }, { size: 30 }] },
      { size: 40, children: [{ size: 20 }, { size: 50 }, { size: 30 }] },
      { size: 40, children: [{ size: 20 }, { size: 50 }, { size: 30 }] },
    ],
  },
  {
    size: 10,
    children: [{ size: 20 }, { size: 50 }, { size: 30 }, { size: 30 }],
  },
  {
    size: 40,
    children: [
      { size: 10 },
      { size: 10 },
      { size: 10 },
      { size: 10 },
      { size: 10 },
      { size: 10 },
      { size: 10 },
      { size: 10 },
      { size: 10 },
      { size: 10 },
    ],
  },
];

const parentNode = document.createElement("div");
parentNode.id = "container";
document.body.appendChild(parentNode);

const filmstrip = document.createElement("div");
filmstrip.id = "filmstrip";
document.body.appendChild(filmstrip);

const layout = new SplitLayoutManager(children, parentNode, sync);

function options() {
  return colors.map(
    (val, index) =>
      html`<div
        class="option"
        draggable="true"
        style="--color: ${val}"
        @dragstart=${(e) => e.dataTransfer.setData("text", index)}></div>`
  );
}

function view(index, val) {
  return html`<div class="pane-view" style="--color: ${val}">
    <input
      .value=${live(val)}
      type="color"
      @input=${(e) => {
        colors[index] = e.target.value;
        sync();
      }} />
  </div>`;
}

const colors = ["#046487", "#395c00", "#3b234f", "#4f2338", "#4f4a23"];

function sync() {
  Object.entries(layout.paneMap).forEach(([paneID, data]) => {
    let pane = document.getElementById(paneID);
    if (!data) {
      render(html`<span class="empty">empty!</span>`, pane);
    } else {
      render(view(data, colors[data]), pane);
    }
  });

  render(options(), filmstrip);
}

// just randomly assign panes for the demo
Object.keys(layout.paneMap).forEach((paneID) =>
  String(
    (layout.paneMap[paneID] = String(Math.floor(Math.random() * colors.length)))
  )
);

sync();
