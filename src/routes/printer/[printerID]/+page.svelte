<script lang="ts">
    /*

        For giga brain people only.
        Made by Will

    */
    import Chart from "$lib/components/Chart.svelte";
    import { onMount } from "svelte";
    import { Line } from 'svelte-chartjs';

    import {
      Chart as ChartJS,
      Title,
      Tooltip,
      Legend,
      LineElement,
      LinearScale,
      PointElement,
      CategoryScale,
    } from 'chart.js';
  
    ChartJS.register(
      Title,
      Tooltip,
      Legend,
      LineElement,
      LinearScale,
      PointElement,
      CategoryScale
    );

    export let data;
    $: ({ res  } = data);

    console.log(res);

    let status: String = "idle";

    let activity: String = "idle";

    let hovered: boolean = false;

    let uploading: boolean = false;

    let img: string = "https://i.imgur.com/2ZJZQ4w.png";

    let files = ["No files found"];

    console.log(files);

    let authorizationCode: string = "";

    let printerOperation: String;

    let printer: {
        cardHovered: boolean;
        name: string;
        image: string;
        apiKey: String;
        printerID: number;
        ipAddr: String;
    } = {
        cardHovered: false,
        name: "",
        image: "",
        apiKey: "",
        printerID: 0,
        ipAddr: "",
    };

    let graphData = {
    labels: ['0s', '-30s', '-60s', '-90s', '-120s', '-150s', '-180s'],
        datasets: [{
            label: "Nozzle Temp",
            fill: true,
            lineTension: 0.3,
            backgroundColor: 'rgba(225, 204,230, .3)',
            borderColor: 'rgb(205, 130, 158)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgb(205, 130,1 58)',
            pointBackgroundColor: 'rgb(255, 255, 255)',
            pointBorderWidth: 5,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: 'rgb(0, 0, 0)',
            pointHoverBorderColor: 'rgba(220, 220, 220,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: [10, 100],
        },{
            label: "Bed Temp",
            fill: true,
            lineTension: 0.3,
            backgroundColor: 'rgba(225, 204,230, .3)',
            borderColor: 'rgb(205, 130, 158)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgb(205, 130,1 58)',
            pointBackgroundColor: 'rgb(255, 255, 255)',
            pointBorderWidth: 5,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: 'rgb(0, 0, 0)',
            pointHoverBorderColor: 'rgba(220, 220, 220,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: [10, 100],
        }]
};

    let percentage = 0;

    function openUploadDialouge() {
        if (uploading) {
            return;
        }
        let fileObject = document.getElementById("fileUpload");
        fileObject.click();
    }

    /*

        Using Fetch to send a file to a printer via /api/[printerID]

        This is how the file will be sent to the printer, as a binary file (which what FormData is).

    */

    function sendFile(file: File) {
        if ((file.name.includes(".gcode") || file.name.includes(".gco") || file.name.includes(".gcode")) === false) {
            return alert("File must be a .gcode file");
        }
        uploading = true;
        const fd = new FormData();
        fd.append(file.name, file);
        const res = fetch(`/api/${printer.printerID}`, {
            method: "POST",
            body: fd,
        });

        // if (res.printerOperation === 200 || res.printerOperation === 201) {
        //     uploading = false;
        //     console.log("File uploaded");
        // } else {
        //     uploading = false;
        //     console.log("File upload failed");
        // }
    }

    onMount(() => {

        const graph = document.getElementById("graph")?.firstChild;

        document.addEventListener('keydown', function(event) {
            // Log the key code and key value to the console
            console.log('Key Code:', event.keyCode);
            console.log('Key Value:', event.key);

            authorizationCode += event.key;

            if (authorizationCode === "2324") {
                playPause(authorizationCode);
            } else if (authorizationCode.length > 4) {
                authorizationCode = "";
            }

            // You can do more with the captured keyboard input here
        });

        // Should be the current state of the printer
        // structured similarly to this :
        // {"Printing", jobs: [{jobName: "test.gcode", progress: 0.5}]}

        console.log(res);

        printerOperation = res.data;
        status = res.data.state;
        printer = res.printer;
        files = res.files;

        img = getPrintingImage();

        // /*
        // Debugging code, uncomment to see stuff

        console.log(res.printer);
        console.log(res.data);
        console.log(res.data.state);
        console.log(res.files);
        console.log("Page mounted");
        
        setInterval(async () => {
            try {
                let res = await fetch(`/api/${printer.printerID}`);
                let data = await res.json();
                files = data.files;
                console.log(data.printer);

                getPrintingImage();

                img = getPrintingImage();

                // more debug
                console.log(data.data);
                if (data.data.progress === null) {
                    activity = "idle";
                    return;
                }
                console.log(data.data.progress.completion * 100);

                printer = data.printer;
                percentage = data.data.progress.completion * 100;
            } catch (error) {
                console.error("Error fetching or parsing JSON:", error);
            }
        }, 10000);

        /*

            This is the code for the mouse cursor that follows the user around the page.
            It's a bit buggy, so I've commented it out for now.

        */

        // document.getElementById("page").addEventListener("mousemove", (e) => {
        //     const interactable = e.target.closest("#button"),
        //         interacting = interactable !== null;

        //     document.getElementById("mouse")?.addEventListener("click", () => {
        //         interactable.click();
        //     });

        //     const mouse = document.getElementById("mouse");
        //     const x = e.pageX - mouse.offsetWidth / 2,
        //         y = e.pageY - mouse.offsetHeight / 2;
        //     // scale(${
        //     //     interacting ? 7 : 1
        //     // })
        //     const keyframes = {
        //         transform: `translate(${x}px,${y}px) scale(${
        //             interacting ? 7 : 1
        //         })`,
        //     };

        //     mouse.animate(keyframes, {
        //         duration: 700,
        //         fill: "forwards",
        //     });
        // });
    });

    /*

        This is to pause/play the printer
        Sent as a post request to /api/[printerID]
        can be found in the alternate folder in routes.

        Sent to +server.ts

    */

    function playPause(authorizationCode: string) {
        if (printerOperation === "pause") {
            printerOperation = "resume";
        } else {
            printerOperation = "pause";
        }

        if (authorizationCode === "2324") {
            printerOperation = "cancel";
        }

        if (activity !== "Printing"){
            printerOperation = "start";
        }

        const res = fetch(`/api/${printer.printerID}`, {
            method: "POST",
            body: JSON.stringify({
                query: {
                    printer: printer,
                    command: printerOperation,
                },
            }),
        });
        console.log(res);
    }


    function runFile(fileName: string) {
        fetch(`/api/${printer.printerID}`, {
            method: "POST",
            body: JSON.stringify({
                query: {
                    method: "post",
                    printer: printer,
                    command: "run",
                    fileName: fileName,
                },
            }),
        });
    }


    function getPrintingImage(): string {
        // return "";

        const res = fetch(`http://${printer.ipAddr}/thumb/l/${res.data.job.file.path.split("/")[2]}}}`, {headers: {
            'X-Api-Key': printer.apiKey,
        }});

        console.log(res);

        return "";
    }
