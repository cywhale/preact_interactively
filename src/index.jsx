// @unocss-include
import { render } from "preact"
import { useState, useEffect, useRef } from "preact/hooks"
import { signal, effect } from "@preact/signals"
import InteractiveChart from "./components/InteractiveChart"
import InteractiveDiagram from "./components/InteractiveDiagram"
import TerrainPlotly from "./components/TerrainPlotly"

import 'uno.css'

const dataUrl = 'https://raw.githubusercontent.com/cywhale/preact_interactively/main/data/'
const datasrc = 'tideData.json' //'bathyData.json' //bathymetry data
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
    width: 540,
    height: 300
  }
};

const App = () => {
  return (
    <div class="flex flex-col">
      <div>
        <TerrainPlotly />
      </div>
      <div>
      <h2>Interactive Chart</h2>
      { sigErr.value && <div><span>sigErr.value</span></div> }
      { !isReady.value && <div><p style="color:#98AFC7;">Loading...</p></div> }
      { isReady.value && 
        <div class="absolute left-[5%] top-[30%] p-2.5">
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
      </div>
    </div>
  )
}

if (typeof window !== "undefined") {
  render(<App />, document.getElementById("root"));
}
