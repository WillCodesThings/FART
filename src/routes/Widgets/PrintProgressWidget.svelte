<script>
    import { Doughnut } from 'svelte-chartjs';
    import { Chart, registerables } from 'chart.js';

    // Register all necessary components for Chart.js
    Chart.register(...registerables);

    export let props = {
        progress: 20,
        printer: {
            select: false,
            name: "Greg",
            image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
            desc: "Dave works pretty well",
            apiKey: "iiEjCdV9rkC3oUh",
            id: 2,
            ipAddr: "192.168.50.186",
            model: "Prusa MK-4",
            status: "Offline",
            specs: {}
        }
    };

    const data = {
        labels: ['Completed', 'Remaining'],
        datasets: [
            {
                data: [props.progress, 100 - props.progress],
                backgroundColor: ['#F47C2E', '#282828'], // Orange for progress, dark gray for remaining
                borderWidth: 0, // No border for the segments
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%', // Make it a ring instead of a full pie chart
        plugins: {
            legend: {
                display: false // Hide the legend
            },
            tooltip: {
                enabled: false // Disable tooltips
            }
        }
    };
</script>

<div class="bg-black text-white rounded-lg shadow-md flex flex-col justify-center items-center p-4 h-full w-full">
    <div class="text-sm text-gray-400 mb-4">
        {props.printer.status} | {props.printer.model}
    </div>
    <div class="relative w-40 h-40 mb-4">
        <Doughnut {data} {options} />
        <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-3xl font-bold text-orange-500">{props.progress}%</div>
        </div>
    </div>
</div>
