import { SplitLayoutManager } from "./layout";
import { html, render } from "lit-html";
import { live } from "lit-html/directives/live.js";

const testLayout = {
  sizes: [50, 50],
  children: [
    {
      sizes: [40, 60],
      children: [
        { sizes: [40, 60], children: ["3", "4"] },
        { sizes: [20, 50, 30], children: ["empty", "empty", "empty"] },
      ],
    },
    {
      sizes: [30, 40, 30],
      children: ["empty", "2", "3"],
    },
  ],
};

const parentNode = document.createElement("div");
parentNode.id = "container";
document.body.appendChild(parentNode);

const filmstrip = document.createElement("div");
filmstrip.id = "filmstrip";
document.body.appendChild(filmstrip);

const layout = new SplitLayoutManager(testLayout, parentNode, sync);

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
