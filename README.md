# preact_interactively
Created with CodeSandbox

## Setup

  1. install: yarn install

  2. run: yarn start

## Components

  1. Line chart with tracking point

      - D3.js based: configuration of the component as following. 
      - chart.js based: experimental 
```
const default_config = {
  z: {
    key: "z",
    unit: "m",
    label: "Elevation",
    digit: -1
  },
  x: {
    key: "longitude",
    label: "", //use index
    keyAsLabel: false //use index
  },
  line: {
    color: "#0196da"
  },
  cursor: {
    color: "rgba(255,0,0,0.5)",
    speedFactor: 10, //make it slower
    autoRepeat: true
  },
  annotate: {
    color: "#5A5A5A",
    label: ["z", "x"]
  },
  layout: {
    width: 600,
    height: 400,
    minwidth: 100,
    minheight: 100
  }
}
```

