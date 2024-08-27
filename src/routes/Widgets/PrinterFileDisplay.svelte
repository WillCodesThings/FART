<script>

    let image;

    export let props = { 
        status: "Idle", 
        currentFile: "file1.gcode", // Add this property to indicate the currently printing file
        files: [
            { name: "file1.gcode", image: image, printTime: "32h 21m 12s" },
            { name: "file2.gcode", image: image, printTime: "32h 21m 12s" },
            { name: "file3.gcode", image: image, printTime: "32h 21m 12s" },
            { name: "file4.gcode", image: image, printTime: "32h 21m 12s" },
            { name: "file5.gcode", image: image, printTime: "32h 21m 12s" }
        ] 
    };

    console.log(props);

    let selectedFile = props.files[0]; // Initialize with the first file

    function handleFileSelect(file) {
        if (props.status === "Printing"){
            return;
        }
        selectedFile = file;
        console.log(`Selected file: ${selectedFile.name}`);
    }

    function handleFileSubmit() {
        console.log(`File submitted: ${selectedFile.name}`);
        // Implement the logic for what happens when a file is selected and submitted
    }
</script>

<div class="bg-black w-full h-full rounded-lg p-4 text-white flex flex-col">
    <h3 class="text-lg font-semibold mb-4">
        Select a File | {props.status}
    </h3>

    <div class="flex-grow overflow-y-auto">
        <table class="table-auto w-full text-left">
            <thead class="bg-gray-800 sticky top-0">
                <tr>
                    <th class="px-4 py-2">File Name</th>
                    <th class="px-4 py-2">Print Time</th>
                </tr>
            </thead>
            <tbody>
                {#each props.files as file}
                    <tr 
                        class="cursor-pointer hover:bg-gray-700 {selectedFile === file ? 'bg-gray-700' : ''} {props.currentFile === file.name && props.status === "Printing" ? 'bg-blue-600' : ''}" 
                        on:click={() => handleFileSelect(file)}
                    >
                        <td class="px-4 py-2 flex flex-row items-center">
                            <img src={file.image} alt="Image" class="w-12 h-12 mr-2 object-cover rounded"> 
                            {file.name}
                            {#if props.currentFile === file.name && props.status === "Printing"}
                                <span class="ml-2 text-xs text-green-400">( Printing )</span>
                            {/if}
                        </td>
                        <td class="px-4 py-2">{file.printTime}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>