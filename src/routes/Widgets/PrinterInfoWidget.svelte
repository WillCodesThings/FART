<script>

    export let props;

    // export let image = "https://m.media-amazon.com/images/I/61L4aoIqYOL._AC_UF894,1000_QL80_.jpg";
    export let printer = {
        name: "Greg",
        image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
        ipAddr: "192.168.50.186",
        model: "Prusa MK-4",
        specs: {}
    };
    export let w; // Width passed from props
    export let h; // Height passed from props

    console.log(w);
    console.log(h);
    console.log(props);

    // Determine if the image should be displayed based on the height
    let showImage = h > 3;
</script>

<div class="bg-darkGray w-full h-full rounded-lg flex flex-col p-6 justify-center items-center">
    <div class="p-4 bg-black w-full h-full rounded-lg shadow-lg flex flex-col items-center">
        {#if showImage}
            <img src={printer.image} alt="Printer Image" class="rounded-lg mb-4 w-full object-cover h-5/6">
        {/if}
        <div class="text-white text-5xl font-bold flex flex-row">{printer.name}</div>
        <div class="text-gray-400 text-lg">{printer.model} | IP: {printer.ipAddr}</div>
    </div>
</div>

<style>
    .text-gray-400 {
        color: #b0b0b0;
    }
</style>
