// @unocss-include
import { useEffect, useRef } from 'preact/hooks'
import { useSignal } from "@preact/signals"
import Plotly from 'plotly.js-dist'

const TerrainPlotly = () => {
    const showPanel = useSignal(false)
    const showInfoBox = useSignal(false)
    const data = useSignal(null)
    const jsonInputRef = useRef(null)
    const resampleInputRef = useRef(null)
    const plotDivRef = useRef(null)

    const setShowPanel = val => showPanel.value = val
    const setShowInfoBox = val => showInfoBox.value = val

    const fetchAndPlot = async () => {
        const jsonInput = jsonInputRef.current.value
        const jsonsrc = jsonInput.replace(/\s/g, '')
        const sampleVal = parseInt(resampleInputRef.current.value)
        const resample = !isNaN(sampleVal) ? sampleVal : 5

        const url = `https://api.odb.ntu.edu.tw/gebco?mode=zonly,lon360&sample=${resample}&jsonsrc=${encodeURIComponent(jsonsrc)}`

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.log("Fail to fetch this URL")
            } else {
                data.value = await res.json()
                setShowPanel(true)
            }
        } catch (err) {
            console.log(err)
        }
    }

    const plotlyMesh = () => {
        if (data.value) {
            const trace = {
                x: data.value.longitude,
                y: data.value.latitude,
                z: data.value.z,
                type: 'mesh3d',
                opacity: 0.5,
                color: 'blue'
            }
            const layout = {
                title: '3D Terrain',
                autosize: true,
                scene: {
                    aspectratio: { x: 1, y: 1, z: 0.5 },
                    camera: { eye: { x: 1.25, y: 1.25, z: 1.25 } }
                }
            }

            Plotly.newPlot(plotDivRef.current, [trace], layout)
        }
    }

    useEffect(() => {
        if (showPanel.value) {
            plotlyMesh()
        }
    }, [data.value, showPanel.value])

    return (
        <div>
            <h2>3D Terrain Visualization</h2>
            <textarea ref={jsonInputRef} rows="4" cols="50"></textarea><br />
            <label for="resampleInput" class="text-sm">Resample polygon:&nbsp; 
                <input type="number" ref={resampleInputRef} name="resampleInput" class="max-w-[100px]"
                       defaultValue="5" min="1" max="10" step="1" />
            </label>
            <button onClick={fetchAndPlot} class="ml-2">Fetch and Plot</button>
            <button onClick={() => setShowInfoBox(true)}
                    class="bg-blue-500 text-white ml-2 rounded-full cursor-pointer hover:bg-blue-700">
                    ?
            </button>
            {showInfoBox.value && (
                <div class="p-4 bg-white rounded-lg shadow-lg absolute top-10 right-10">
                    <p>Input should be a valid GeoJSON object.</p>
                    <button onClick={() => setShowInfoBox(false)}>Close</button>
                </div>
            )}
            {showPanel.value && (
                <div class="fixed top-10 left-10 w-3/5 h-3/5 bg-white border border-gray-300 shadow-xl p-4 z-10">
                    <button onClick={() => setShowPanel(false)}>Close</button>
                    <div ref={plotDivRef} id="plot" class="w-full h-auto"></div>
                </div>
            )}
        </div>
    )
}

export default TerrainPlotly
