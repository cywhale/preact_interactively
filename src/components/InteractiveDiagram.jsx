import { signal } from "@preact/signals";
import { useState, useEffect, useRef } from "preact/hooks";
//import * as d3 from "d3";
import { Grid } from "@vx/grid";
import { LinePath } from "@vx/shape";
import { scaleLinear } from "@vx/scale";
import { AxisBottom, AxisLeft } from "@vx/axis";

const cursorPause = signal(false);
const configZChartOpts = {
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
};

const InteractiveDiagram = ({ data, labels = null, chartOpts = {} }) => {
  const opts = { ...configZChartOpts, ...chartOpts };
  const [currentPoint, setCurrentPoint] = useState(0);
  const [counter, setCounter] = useState(0);
  const animationRef = useRef(null);
  const svgRef = useRef(null);
  /* abbrev for options configuration */
  const zkey = opts.z.key;
  const zunit = opts.z.unit;
  const xkey = opts.x.key;
  const xlabel = opts.x.label;
  const xkeyAsLabel = opts.x.keyAsLabel;
  const speedFactor = opts.cursor.speedFactor;
  const autoRepeat = opts.cursor.autoRepeat;
  const lineColor = opts.line.color;
  const margin = { top: 10, right: 10, bottom: 40, left: 40 };
  const minw =
    opts.layout.minwidth && opts.layout.minwidth >= 2 * margin.left
      ? opts.layout.minwidth
      : 2 * margin.left;
  const minh =
    opts.layout.minheight && opts.layout.minheight >= 2 * margin.bottom
      ? opts.layout.minheight
      : 2 * margin.bottom;
  const outerw =
    opts.layout.width && opts.layout.width >= minw ? opts.layout.width : minw;
  const outerh =
    opts.layout.height && opts.layout.height >= minh
      ? opts.layout.height
      : minh;
  const width = outerw - margin.left - margin.right;
  const height = outerh - margin.top - margin.bottom;

  const padTo2Digits = (num) => {
    return num.toString().padStart(2, "0");
  };
  const formatDateTime = (date, withTime = true, withSecond = false) => {
    let datex = [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate())
    ].join("-"); //join('/') //e.g. format: mm/dd/yyyy
    if (!withTime) return datex;
    let timex = date.getHours() + ":" + date.getMinutes();
    if (!withSecond) return `${datex} ${timex}`;
    return `${datex} ${timex}:${date.getSeconds()}`;
  };

  const mappedData = data[zkey].map((z, index) => ({
    z: z,
    index: index,
    label: xkeyAsLabel
      ? xkey === "time"
        ? new Date(data[xkey][index])
        : data[xkey][index]
      : labels
      ? labels[index]
      : index
  }));

  /*  xkeyAsLabel && data[xkey][0] instanceof Date
      ? d3.scaleTime({
          domain: [data[xkey][0], data[xkey][data[xkey].length - 1]],
          range: [0, 400]
        }): */

  const xScale = scaleLinear({
    domain: [0, mappedData.length - 1],
    range: [0, width]
  });

  const yScale = scaleLinear({
    //domain: [d3.min(data[zkey]), d3.max(data[zkey])],
    domain: [Math.min(...data[zkey]), Math.max(...data[zkey])],
    range: [height, 0] // SVG height - flipped for correct orientation
  });

  //const speedFactor = 15; // Increase for slower animation, decrease for faster animation.

  const animatePoint = () => {
    setCounter((prevCounter) => {
      if (prevCounter >= speedFactor) {
        setCurrentPoint((prevPoint) => {
          if (prevPoint < mappedData.length - 1) return prevPoint + 1;
          if (autoRepeat) return 0;
          return prevPoint;
        });
        return 0; // Reset counter
      }
      return prevCounter + 1;
    });

    if (!cursorPause.value) {
      animationRef.current = requestAnimationFrame(animatePoint);
    }
  };

  /*  
  const animatePoint = () => {
    setCurrentPoint((prevPoint) => {
      if (prevPoint < mappedData.length - 1) return prevPoint + 1;
      if (autoRepeat) return 0;
      return prevPoint;
    });
    if (!cursorPause.value) {
      animationRef.current = requestAnimationFrame(animatePoint);
    }
  };
*/
  useEffect(() => {
    if (!cursorPause.value) {
      animationRef.current = requestAnimationFrame(animatePoint);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [mappedData.length, cursorPause.value, autoRepeat]);

  const handlePointClick = (index) => {
    if (!cursorPause.value) {
      cancelAnimationFrame(animationRef.current);
      setCurrentPoint(index);
      cursorPause.value = true;
    } else {
      cursorPause.value = false;
    }
  };

  //const numDesiredTicks = 5;
  //const tickInterval = Math.floor(mappedData.length / numDesiredTicks);
  const tickInterval =
    mappedData.length > 2000
      ? 500
      : mappedData.length > 500
      ? 100
      : mappedData.length > 200
      ? 50
      : mappedData.length > 50
      ? 10
      : 5;
  const tickValues = mappedData
    .map((_, index) => (index % tickInterval === 0 ? index : -1))
    .filter((index) => index !== -1);
  const cursorTextx = //xScale(currentPoint) + 10;
    xScale(currentPoint) + minw <= width
      ? xScale(currentPoint) + 10
      : xScale(currentPoint) - minw;

  return (
    <svg width={outerw} height={outerh} ref={svgRef}>
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        <Grid xScale={xScale} yScale={yScale} width={width} height={height} />
        <LinePath
          data={mappedData}
          x={(d) => xScale(d.index)}
          y={(d) => yScale(d.z)}
          stroke={lineColor}
          strokeWidth={2}
        />

        {mappedData.map((point, index) => (
          <circle
            key={index}
            cx={xScale(index)}
            cy={yScale(point.z)}
            r={5}
            fill={index === currentPoint ? "rgba(255,0,0,0.5)" : "transparent"}
            onClick={() => handlePointClick(index)}
          />
        ))}

        {/* Elevation Annotation */}
        {opts.annotate.label && opts.annotate.label.length > 0 && (
          <text
            x={cursorTextx}
            y={yScale(mappedData[currentPoint].z)}
            fill={opts.annotate.color}
          >
            {opts.annotate.label.map((axis, index) => {
              let dy = `${index * 15}`;
              let ctent =
                axis === "z"
                  ? `${
                      opts.z.digit > 0
                        ? mappedData[currentPoint].z.toFixed(opts.z.digit)
                        : mappedData[currentPoint].z
                    } ${zunit}`
                  : axis === "x"
                  ? `${
                      xkeyAsLabel && xkey === "time"
                        ? formatDateTime(mappedData[currentPoint].label)
                        : mappedData[currentPoint].label
                    }`
                  : axis;
              return (
                <tspan x={cursorTextx} dy={dy}>
                  {ctent}
                </tspan>
              );
            })}
          </text>
        )}

        {/* X and Y Axes with labels */}
        {opts.z.label && (
          <text
            transform={`rotate(-90)`}
            y={0 - margin.left}
            x={0 - height / 2}
            dy="1em"
            style={{ textAnchor: "middle" }}
          >
            {opts.z.label}
            {zunit ? ` (${zunit})` : ""}
          </text>
        )}
        <AxisLeft
          scale={yScale}
          top={0}
          left={0}
          label="Elevation"
          tickStroke="#ddd"
          tickLength={5}
          numTicks={10}
        />
        <AxisBottom
          scale={xScale}
          top={height}
          left={0}
          label={xlabel}
          tickStroke="#ddd"
          tickLength={5}
          tickValues={tickValues}
          tickFormat={(index) => {
            if (xkeyAsLabel && xkey === "time") {
              const date = mappedData[index].label;
              return (
                //date.toISOString().substring(0, 10) +
                date.getDate() + "D" + date.getHours() + "h" //+ ":" + date.getMinutes()
              );
            }
            return mappedData[index].label;
          }}
        />
      </g>
    </svg>
  );
};

export default InteractiveDiagram;