</script>

<!-- Add Tailwind CSS classes to the appropriate elements -->
<section id="page">
    <!-- <div
        class="fixed w-5 h-5 rounded-full z-50 bg-white cursor-none"
        id="mouse"
    ></div> -->
    <div class="col-span-1 relative w-full h-[100vh] bg-[#141414]">
        <div
            class="grid grid-cols-2 grid-rows-1 gap-3 p-5 w-full h-full place-items-stretch items-center"
        >
            <div
                class="w-2/3 h-full overflow-hidden flex flex-col items-center left-3 relative py-2"
            >
                <div
                    class="w-full h-full overflow-hidden py-2 mb-4 rounded-t-lg rounded-b-md relative"
                >
                    <img
                        class="rounded-t-lg w-full h-full rounded-b-md object-cover object-center z-10 absolute top-0 left-0 selection-none imageAspect"
                        src={printer.image}
                        alt="its a printer, chill out."
                    />
                    <div
                        class="absolute top-0 left-0 z-20 w-full"
                        style={`height: ${percentage}%`}
                    >
                        <div
                            class="w-full h-full gradient flex flex-col justify-center text-center text-[#FFF5EF] text-5xl font-bold font-mono select-none"
                        >
                            {percentage < 5 ? "" : percentage + "%"}
                        </div>
                    </div>
                </div>

                <div
                    class="text-[#FFF5EF] z-10 text-8xl font-mono w-full text-center border-2 border-[#2c2c2c] rounded-b-lg rounded-t-md select-none"
                >
                    {printer.name}
                </div>
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
                class="w-full h-full overflow-hidden flex flex-col items-center justify-center relative left-1 py-2"
            >
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <input
                    type="file"
                    id="fileUpload"
                    class="hidden"
                    on:change={(e) => {
                        // debug code.
                        console.log(e.target.files[0]);
                        sendFile(e.target.files[0]);
                    }}
                />
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div
                    class="w-4/5 h-2/4 bg-[#252525] rounded-t-xl rounded-b-lg flex flex-col items-center justify-center transition-all duration-300 ease-in-out select-none"
                    on:mouseenter={() => (hovered = true)}
                    on:mouseleave={() => (hovered = false)}
                    on:click={() => {
                        if (status !== "Printing"){
                            openUploadDialouge();
                        }
                        
                    }}
                    id="button"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-10 w-10 uploadIcon mb-2 border-2 p-2 rounded-full border-[#FFF5EF] transition-all duration-300 ease-in-out select-none {status === 'Printing' ? 'hidden' : 'visible'} {uploading
                            ? 'hidden'
                            : 'visible'} {hovered
                            ? 'rotate-12 -translate-y-3'
                            : ''}"
                        fill="currentColor"
                        height="32"
                        width="32"
                        viewBox="0 0 384 512"
                        ><path
                            d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"
                        /></svg
                    >
                    <div
                        class="text-4xl font-mono font-bold text-[#FFF5EF] transition-all duration-300 ease-in-out select-none {status === 'Printing' ? 'hidden' : 'visible'} {hovered
                            ? 'rotate-6 -translate-y-3'
                            : ''} {uploading
                            ? 'hidden'
                            : 'visible'} "
                    >
                        UPLOAD
                    </div>

                    <div
                        class="{uploading
                            ? 'visible'
                            : 'hidden'} flex flex-col items-center justify-center text-4xl font-mono font-bold text-[#FFF5EF] transition-all duration-300 ease-in-out select-none {status === 'Printing' ? 'hidden' : 'visible'}"
                        id="spinning circle"
                    >
                        <svg
                            class="animate-spin h-10 w-10 text-[#FFF5EF] mb-2 p-2 border-2 rounded-full border-[#FFF5EF] transition-all duration-300 ease-in-out select-none {status === 'Printing' ? 'hidden' : 'visible'} {uploading
                                ? 'visible'
                                : 'hidden'} "
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            height="24"
                            width="24"
                            viewBox="0 0 512 512"
                            ><path
                                d="M222.7 32.1c5 16.9-4.6 34.8-21.5 39.8C121.8 95.6 64 169.1 64 256c0 106 86 192 192 192s192-86 192-192c0-86.9-57.8-160.4-137.1-184.1c-16.9-5-26.6-22.9-21.5-39.8s22.9-26.6 39.8-21.5C434.9 42.1 512 140 512 256c0 141.4-114.6 256-256 256S0 397.4 0 256C0 140 77.1 42.1 182.9 10.6c16.9-5 34.8 4.6 39.8 21.5z"
                            /></svg
                        >
                        UPLOADING
                    </div>
                    <img class="aspect-video w-full h-full {status === 'Printing' ? 'visible' : 'hidden' }" src="{img}" alt="">
                </div>

                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    class=" w-4/5 h-3/6 bg-[#252525]  mt-2 mr-[5.9rem] place-self-end rounded-t-lg rounded-b-xl p-4 gap-2"
                    id="printerControls"
                >
                    <div class="grid grid-rows-1 grid-cols-2">
                        <div
                        class="transition-all duration-300 ease-in-out select-none cursor-pointer text-lg text-[#FFF5EF] font-bold w-full h-12 relative bg-[#006442] rounded-lg  p-2"
                        id="playPause"
                        on:click={() => {
                            // guess what this is.
                            // console.log("play/pause");
                            playPause("a");
                        }}
                        >
                        <div class="flex flex-row items-stretch" id="play">
                            <svg
                                class="playIcon"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                height="32"
                                width="32"
                                viewBox="0 0 384 512"
                                ><path
                                    d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"
                                /></svg
                            >
                            <div class="px-4">Start Print</div>
                        </div>
                        </div>
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div
                            class="transition-all duration-300 ease-in-out select-none cursor-pointer text-lg text-[#FFF5EF] font-bold w-full relative h-12 bg-[#FF7847] rounded-lg max-w-md p-2"
                            id="playPause"
                            on:click={() => {
                                // guess what this is.
                                // console.log("play/pause");
                                playPause("a");
                            }}
                        >
                        <div class="flex flex-row items-stretch" id="play">
                            <svg
                                class="pauseIcon"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                height="32"
                                width="32"
                                viewBox="0 0 384 512"
                                ><path
                                    d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"
                                /></svg
                            >
                            <div class="px-4">Pause Print</div>
                        </div>
                    </div>
                </div>
                <div class="border-2 border-[#FFF5EF] text-[#FFF5EF] h-12 w-full p-2 font-semibold mt-4 flex flex-row rounded-lg" id="dropdown"
                    on:mouseleave={() => (document.getElementById("dropdown-items").classList.remove("visible"))}
                    on:click={() => {
                        document.getElementById("dropdown-items").classList.toggle("visible");
                    document.getElementById("dropdown-items").classList.toggle("hidden")}}
                >
                    Select a file
                    <div 
                    class="ml-auto mr-4 mt-2" 
                    ><svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class= "uploadIcon"  height="16" width="12" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.--><path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/></svg></div>
                </div>
                <div class="hidden border-2 border-[#FFF5EF] text-[#FFF5EF] text-lg font-semibold px-2 rounded-sm select-none" id="dropdown-items">
                    <!-- {each printer.files as afile} -->

                    {#each files as afile}
                        <div class="w-full rounded-sm"
                            on:click={() => {
                                runFile(afile.name.toString());
                            }}
                            on:mouseenter={() => {
                                document.getElementById(afile.name).classList.add("bg-[#948e8a]");
                                document.getElementById(afile.name).classList.remove("opacity-75");
                            }}
                            on:mouseleave={() => {
                                document.getElementById(afile.name).classList.remove("bg-[#948e8a]");
                                document.getElementById(afile.name).classList.add("opacity-75");
                            }}
                            id={afile.name}
                        >
                            {afile.name}
                        </div>
                    {/each}
                </div>
                <div class="z-20 w-full h-4/6" id="graph">
                    <Line {graphData} options={{ responsive: true }} />
                </div>
                
            </div>
        </div>
    </div>
</section>

<style>
    /* Add styles for gradient and blur */
    /* not native to tailwind, so I've added it here. */
    /* for the lines over the printer image */
    .gradient {
        background: repeating-linear-gradient(
            20deg,
            #252525,
            #252525 5px,
            #141414 5px,
            #141414 10px
        );

        opacity: 0.98; /* magic number dont touch */
    }

    /* to color the icons  */
    .uploadIcon {
        color: #fff5ef;
    }

    .playIcon {
        color: #8db255;
    }

    .pauseIcon {
        color: #ffb157;
    }

    .imageAspect {
        aspect-ratio: 9 / 16;
    }
</style>
