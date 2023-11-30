<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { printers } from ".././printers";

    var currentPrinter:
        | {
              cardHovered: boolean;
              name: string;
              image: string;
              apiKey: string;
              selected: boolean;
          }
        | undefined;
    //recieve printer data from the store
    var printerS = get(printers);

    currentPrinter = printerS.find(
        (printer: { selected: boolean }) => printer.selected === true
    );

    let percentage = 0;

    onMount(() => {
        console.log(printerS.forEach((printer) => printer.selected === true));
        console.log("Page mounted");
        console.log(currentPrinter);
        setInterval(() => {
            percentage++;
        }, 200);
    });
</script>

<section>
    <div class="w-full h-[100dvh] bg-slate-800">
        <!-- <div
            class="w-[35rem] h-full py-6 px-3 left-0 top-0 absolute bg-slate-700 shadow-xl rounded-r-lg shadow-slate-900 border-4 border-black"
            id="printerContainer"
        >
            <p
                class="text-4xl text-white font-bold w-full h-1/6 border-4 shadow-xl shadow-slate-900 p-1 border-black rounded-b-2xl text-center justify-center items-center flex rounded-t-xl"
            >
                {currentPrinter.name}
            </p>
            <div class="relative">
                <div
                    class="absolute overflow-hidden rounded-lg z-10"
                    style="height: {percentage}%;"
                >
                    <div class="">
                        <img
                            src={currentPrinter.image}
                            alt=""
                            class="w-full rounded-t-2xl h-3/4 rounded-b-xl border-slate-700 p-1 px-2 shadow-xl shadow-slate-900 grayscale-0"
                        />
                    </div>

                    <div class="items-center justify-center flex flex-col">
                        <p
                            class="z-10 text-black backdrop-blur-sm w-full h-full text-center font-bold text-2xl bottom-2 absolute justify-center items-center flex"
                        >
                            {percentage}% Complete
                        </p>
                    </div>
                </div>
                <img
                    src={currentPrinter.image}
                    alt=""
                    class="w-full h-3/4 rounded-t-2xl rounded-b-xl z-0 border-slate-700 border-4 p-1 shadow-xl shadow-slate-900 grayscale"
                />
            </div>
        </div> -->
    </div>
</section>
