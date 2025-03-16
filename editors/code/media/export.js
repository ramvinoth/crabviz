function exportSVG() {
  const svg = document.querySelector("svg").cloneNode(true);

  svg.appendChild(document.getElementById("codetwin_style").cloneNode(true));
  svg.insertAdjacentHTML(
    "beforeend",
    "<style>:is(.cell, .edge) { pointer-events: none; }</style>"
  );

  acquireVsCodeApi().postMessage({
    command: 'saveSVG',
    svg: svg.outerHTML.replaceAll("&nbsp;", "&#160;")
  });
}

window.addEventListener('message', (e) => {
  const message = e.data;

  switch (message.command) {
    case 'exportSVG':
        exportSVG();
        break;
  }
});
