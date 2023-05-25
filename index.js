import { NestedSplitLayout } from "./layout";
import { html, render } from "lit-html";
import { map } from "lit-html/directives/map.js";
import { live } from "lit-html/directives/live.js";

const test2 = [["a", "b", "c"], "d"];

function drop(e) {
  e.preventDefault();
  const data = e.dataTransfer.getData("application/split");
  layout[e.target.id] = data;
  syncView();
}

const filmstrip = document.createElement("div");
filmstrip.id = "filmstrip";
document.body.appendChild(filmstrip);

const container = document.createElement("div");
container.id = "container";
document.body.appendChild(container);

const props = {
  ondrop: drop,
  ondragover: (e) => e.preventDefault(),
};

const root = new NestedSplitLayout(test2, container, props);

function drag(e, data) {
  e.dataTransfer.setData("application/split", data);
}

function testViews() {
  return html`${map(
    Object.keys(state),
    (key) =>
      html`<div draggable="true" @dragstart=${(e) => drag(e, key)}>${key}</div>`
  )}`;
}

function view(key, val) {
  return html`<div>
    <div>${key}</div>
    <input
      .value=${live(val)}
      type="number"
      @input=${(e) => {
        state[key].value = e.target.value;
        syncView();
      }} />
  </div>`;
}

const state = {
  hello: { value: 10 },
  world: { value: 20 },
  split: { value: 30 },
  pane: { value: 40 },
  layout: { value: 50 },
};

const layout = {};

render(testViews(), filmstrip);

function syncView() {
  Object.entries(layout).forEach(([paneID, stateField]) =>
    render(
      view(stateField, state[stateField].value),
      document.getElementById(paneID)
    )
  );
}
