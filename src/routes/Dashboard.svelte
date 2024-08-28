<script lang="ts">
    import PrinterGrid from "./PrinterGrid.svelte";
    import { get } from "svelte/store";
  
    export let printer;

    function generateRandomTemperatureHistory(size, min = 180, max = 220) {
      return Array.from({ length: size }, () => Math.floor(Math.random() * (max - min + 1)) + min);
    }

    let bedTemperatureHistory: Number[] = [];
    let nozzleTemperatureHistory: Number[] = [];
  
    let printerData = null;

    function updateTempHistory(arr, max, val) {
      arr.push(val);
      // console.log(arr);
      return arr.length <= max ? arr : arr.splice(arr.length - max, max);
    }
  
    function getPrinterData() {
      fetch("/api/" + printer.id.toString(), {
        method: "GET"
      }).then(async (data) => {
        let res = await data.json();
        console.log(res);

        updateTempHistory(bedTemperatureHistory, 6, res.prinerTelem?.temperature?.bed?.actual);
        updateTempHistory(nozzleTemperatureHistory, 6, res.prinerTelem?.temperature?.tool0?.actual);

        // Mapping provided data to the required JSON structure
        const formattedData = {
          filamentCost: "Unknown", // Assuming no filament cost in provided data
          status: printer.status || res.state || "Unknown", // First preference to status from printer
          currentFile: res.job?.file?.name || "Unknown",
          files: res.files?.map(file => ({
            name: file.name,
            image: file.thumbnailBig || "", // Assuming thumbnailBig is the base64 image data
            printTime: file.refs.printTime || "Unknown"
          })) || [],
          headPosition: {
            x: 0, // Assuming no x data provided
            y: 0, // Assuming no y data provided
            z: res.prinerTelem?.telemetry?.['z-height'] || 0
          },
          name: printer.name || "Unknown",
          image: printer.image || "", // Using image from printer
          ipAddr: printer.ipAddr || "Unknown", // Assuming ipAddr is part of printer object
          model: printer.model || "Unknown",
          progress: Math.round(res.data.progress?.completion * 100) || 0,
          bedTemperature: res.prinerTelem?.temperature?.bed?.actual || 0,
          previousBedTemperature: res.prinerTelem?.temperature?.bed?.target || 0,
          bedTemperatureHistory: generateRandomTemperatureHistory(12),
          nozzleTemperature: res.prinerTelem?.temperature?.tool0?.actual || 0,
          previousNozzleTemperature: res.prinerTelem?.temperature?.tool0?.target || 0,
          nozzleTemperatureHistory: generateRandomTemperatureHistory(12),
          totalTime: res.data.progress.printTimeLeft + res.data.progress.printTime || 0,
          timeElapsed: res.data.progress.printTime || 0,
          printSpeed: res.prinerTelem.telemetry['print-speed'] || 0,
          previousprintSpeed: res.prinerTelem.telemetry['print-speed'] || 0,
          printSpeedHistory: [] // No history provided
        };
  
        console.log(res.prinerTelem.telemetry['print-speed']);
        
        printerData = formattedData;
        console.log(printerData);
      });
    }
  
    getPrinterData();
  </script>
  
  <div class="absolute top-0 left-0 w-full h-full z-30">
    {#if printerData}
      <PrinterGrid {printerData} />
    {/if}
  </div>
  