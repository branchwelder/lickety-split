import { SplitLayoutManager } from "./layout";
import { html, render } from "lit-html";
import { live } from "lit-html/directives/live.js";

const test = {
  sizes: [19.074271444588607, 47.59239522207807, 33.333333333333336],
  children: [
    {
      sizes: [33.33333333333333, 33.33333333333333, 33.33333333333333],
      children: ["3", "1", "0"],
    },
    "3",
    {
      sizes: [50, 50],
      children: ["2", "4"],
    },
  ],
};

const parentNode = document.createElement("div");
parentNode.id = "container";
document.body.appendChild(parentNode);

const filmstrip = document.createElement("div");
filmstrip.id = "filmstrip";
document.body.appendChild(filmstrip);

const layout = new SplitLayoutManager(test, parentNode, sync);

function options() {
  return html`${colors.map(
      (val, index) =>
        html`<div
          class="option"
          draggable="true"
          style="--color: ${val}"
          @dragstart=${(e) => e.dataTransfer.setData("text", index)}></div>`
    )}<button
      @click=${() => {
        const layoutJSON = layout.saveLayout();
        console.log(layoutJSON);
        navigator.clipboard.writeText(JSON.stringify(layoutJSON));
      }}>
      copy layout JSON
    </button>`;
}

const colors = ["#046487", "#395c00", "#3b234f", "#4f2338", "#4f4a23"];

function sync() {
  Object.entries(layout.paneMap).forEach(([paneID, data]) => {
    let pane = document.getElementById(paneID);
    if (data == "empty") {
      render(html`<span class="empty">${paneID} is empty!</span>`, pane);
    } else {
      render(
        html`<div class="pane-view" style="--color: ${colors[data]}">
          <span>${paneID}</span>
          <input
            .value=${live(colors[data])}
            type="color"
            @input=${(e) => {
              colors[data] = e.target.value;
              sync();
            }} />
        </div>`,
        pane
      );
    }
  });

  render(options(), filmstrip);
}

sync();
