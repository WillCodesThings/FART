<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { printers } from "./printer";
    import img from "$lib/images/bgImg.png";

    // I forgot this entire page existed.
    // need to rewrite this page

    // Collectionprinters
    const Cprinters = get(printers);

    console.log(printers);

    // generated random letters then reveals the end name
    function randomLettersEffect(e: any) {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        let interval: number | undefined;
        let iteration = 0;

        const name = e;

        clearInterval(interval);

        interval = setInterval(() => {
            name.innerText = name.innerText
                .split("")
                .map((letter: any, index: number) => {
                    if (index < iteration) {
                        return name.dataset.value[index];
                    }

                    return letters[Math.floor(Math.random() * 52)];
                })
                .join("");

            if (iteration >= name.dataset.value.length) {
                clearInterval(interval);
            }

            iteration += 1 / 3;
        }, 30);
    }

    // current printer
    const cprinter = Cprinters[0];

    onMount(() => {
        console.log(Cprinters[0]);
        console.log("Hello from the page component!");
    });
</script>

<section>
    <div
        class="bg-[#007683] w-full h-[200dvh] md:h-[100dvh]"
        id="printerContainer"
    >
        <img
            class="absolute w-full h-full object-fill opacity-5 z-0"
            src={img}
            alt=""
        />
        <div
            class="flex flex-col md:grid md:grid-cols-5 md:grid-rows-2 w-full h-full p-5 items-center z-10 opacity-100"
        >
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
                class="w-[96%] h-[30rem] md:w-[80%] md:h-full flex flex-col bg-[#25ABB8] shadow-md items-center rounded-lg p-2 "
                id="printer{cprinter.printerID}"
                on:mouseenter={() =>
                    randomLettersEffect(document.getElementById("name" + cprinter.printerID))}
            >
                <div
                    class="w-full h-[80%] overflow-hidden py-2"
                    id="printerImage"
                >
                    <img
                        class="w-full h-full printerImage rounded-lg shadow-md border-4 border-[#FFB157]"
                        src={cprinter.image}
                        alt={cprinter.name}
                    />
                </div>

                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    class="flex flex-col justify-center w-5/6 h-1/6 rounded-xl text-4xl font-bold text-[#FFF5EF] text-center"
                    id="name{cprinter.printerID}"
                    data-value={cprinter.name}
                >
                    {cprinter.name}
                </div>
                <div class="text-lg text-[#FFF5EF] font-semibold py-2">
                    Status: IDLE
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    .printerImage {
        aspect-ratio: 9 / 16;
    }
</style>
