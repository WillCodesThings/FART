<script lang="ts">
    import { UploadCloudIcon } from 'svelte-feather-icons';

    export let props;

    let file;
    let fileInput;

    function sendFile() {
        if (fileInput.files.length > 0) {
            file = fileInput.files[0];
            // Implement the file upload logic here
            console.log("File selected:", file);
        }
    }
</script>

<div class="bg-black w-full h-full rounded-lg flex flex-col justify-center items-center">
    <div class="text-3xl text-white cursor-pointer z-10 w-full h-full items-center justify-center flex flex-col" on:click={() => fileInput.click()}>
        <UploadCloudIcon />
    </div>
</div>

<input type="file" name="" id="" class="hidden" bind:this={fileInput} on:change={sendFile}>
