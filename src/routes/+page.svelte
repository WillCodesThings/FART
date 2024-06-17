<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { printers } from "./printer";
    import img from "$lib/images/bgImg.png";

    import Dashboard from "./Dashboard.svelte";

    const Cprinters = get(printers);

    let cards = {
        printer1: false,
        printer2: false,
        printer3: false,
        printer4: false,
        printer5: false,
        printer6: false,
        printer7: false,
        printer8: false,
        printer9: false,
        printer10: false,
    };

    let expandedCard = null;

    const cprinter = Cprinters[0];

    onMount(() => {
        console.log(Cprinters[0]);
        console.log("Hello from the page component!");
    });

    expandedCard = cprinter.printerID;

    function handleCardClick(printerID) {
        expandedCard = expandedCard === printerID ? null : printerID;
    }
</script>

<section class="bg-[#31581E]">
    <div class="bg-transparent w-full h-[200dvh] md:h-[100dvh]" id="printerContainer">
        <div class="flex flex-col md:grid md:grid-cols-5 md:grid-rows-2 w-full h-full p-5 items-center z-10 opacity-100">
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            {#each Cprinters as printer}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div
                    class="{(expandedCard === printer.printerID) ? "cursor-none" : "cursor-pointer"} w-[96%] h-[30rem] md:w-[80%] md:h-full flex flex-col bg-[#294A18] shadow-md items-center rounded-lg p-2 z-10 opacity-100 cursor-pointer transition-all duration-500 transform {expandedCard === printer.printerID ? 'expanded' : ''}"
                    id="printer{printer.printerID}"
                    on:mouseenter={() => cards["printer" + printer.printerID] = true}
                    on:mouseleave={() => cards["printer" + printer.printerID] = false}
                    on:click={() => {if (!(expandedCard === printer.printerID)) {handleCardClick(printer.printerID)}}}
                >
                    {#if expandedCard === printer.printerID}
                        <!-- Dashboard content -->
                        <Dashboard printer={printer} />
                    {:else}
                        <!-- Card content -->
                        <div class="w-full h-[80%] overflow-hidden py-2 z-10" id="printerImage">
                            <img
                                class="w-full h-full printerImage rounded-lg shadow-md opacity-100 z-10 ease-in-out duration-200 {cards['printer' + printer.printerID] ? 'border-0 p-0 shadow-2xl' : 'border-4 p-2'}"
                                src={printer.image}
                                alt={printer.name}
                            />
                        </div>

                        <div
                            class="flex flex-col justify-center w-5/6 h-1/6 rounded-xl text-4xl font-bold text-[#FFF5EF] text-center z-10 overflow-hidden"
                            id={"name" + cprinter.printerID}
                            data-value={cprinter.name}
                        >
                            <ul class="list-none p-2 m-0 h-10 transition-transform duration-300 {cards['printer' + cprinter.printerID] ? 'animate-scrollUp' : ''}">
                                <li>{cprinter.name}</li>
                                {#each cprinter.name.split("") as letter}
                                    <li class="mt-4">{cprinter.name}</li>
                                {/each}
                            </ul>
                        </div>
                        <div class="text-lg text-[#FFF5EF] font-semibold py-2 z-10">
                            Status: IDLE
                        </div>
                    {/if}
                </div>
            {/each}
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
        background-color: #294A18;
        z-index: 20;
        border-radius: 0;
        padding: 2rem;
    }
</style>
