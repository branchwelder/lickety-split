import { SplitLayoutManager } from "./layout";
import { html, render } from "lit-html";
import { map } from "lit-html/directives/map.js";
import { live } from "lit-html/directives/live.js";

const children = [
  {
    size: 60,
    children: [{ size: 40 }, { size: 20 }, { size: 40 }],
  },
  { size: 40 },
];

const parentNode = document.createElement("div");
parentNode.id = "container";
document.body.appendChild(parentNode);

const filmstrip = document.createElement("div");
filmstrip.id = "filmstrip";
document.body.appendChild(filmstrip);

const layout = new SplitLayoutManager(children, parentNode, sync);

function testViews() {
  return html`${map(
    Object.entries(state.colors),
    ([key, val]) =>
      html`<div
        class="option"
        draggable="true"
        style="--color: ${val}"
        @dragstart=${(e) => e.dataTransfer.setData("text", key)}></div>`
  )}`;
}

function view(key, val) {
  return html`<div class="pane-view" style="--color: ${val}">
    <input
      .value=${live(val)}
      type="color"
      @input=${(e) => {
        state.colors[key] = e.target.value;
        sync();
      }} />
  </div>`;
}

const state = {
  colors: ["#046487", "#395c00", "#3b234f", "#4f2338", "#4f4a23"],
};

render(testViews(), filmstrip);

function sync() {
  Object.entries(layout.paneMap).forEach(([paneID, data]) => {
    let pane = document.getElementById(paneID);
    if (!data) {
      render(html`<span class="empty">empty!</span>`, pane);
    } else {
      render(view(data, state.colors[data]), pane);
    }
  });

  render(testViews(), filmstrip);
}

sync();
