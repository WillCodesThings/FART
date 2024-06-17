<script>
    import { MonitorIcon, FolderIcon, BarChart2Icon } from "svelte-feather-icons";
    export let printer;

    let currentNav = {
        monitor: true,
        files: false,
        analytics: false,
    };

    function changeNav(toChange) {
        for (let key in currentNav) {
            currentNav[key] = false;
        }
        currentNav[toChange] = true;
    }

    let files = ["No files found"];

</script>
<div class="w-full h-full flex flex-col justify-center items-center text-center cursor-auto text-[#C2B8B2]">
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <ul class="absolute bg-[#3C362A] h-full p-4 left-0" id="navbar">

        <li class="my-6" on:click={() => changeNav('monitor')}>
            <MonitorIcon class="w-10 h-10 cursor-pointer {currentNav.monitor ? 'fill-[#C2B8B2]' : 'fill-none'}"  />
        </li>

        <li class="mb-6" on:click={() => {changeNav('files')}}>
            <FolderIcon class="w-10 h-10 cursor-pointer {currentNav.files ? 'fill-[#C2B8B2]' : 'fill-none'}"  />
        </li>
        
        <li on:click={() => changeNav('analytics')}>
            <BarChart2Icon class="w-10 h-10 cursor-pointer {currentNav.analytics ? 'fill-[#C2B8B2]' : 'fill-none'}"  />
        </li>
    </ul>
</div>
