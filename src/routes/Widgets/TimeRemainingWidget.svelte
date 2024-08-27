<script>
    import { Pie } from 'svelte-chartjs';
    import { Chart, registerables } from 'chart.js';

    // Register all necessary components for Chart.js
    Chart.register(...registerables);

    // Define props for the widget

    export let props = {totalTime:120, timeElapsed:45};

    export let totalTime = 120; // Total time for the task in minutes
    export let timeElapsed = 45; // Time elapsed in minutes

    const timeRemaining = totalTime - timeElapsed;
    const percentageCompleted = (timeElapsed / totalTime) * 100;

    const data = {
        labels: ['Time Remaining', 'Time Elapsed'],
        datasets: [
            {
                label: 'Time',
                data: [timeRemaining, timeElapsed],
                backgroundColor: ['#1f2937', '#f97316'], // Dark gray for remaining, orange for elapsed
                hoverOffset: 4,
                borderWidth: 0 // No border for the pie slices
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        if (context.label === 'Time Remaining') {
                            return `Time Remaining: ${timeRemaining} mins`;
                        } else {
                            return `Time Elapsed: ${timeElapsed} mins`;
                        }
                    }
                }
            }
        }
    };
</script>

<div class="bg-black w-full h-full rounded-lg flex flex-col p-4 justify-center items-center text-white">
    <div class="flex flex-col items-center justify-center w-full">
        <div class="w-32 h-32 relative">
            <Pie {data} {options} />
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                    <span class="text-2xl font-bold">{Math.floor(timeRemaining / 60)}h {timeRemaining % 60}m</span>
                    <p class="text-sm mt-1 text-gray-400">{percentageCompleted.toFixed(1)}% completed</p>
                </div>
            </div>
        </div>
    </div>
</div>
