<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    // I forgot this entire page existed.
    // need to rewrite this page

    export let data;
    $: ({ printers } = data);

    // generated random letters then reveals the end name
    function randomLettersEffect(e) {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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

                    return letters[Math.floor(Math.random() * 26)];
                })
                .join("");

            if (iteration >= name.dataset.value.length) {
                clearInterval(interval);
            }

            iteration += 1 / 3;
        }, 30);
    }



    onMount(() => {
        console.log(printers);
        console.log("Hello from the page component!");
    });
</script>
