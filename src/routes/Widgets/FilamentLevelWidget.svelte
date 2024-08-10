<script>
  import { Bar } from 'svelte-chartjs';
  import { Chart, registerables } from 'chart.js';

  // Register all Chart.js components
  Chart.register(...registerables);

  export let props = { level: 100 };

  const data = {
      labels: ['Filament Level'],
      datasets: [
          {
              label: 'Level',
              data: [props.level],
              backgroundColor: [
                  'rgba(59, 130, 246, 0.8)' // Blue color for the bar
              ],
              borderColor: [
                  'rgba(59, 130, 246, 1)' // Darker blue for the bar border
              ],
              borderWidth: 1,
          }
      ]
  };

  const options = {
      scales: {
          y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                  callback: function(value) {
                      return value + '%'; // Add percentage sign
                  },
                  color: '#ffffff', // Set the color of the labels to white for visibility
              },
              grid: {
                  drawBorder: false, // Remove the border
                  color: 'rgba(255, 255, 255, 0.1)' // Subtle grid color
              }
          },
          x: {
              display: false, // Hide X axis
          }
      },
      plugins: {
          legend: {
              display: false // Hide legend
          },
          tooltip: {
              enabled: false // Disable tooltips
          }
      },
      elements: {
          bar: {
              borderRadius: 10, // Rounded corners for the bar
          }
      },
      maintainAspectRatio: false // Allow the chart to fully fill the container
  };
</script>

<div class="widget-container bg-black text-white rounded-lg shadow-md flex flex-col justify-center items-center h-full w-full">
  <div class="p-2 text-4xl font-bold">
      {props.level}%
  </div>
  <div class="relative flex-grow w-full h-full">
      <Bar {data} {options} />
  </div>
</div>
