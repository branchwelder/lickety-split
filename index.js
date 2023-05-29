import { SplitLayoutManager } from "./layout";
import { html, render } from "lit-html";
import { live } from "lit-html/directives/live.js";

const testLayout = {
  sizes: [20, 50, 30],
  children: [
    { sizes: [30, 40, 30], children: ["green", "magenta", "yellow"] },
    "purple",
    { sizes: [50, 50], children: ["blue", "green"] },
  ],
};

const colors = {
  blue: "#046487",
  green: "#395c00",
  purple: "#3b234f",
  magenta: "#4f2338",
  yellow: "#4f4a23",
};

// render app skeleton
render(
  html`<div id="container"></div>
    <div id="pane-options"></div>`,
  document.body
);

const parentNode = document.getElementById("container");
const paneOptionsContainer = document.getElementById("pane-options");

// Make the layout manager
const layoutManager = new SplitLayoutManager(testLayout, parentNode, sync);

// Function for rendering the pane options. Note how layoutManager.attachPaneDropData
// is called in the dragstart event
function paneOptions() {
  return html`${Object.entries(colors).map(
      ([key, val]) =>
        html`<div
          class="option"
          draggable="true"
          style="--color: ${val}"
          @dragstart=${(e) => layoutManager.attachPaneDropData(e, key)}></div>`
    )}<button
      @click=${() => {
        const layoutJSON = layoutManager.saveLayout();
        console.log(layoutJSON);
        navigator.clipboard.writeText(JSON.stringify(layoutJSON));
      }}>
      copy layout JSON
    </button>`;
}

// Note: you don't have to pass in paneID to the pane templates,
// but it is an option.
function emptyPane(paneID) {
  return html`<span class="empty">${paneID} is empty!</span>`;
}

function colorPickerPane(paneID, paneData) {
  // colorpicker, which can change the color of the corresponding color
  // in the colors object and then resynchronize the layout
  return html`<div class="pane-view" style="--color: ${colors[paneData]}">
    <span>paneID: ${paneID} </span>
    <span>paneData: ${paneData}</span>
    <span>colors["${paneData}"] = ${colors[paneData]}</span>

    <input
      .value=${live(colors[paneData])}
      type="color"
      @input=${(e) => {
        colors[paneData] = e.target.value;
        sync();
      }} />
  </div>`;
}

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

sync();
