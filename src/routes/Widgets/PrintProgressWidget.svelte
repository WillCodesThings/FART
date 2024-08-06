<script>
    export let progress = 0;
</script>

<div class="bg-black text-white rounded-lg shadow-md flex flex-col justify-between h-full w-full">
    <div class="p-2 flex items-center justify-between">
        <div class="text-lg font-semibold">Print Progress</div>
    </div>
    <div class="p-2 text-4xl font-bold">
        {progress}%
    </div>
    <div class="relative flex-grow p-2">
        <div class="absolute inset-0 w-full h-full">
            <svg viewBox="0 0 100 10" preserveAspectRatio="none">
                <rect width="{progress}" height="10" fill="#4ade80" />
            </svg>
        </div>
    </div>
</div>
