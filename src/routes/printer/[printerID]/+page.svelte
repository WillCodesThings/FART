<!-- ... (Your imports) -->

<script lang="ts">
    // ... (Your existing code)

    import { onMount } from "svelte";
    import img from "$lib/images/dave.jpg";

    let hovered: boolean = false;

    let printer: {
        cardHovered: boolean;
        name: string;
        image: string;
        apiKey: String;
        printerID: number;
        ipAddr: String;
    } = {
        cardHovered: false,
        name: "Dave",
        image: img,
        apiKey: "1234",
        printerID: 1,
        ipAddr: "192.168.7.30",
    };

    let percentage = 5;

    onMount(() => {
        // document.getElementById("page").addEventListener("mousemove", (e) => {
        //     const interactable = e.target.closest("#button"),
        //         interacting = interactable !== null;

        //     interactable

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
        //         duration: 500,
        //         fill: "forwards",
        //     });
        // });

        fetch("/api/2", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                printer: printer,
                url: "/job",
                query: { method: "POST", command: "pause" },
            }),
        });

        setInterval(() => {
            percentage += 1;
            if (percentage > 100) {
                percentage = 0;
            }
            console.log(document.getElementById("button"));
        }, 1000);
    });
</script>

<!-- Add Tailwind CSS classes to the appropriate elements -->
<section id="page">
    <!-- <div
        class="fixed w-5 h-5 rounded-full z-50 bg-white cursor-none"
        id="mouse"
    ></div> -->
    <div class="col-span-1 relative w-full h-[100vh] bg-[#141414]">
        <div
            class="grid grid-cols-2 grid-rows-1 gap-3 p-5 w-full h-full place-items-stretch"
        >
            <div
                class="w-2/3 h-full overflow-hidden flex flex-col items-center left-3 relative py-2"
            >
                <div
                    class="w-full h-full overflow-hidden py-2 mb-4 rounded-t-lg rounded-b-md relative"
                >
                    <img
                        class="rounded-t-lg rounded-b-md object-cover object-center z-10 absolute top-0 left-0 selection-none"
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
                    DAVE
                </div>
            </div>
            <div
                class="w-full h-full overflow-hidden flex flex-col items-center relative left-1 py-2"
            >
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    class="w-4/5 h-2/4 bg-[#252525] rounded-t-xl rounded-b-lg flex flex-col items-center justify-center"
                    on:mouseenter={() => (hovered = true)}
                    on:mouseleave={() => (hovered = false)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-10 w-10 uploadIcon mb-2 border-2 p-2 rounded-full border-[#FFF5EF] transition-all duration-300 ease-in-out select-none {hovered
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

                    <!-- <form
                        id="button"
                        enctype="multipart/form-data"
                        action="/upload/"
                        method="post"
                    >
                        <input id="image-file" type="file" />
                    </form> -->

                    <div
                        class="text-4xl font-mono font-bold text-[#FFF5EF] transition-all duration-300 ease-in-out select-none {hovered
                            ? '-rotate-2 -translate-y-3'
                            : ''}"
                    >
                        UPLOAD
                    </div>
                </div>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    class=" w-2/3 h-1/3 mt-6 mr-32 place-self-auto bg-[#252525] flex flex-col justify-center items-center rounded-t-lg rounded-b-xl p-2"
                    id="printerControls"
                >
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div
                        class="transition-all duration-300 ease-in-out select-none cursor-pointer bg-[#006442] rounded-lg w-auto p-2"
                        id="playPause"
                        on:click={() => {
                            console.log("play/pause");
                            fetch;
                        }}
                    >
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
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    /* Add Tailwind CSS styles for gradient and blur */
    .gradient {
        background: repeating-linear-gradient(
            20deg,
            #252525,
            #252525 5px,
            #141414 5px,
            #141414 10px
        );

        opacity: 0.98; /* Adjust the opacity as needed */
    }

    /* Your existing styles */
    .uploadIcon {
        color: #fff5ef;
    }

    .playIcon {
        color: #8db255;
    }
</style>
