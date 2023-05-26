import { NestedSplitLayout } from "./layout";
import { html, render } from "lit-html";
import { map } from "lit-html/directives/map.js";
import { live } from "lit-html/directives/live.js";

const children = [["a", "b", "c"], ["d"]];

function drop(e) {
  e.preventDefault();
  const data = e.dataTransfer.getData("application/split");
  state.layout[e.target.id] = data;
  syncView();
}

const filmstrip = document.createElement("div");
filmstrip.id = "filmstrip";
document.body.appendChild(filmstrip);

const parentNode = document.createElement("div");
parentNode.id = "container";
document.body.appendChild(parentNode);

const paneEvents = {
  ondrop: drop,
  ondragover: (e) => e.preventDefault(),
};

const root = new NestedSplitLayout({ children, parentNode, paneEvents });

function drag(e, data) {
  e.dataTransfer.setData("application/split", data);
}

function testViews() {
  return html`${map(
    Object.keys(state.ops),
    (key) =>
      html`<div draggable="true" @dragstart=${(e) => drag(e, key)}>${key}</div>`
  )}`;
}

function view(key, val) {
  return html`<div class="pane-view">
    <div>${key}</div>
    <input
      .value=${live(val)}
      type="number"
      @input=${(e) => {
        state.ops[key].value = e.target.value;
        syncView();
      }} />
  </div>`;
}

const state = {
  ops: {
    hello: { value: 10 },
    world: { value: 20 },
    split: { value: 30 },
    pane: { value: 40 },
    layout: { value: 50 },
  },
  layout: {},
};

render(testViews(), filmstrip);

function syncView() {
  console.log(state.layout);
  Object.entries(state.layout).forEach(([paneID, stateField]) =>
    render(
      view(stateField, state.ops[stateField].value),
      document.getElementById(paneID)
    )
  );
}
