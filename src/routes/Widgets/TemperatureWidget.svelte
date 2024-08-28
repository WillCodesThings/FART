<script>
  import { Line } from 'svelte-chartjs';
  import { Chart, registerables } from 'chart.js';
  import { ThermometerIcon } from 'svelte-feather-icons';
  import { onMount } from 'svelte';

  // Register all necessary components for Chart.js
  Chart.register(...registerables);

  export let props = {
      bedTemperature: 60,
      previousBedTemperature: 55,
      bedTemperatureHistory: [20, 25, 30, 35, 40, 50, 60, 70, 75, 80, 85, 90],
      nozzleTemperature: 200,
      previousNozzleTemperature: 195,
      nozzleTemperatureHistory: [25, 60, 100, 140, 180, 200, 210, 220, 225, 230, 235, 240]
  };

  let selectedTemperature = 'Nozzle'; // Initialize with Nozzle
  let currentTemperature = props.nozzleTemperature;
  let currentPreviousTemperature = props.previousNozzleTemperature;
  let currentTemperatureHistory = props.nozzleTemperatureHistory;

  $: console.log("bedTemp: ", currentTemperatureHistory);

  const data = {
      labels: Array.from({ length: currentTemperatureHistory.length }, (_, i) => `Point ${i + 1}`),
      datasets: [
          {
              label: 'Temperature',
              data: currentTemperatureHistory,
              borderColor: '#f97316', // Orange color for the line
              backgroundColor: 'rgba(249, 115, 22, 0.1)', // Orange gradient for the fill
              fill: true,
              tension: 0.4, // Smooth curve
              pointRadius: 0, // No points on the line
              borderWidth: 2, // Line width
          }
      ]
  };

  const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
          x: {
              display: false, // Hide X axis
          },
          y: {
              display: false, // Hide Y axis
              min: Math.min(...currentTemperatureHistory) - 2, // Add some padding below
              max: Math.max(...currentTemperatureHistory) + 2, // Add some padding above
          }
      },
      plugins: {
          legend: { display: false }, // Hide legend
          tooltip: { enabled: false } // Disable tooltips
      },
      layout: {
          padding: 0, // No padding around the chart
      }
  };

  function updateTemperatureData() {
      if (selectedTemperature === 'Nozzle') {
          currentTemperature = props.nozzleTemperature;
          currentPreviousTemperature = props.previousNozzleTemperature;
          currentTemperatureHistory = props.nozzleTemperatureHistory;
      } else {
          currentTemperature = props.bedTemperature;
          currentPreviousTemperature = props.previousBedTemperature;
          currentTemperatureHistory = props.bedTemperatureHistory;
      }

      data.datasets[0].data = currentTemperatureHistory;
  }

  $: updateTemperatureData(); // Update the chart data whenever selectedTemperature changes
</script>

<div class="bg-black w-full h-full rounded-lg flex flex-col justify-center items-center ">
  <div class="text-white font-bold absolute top-2 left-2 flex flex-row w-[95%] items-center z-20">
      <select
          class="bg-black text-white rounded px-2 py-1"
          bind:value={selectedTemperature}
          on:change={updateTemperatureData}
      >
          <option value="Nozzle">Nozzle</option>
          <option value="Bed">Bed</option>
      </select>
      <div class="ml-auto text-white"><ThermometerIcon class="" /></div>
  </div>
  <div class="text-3xl text-white font-bold mt-6">
      {currentTemperature} <span class="text-lg align-top">°</span>
  </div>
  <div class="absolute inset-0 w-full h-full">
      <Line {data} {options} />
      <div class="bg-black opacity-30 text-white text-xs p-2 absolute bottom-2 left-4 rounded-xl">
          {currentPreviousTemperature}°
      </div>
  </div>
</div>
