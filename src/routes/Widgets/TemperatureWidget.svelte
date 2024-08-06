<script>
    export let temperature = 200;
    export let previousTemperature = 195;
    export let temperatureHistory = [190, 192, 198, 200]; // Example data

    function getSmoothPath(data) {
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        const normalizedData = data.map(d => ((d - min) / range) * 18 + 1);
        const points = normalizedData.map((d, i) => [(i / (data.length - 1)) * 98 + 1, 20 - d]);

        const pathData = points.reduce(
            (acc, point, i, a) =>
                i === 0
                    ? `M ${point[0]},${point[1]}`
                    : `${acc} ${i === 1 ? '' : 'S'} ${point[0] - (point[0] - a[i - 1][0]) / 2},${a[i - 1][1]} ${point[0]},${point[1]}`,
            ''
        );

        return pathData;
    }
</script>

<div class="bg-black text-white rounded-lg shadow-md flex flex-col justify-between h-full w-full">
    <div class="p-2 flex items-center justify-between">
        <div class="text-lg font-semibold">Temperature</div>
        <div class="text-xl">🌡️</div>
    </div>
    <div class="p-2 text-4xl font-bold">
        {temperature}°C
    </div>
    <div class="relative flex-grow p-2">
        <div class="absolute inset-0 w-full h-full">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="temperature-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#f97316" stop-opacity="0.8" />
                        <stop offset="100%" stop-color="#f97316" stop-opacity="0" />
                    </linearGradient>
                </defs>
                <path d="{getSmoothPath(temperatureHistory)}" fill="none" stroke="#f97316" stroke-width="2" />
                <path d="{`${getSmoothPath(temperatureHistory)} L 99,20 L 1,20 Z`}" fill="url(#temperature-gradient)" />
            </svg>
        </div>
        <div class="absolute bottom-0 left-0 text-sm text-gray-400">
            {previousTemperature}°C
        </div>
    </div>
</div>

<style>
    svg {
        display: block;
        width: 100%;
        height: 100%;
    }
</style>
