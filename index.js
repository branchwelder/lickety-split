import { SplitLayoutManager } from "./layout";
import { html, render } from "lit-html";
import { live } from "lit-html/directives/live.js";

const test = {
  sizes: [12.454740385168986, 31.13685096292246, 56.408408651908545],
  children: [
    "4",
    {
      sizes: [16.74202284778404, 49.92464381888263, 33.333333333333336],
      children: [
        {
          sizes: [50, 50],
          children: ["4", "3"],
        },
        "2",
        "1",
      ],
    },
    {
      sizes: [50, 50],
      children: [
        {
          sizes: [50],
          children: ["0"],
        },
        "3",
      ],
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
