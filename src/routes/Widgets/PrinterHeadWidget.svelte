<script>
  import { Scatter } from 'svelte-chartjs';
  import { Chart, registerables } from 'chart.js';

  Chart.register(...registerables);

  export let printerSpecs = {
      model: 'Prusa MK4',
      ipAddr: '192.168.1.10',
      status: 'Printing',
      bedTemperature: 60,
      nozzleTemperature: 210,
      filamentType: 'PLA',
      firmwareVersion: '3.10.0',
      printJobProgress: 45,
      printTime: '01:25:30',
      remainingTime: '00:34:30',
      headPosition: { x: 100, y: 100, z: 10 }
  };

  const scatterData = {
      datasets: [
          {
              label: 'Head Position',
              data: [{ x: printerSpecs.headPosition.x, y: printerSpecs.headPosition.y }],
              pointBackgroundColor: '#f97316',
              pointRadius: 8,
          }
      ]
  };

  const scatterOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
          x: {
              type: 'linear',
              position: 'bottom',
              min: 0,
              max: 250,
              grid: {
                  color: '#444',
              },
              ticks: {
                  display: false,
              }
          },
          y: {
              type: 'linear',
              min: 0,
              max: 210,
              grid: {
                  color: '#444',
              },
              ticks: {
                  display: false,
              }
          }
      },
      plugins: {
          legend: { display: false },
          tooltip: {
              callbacks: {
                  label: function (context) {
                      const z = printerSpecs.headPosition.z;
                      return `X: ${context.raw.x}mm, Y: ${context.raw.y}mm, Z: ${z}mm`;
                  }
              }
          }
      },
      layout: {
          padding: 10,
      }
  };
</script>

<div class="bg-black w-full h-full rounded-lg flex flex-col p-4 text-white">
  <Scatter data={scatterData} options={scatterOptions} />
</div>

<style>
  /* Custom styles if needed */
</style>
