import { signal } from "@preact/signals";
import { useState, useEffect, useRef } from "preact/hooks";
import { Chart } from "chart.js";
import "chart.js/auto";

const highlightIndex = signal(0);
const setHighlightIndex = (val) => {
  highlightIndex.value = val;
};
const pause = signal(false);

const InteractiveChart = ({
  data,
  labels = null,
  xkey = "longitude",
  xkeyAsLabel = false,
  speedFactor = 1,
  autoRepeat = true
}) => {
  const chartRef = useRef(null);
  const [chartState, setChartState] = useState(null);
  const [counter, setCounter] = useState(0);

  const xLabels =
    labels ||
    (xkeyAsLabel && xkey === "time"
      ? data[xkey].map((dateString) => new Date(dateString))
      : data[xkey].map((_, idx) => idx));

  // Create chart
  useEffect(() => {
    //const xLabels = labels || data.longitude.map((_, idx) => idx);

    const newChart = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: xLabels, //data.longitude,
        datasets: [
          {
            label: "Elevation",
            data: data.z,
            pointRadius: data.z.map((_, index) => (index === 0 ? 5 : 0)),
            pointBackgroundColor: data.z.map(
              (_, index) =>
                index === 0 ? "rgba(255,0,0,0.5)" : "rgba(0,0,0,0.5)" // Default transparent
            )
          }
        ]
      },
      options: {
        animation: {
          duration: 0
        },
        scales: {
          x: {
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10,
              callback: function (value, index) {
                if (xkey === "time") {
                  const date = new Date(xLabels[index]); // Using xLabels directly
                  return `${date.getDate()}D${date.getHours()}h`;
                }
                return value;
              }
            }
          }
        },
        onClick: (evt) => {
          const point = newChart.getElementsAtEventForMode(
            evt,
            "nearest",
            { intersect: true },
            true
          )[0];
          if (point) {
            if (!pause.value) {
              setHighlightIndex(point.index);
              pause.value = true;
            } else {
              pause.value = false;
            }
          }
        }
      }
    });

    setChartState(newChart);
    return () => {
      if (newChart) {
        newChart.destroy();
      }
    };
  }, [data]);

  /* Increment highlight
  useEffect(() => {
    if (!pause.value) {
      const interval = setInterval(() => {
        setHighlightIndex((highlightIndex.value + 1) % data.z.length);
      }, 500);

      return () => clearInterval(interval);
    }
  }, [data.z.length, pause.value]); */

  // Animation using requestAnimationFrame
  useEffect(() => {
    let rafId;

    const animatePoint = () => {
      setCounter((prevCounter) => {
        if (prevCounter >= speedFactor) {
          let prevIndex = highlightIndex.value;
          let nextIndex = (prevIndex + 1) % data.z.length;
          if (nextIndex === 0 && !autoRepeat) {
            cancelAnimationFrame(rafId);
            setHighlightIndex(prevIndex);
          } else {
            setHighlightIndex(nextIndex);
          }
          return 0; // Reset counter
        }
        return prevCounter + 1;
      });
      if (!pause.value) {
        rafId = requestAnimationFrame(animatePoint);
      }
    };

    rafId = requestAnimationFrame(animatePoint);

    return () => cancelAnimationFrame(rafId);
  }, [data.z.length, speedFactor, autoRepeat]);

  useEffect(() => {
    if (!chartState) return;

    const currentBackgroundColor =
      chartState.data.datasets[0].pointBackgroundColor;
    const currentPointRadius = chartState.data.datasets[0].pointRadius;

    currentBackgroundColor.fill("rgba(0,0,255,0.5)");
    currentPointRadius.fill(0);

    currentBackgroundColor[highlightIndex.value] = "rgba(255,0,0,0.5)";
    currentPointRadius[highlightIndex.value] = 5;

    chartState.update();

    // Custom method for annotations
    const ctx = chartState.ctx;
    const meta = chartState.getDatasetMeta(0);
    const point = meta.data[highlightIndex.value];
    if (point) {
      ctx.fillStyle = "black";
      ctx.fillText(
        `Elevation: ${data.z[highlightIndex.value]}`,
        point.x,
        point.y - 10
      );
    }
  }, [chartState, highlightIndex.value]);

  return <canvas ref={chartRef} />;
};

export default InteractiveChart;
