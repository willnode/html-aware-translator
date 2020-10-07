import "regenerator-runtime/runtime";
import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml";
hljs.registerLanguage("xml", xml);
import { setCORS } from "google-translate-api-browser";
import langs from "google-translate-api-browser/dist/languages";
import { decodeHTML, encodeXML } from "entities/lib/index";
// setting up cors-anywhere server address
const translate = setCORS(localStorage["trans_content_cors"] || "https://cors-anywhere-translate.dom.my.id/");
const translateBtn = document.getElementById("translateBtn");
const progress = document.getElementById("progress");
const input = document.getElementById("input");
const output = document.getElementById("output");
const langin = document.getElementById("langin");
const langout = document.getElementById("langout");
hljs.initHighlightingOnLoad();
window.addEventListener(
  "DOMContentLoaded",
  function () {
    langin.innerHTML = Object.keys(langs)
      .map((k) => `<option value="${k}">${langs[k]}</option>`)
      .join("");
    langout.innerHTML = Object.keys(langs)
      .slice(1)
      .map((k) => `<option value="${k}">${langs[k]}</option>`)
      .join("");
    langin.value = localStorage.getItem("trans_content_in") || "auto";
    langout.value = localStorage.getItem("trans_content_out") || "en";
    input.value = localStorage.getItem("trans_content") || '<p>Guten morgen, geben sie hier HTML-code ein</p>';
  },
  false
);

translateBtn.onclick = async function () {
  const config = {
    from: (localStorage["trans_content_in"] = langin.value),
    to: (localStorage["trans_content_out"] = langout.value),
  };
  let cOK = 0;
  translateBtn.setAttribute("disabled", "1");
  progress.innerText = "...";
  output.innerHTML = "<i>translating...</i>";
  let data = [];
  (localStorage["trans_content"] = input.value + "").replace(
    />(.*?)</gs,
    function (m, m1) {
      m1 = (m1 + "").trim();
      if (m1.length > 0) {
        data.push(decodeHTML(m1).replace(/\n\n/g, "\n"));
      }
    }
  );

  output.innerText = format(
    await (async function () {
      try {
        var r = data.join('\n\n');
        var o = await translate(r, config);
        var d = o.text.split('\n\n');

        console.log(r);
        console.log(o.text);
        if (d.length === data.length) {
          progress.innerText = " - done";
          return (input.value + "").replace(/>(.*?)</gs, function (m, m1) {
            m1 = (m1 + "").trim();
            if (m1.length > 0) {
              return `>${encodeXML(d[cOK++])
                .replace(/\&apos;/g, "'")
                .replace(/\&quot;/g, '"')}<`;
            } else {
              return m;
            }
          });
        } else {
          progress.innerText = " - logic fail";
          return input.value;
        }
      } catch (error) {
          progress.innerText = " - network fail";
          return input.value;
      }

    })()
  );

  translateBtn.removeAttribute("disabled");
  hljs.highlightBlock(output);
};

function format(html) {
  var tab = "  ";
  var result = "";
  var indent = "";

  html.split(/>\s*</).forEach(function (element) {
    if (element.match(/^\/\w/)) {
      indent = indent.substring(tab.length);
    }

    result += indent + "<" + element + ">\r\n";

    if (element.match(/^<?\w[^>]*[^\/]$/)) {
      indent += tab;
    }
  });

  return result.substring(1, result.length - 3);
}

async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}
