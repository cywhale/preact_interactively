import { Fragment, render } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { signal, effect } from "@preact/signals";
//import jsonData from "./data.json";
//import tideData from "./tideData.json";
import InteractiveChart from "./InteractiveChart";
import InteractiveDiagram from "./InteractiveDiagram";

const dataUrl = 'https://raw.githubusercontent.com/cywhale/preact_interactively/main/data/'
const datasrc = 'tideData.json' //'data.json' //bathymetry data
const jsonData = signal({})
const isReady = signal(false)
const sigErr = signal('')

effect(async () => {
  if (!isReady.value) {
    try {
        const res = await fetch(`${dataUrl}/${datasrc}`)
        if (!res.ok) {
          sigErr.value = 'Error: Fail to fetch data'
        } else {
          jsonData.value = await res.json()
          sigErr.value = ''
          isReady.value = true
          console.log("Data fetch ok")
        }
    } catch (err) {
        sigErr.value =`Error: ${err.message}`
    }
  }
})

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

const App = () => {
  return (
    <Fragment>
      { sigErr.value && <div><span>sigErr.value</span></div> }
      { !isReady.value && <div><p style="color:#98AFC7;">Loading...</p></div> }
      { isReady.value && 
        <div style="position:absolute;left:5%;top:5%;padding:10px">
          <InteractiveDiagram data={jsonData.value} chartOpts={opts} />
          <InteractiveChart
            data={jsonData.value}
            xkey="time"
            xkeyAsLabel={true}
            speedFactor={10}
            autoRepeat={true}
          />
        </div>
      }
    </Fragment>
  );
}

if (typeof window !== "undefined") {
  render(<App />, document.getElementById("root"));
}
