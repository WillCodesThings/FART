<script lang="ts">
    import { onMount, tick } from "svelte";
    import { get } from "svelte/store";

    import img from "$lib/images/bgImg.png";

    import Dashboard from "./Dashboard.svelte";
    import Layout from "./+layout.svelte";

    export let data;

    let { printers } = data;

    $: expandedCard = (printers) ? printers.filter(printer => printer.select) : [];
    $: console.log(expandedCard);

    onMount(() => {
        console.log(printers);
        console.log("Hello from the page component!");
    });

    function handleCardClick(printerID) {
        expandedCard = expandedCard === printerID ? null : printerID;
    }

    function toggleSelect(Toggleprinter: any): void {
        printers = printers.map(printer =>
            printer === Toggleprinter ? { ...printer, select: !printer.select } : printer
        );
        tick();
    }
</script>

<section class="bg-[#121212]">
    <div class="bg-transparent w-full h-[200dvh] md:h-[100dvh] z-10" id="printerContainer">
        <div class="flex flex-col md:grid md:grid-cols-5 md:grid-rows-2 w-full h-full p-5 gap-2 items-center z-10 opacity-100">
            {#if expandedCard.length > 0}
                <Dashboard printer={expandedCard[0]} />
            {:else}
                {#if printers}
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    {#each printers as printer}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div 
                            class="w-full max-w-sm bg-[#1f1f1f] shadow-lg rounded-lg overflow-hidden m-4 cursor-pointer z-10"
                            on:click={() => toggleSelect(printer)}
                        >
                            <div class="bg-[#282828] flex justify-center items-center h-48">
                                <img
                                    class="w-full h-full object-cover"
                                    src={printer.image}
                                    alt={printer.name}
                                />
                            </div>
                            <div class="p-4 bg-[#1b1b1b]">
                                <h2 class="text-xl font-bold text-white">{printer.name}</h2>
                                <p class="mt-2 text-gray-400">{printer.desc}</p>
                                <div class="flex items-center justify-between mt-4">
                                    <span class="text-gray-400 text-sm">Model: {printer.model}</span>
                                    <span class="text-orange-500 text-sm">Status: {printer.status}</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                {/if}
            {/if}
        </div>
    </div>
    <img
        class="absolute top-0 w-full h-full object-fill opacity-5 select-none cursor-default z-0"
        src={img}
        alt=""
    />
</section>

<style>
    .printerImage {
        aspect-ratio: 9 / 16;
    }

    @keyframes scrollUp {
        0% {
            transform: translateY(0);
        }
        100% {
            transform: translateY(-300%);
        }
    }

    .animate-scrollUp {
        animation: scrollUp 0.45s ease-in-out forwards;
    }

    .expanded {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #1f1f1f;
        z-index: 20;
        border-radius: 0;
        padding: 2rem;
    }
</style>
