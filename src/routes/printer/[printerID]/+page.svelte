<script lang="ts">
    /*

        For giga brain people only.
        Made by Will

    */
    import Chart from "$lib/components/Chart.svelte";
    import { onMount } from "svelte";

    export let data;
    $: ({ res } = data);

    console.log(res);

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
        if (
            (file.name.includes(".gcode") ||
                file.name.includes(".gco") ||
                file.name.includes(".gcode")) === false
        ) {
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
        document.addEventListener("keydown", function (event) {
            // Log the key code and key value to the console
            console.log("Key Code:", event.keyCode);
            console.log("Key Value:", event.key);

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

        printerOperation = res.data;
        status = res.data.state;
        printer = res.printer;
        files = res.files;

        img = `data:image/png;base64,${getPrintingImage()}`;

        // /*
        // Debugging code, uncomment to see stuff

        console.log(res.printer);
        console.log(res.data);
        console.log(res.data.state);
        console.log(res.files);
        console.log("Page mounted");
        
        // setInterval(async () => {
        //     try {
        //         let res = await fetch(`/api/${printer.printerID}`);
        //         let data = await res.json();
        //         files = data.files;
        //         console.log(data.printer);

        //         img = `data:image/png;base64,${getPrintingImage()}`;

        //         // more debug
        //         console.log(data.data);
        //         if (data.data.progress === null) {
        //             activity = "idle";
        //             return;
        //         }
        //         console.log(data.data.progress.completion * 100);

        //         printer = data.printer;
        //         percentage = data.data.progress.completion * 100;
        //     } catch (error) {
        //         console.error("Error fetching or parsing JSON:", error);
        //     }
        // }, 10000);

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
        if (res.data.job === null) {
            return "Not Printing Yet";
        }
        fetch(
            `http://${printer.ipAddr}/thumb/l/${
                res.data.job.file.path.split("/")[2]
            }}}`,
            {
                headers: {
                    "X-Api-Key": printer.apiKey.toString(),
                },
            },
        )
            .then((res) => res.blob())
            .then((blob) => {
                const reader: FileReader = new FileReader();
                reader.readAsDataURL(blob);
                // onloadend => onload
                reader.onloadend = function () {
                    const base64data = reader.result;
                    console.log(base64data);
                    return base64data;
                };
            });

        return "Fetch Failed";
    }
</script>

<section id="page">
    <!-- un-used mouse trailer -->

    <!-- <div
        class="fixed w-5 h-5 rounded-full z-50 bg-white cursor-none"
        id="mouse"
    ></div> -->

    <div class="" id="basePage"></div>
    
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
