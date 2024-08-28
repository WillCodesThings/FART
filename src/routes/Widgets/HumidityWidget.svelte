<script>
    import { Line } from 'svelte-chartjs';
    import { Chart, registerables } from 'chart.js';
    import { DropletIcon } from 'svelte-feather-icons';
  
    // Register all necessary components for Chart.js
    Chart.register(...registerables);
  
    export let props = { printSpeed: 37.8, previousprintSpeed: 41.3, printSpeedHistory: [41.3, 39.5, 38.7, 37.8] };
  
    console.log(props);

    const data = {
      labels: Array.from({ length: props.printSpeedHistory.length }, (_, i) => `Point ${i + 1}`),
      datasets: [
        {
          label: 'printSpeed',
          data: props.printSpeedHistory,
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
          min: Math.min(...props.printSpeedHistory) - 2, // Add some padding below
          max: Math.max(...props.printSpeedHistory) + 2, // Add some padding above
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
  </script>
  
  <div class="bg-black w-full h-full rounded-lg flex flex-col justify-center items-center ">
    <div class="text-white font-bold absolute top-2 left-2 flex flex-row w-[95%]">
        printSpeed
        <div class="ml-auto text-white"><DropletIcon class="fill-white" /></div>
    </div>
    <div class="text-3xl text-white font-bold">
        {props.printSpeed} 
    </div>
    <div class="absolute inset-0 w-full h-full">
        <!-- <Line {data} {options} /> -->
        <div class="bg-black opacity-30 text-white text-xs p-2 absolute bottom-2 left-4 rounded-xl">
            {props.previousprintSpeed}
        </div>
    </div>
    
  </div>
