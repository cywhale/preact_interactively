import { Fragment, render } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import jsonData from "./data.json";
import tideData from "./tideData.json";
import InteractiveChart from "./InteractiveChart";
import InteractiveDiagram from "./InteractiveDiagram";

const opts = {
  z: {
    key: "z",
    unit: "cm",
    label: "Tide height",
    digit: 3
  },
  x: {
    key: "time",
    label: "",
    keyAsLabel: true
  },
  line: {
    color: "darkgray"
  },
  cursor: {
    color: "rgba(255,0,0,0.5)",
    speedFactor: 10,
    autoRepeat: true
  },
  annotate: {
    color: "#5A5A5A",
    label: ["x", "z"]
  },
  layout: {
    width: 600,
    height: 400
  }
};

//<InteractiveDiagram data={jsonData} /> //"rgba(51, 102, 204, 0.5)"
function App() {
  return (
    <Fragment>
      <div style="position:absolute;left:5%;top:5%;padding:10px">
        <InteractiveDiagram data={tideData} chartOpts={opts} />
        <InteractiveChart
          data={tideData}
          xkey="time"
          xkeyAsLabel={true}
          speedFactor={10}
          autoRepeat={true}
        />
      </div>
    </Fragment>
  );
}

if (typeof window !== "undefined") {
  render(<App />, document.getElementById("root"));
}
