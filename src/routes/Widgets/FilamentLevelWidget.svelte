<script>
    export let level = 100;
</script>

<div class="bg-black text-white rounded-lg shadow-md flex flex-col justify-between h-full w-full">
    <div class="p-2 flex items-center justify-between">
        <div class="text-lg font-semibold">Filament Level</div>
    </div>
    <div class="p-2 text-4xl font-bold">
        {level}%
    </div>
    <div class="relative flex-grow p-2">
        <div class="absolute inset-0 w-full h-full">
            <svg viewBox="0 0 100 10" preserveAspectRatio="none">
                <rect width="{level}" height="10" fill="#3b82f6" />
            </svg>
        </div>
    </div>
</div>
