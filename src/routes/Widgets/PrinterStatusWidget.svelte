<script>
    export let status = "Idle";
</script>

<div class="bg-black text-white rounded-lg shadow-md flex flex-col justify-center h-full w-full">
    <div class="p-2 flex items-center justify-between">
        <div class="text-lg font-semibold">Printer Status</div>
    </div>
    <div class="p-2 text-4xl font-bold">
        {status}
    </div>
</div>
