<script lang="ts">
  import { CpuIcon, ArrowUpIcon } from 'svelte-feather-icons';
  import { onMount, tick } from 'svelte';

  export let props;

  console.log(props);

  let humanInput: string = "";
  let messages: { sender: string, text: string, images?: string[], render?: boolean }[] = [];
  let formattedMessages: { role: string, content: string, images: string[], context?: string }[] = [{
    role: "user", 
    content: "You are an AI assistant specializing in providing support for 3D printers. You are knowledgeable about different types of 3D printers, troubleshooting common issues like print quality, filament jams, bed leveling, and extruder problems. You can guide users step-by-step through fixing these issues and suggest preventive maintenance. The printers that I use are Prusa MK4s and Prusa MK3s.",
    images: []
  }];
  let aiTyping: boolean = false;
  let currentResponse: string = "";
  let images: string[] = [];
  let controller: AbortController;

  async function sendToAI() {
    let bodyContent = JSON.stringify({
      model: "llava",
      messages: formattedMessages
    });

    controller = new AbortController();
    const signal = controller.signal;

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: bodyContent,
        signal
      });

      if (!response.ok) {
        console.error('Error:', response.statusText);
        aiTyping = false;
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      let decoder = new TextDecoder();
      currentResponse = "";
      aiTyping = true;
      formattedMessages = [...formattedMessages, { role: 'assistant', content: '', images: [] }];
      messages = [...messages, { sender: 'AI', text: '', images: [] }];

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          aiTyping = false;
          break;
        }

        const chunk = JSON.parse(decoder.decode(value, { stream: true }));
        currentResponse += chunk.message.content;

        formattedMessages[formattedMessages.length - 1].content = currentResponse;
        messages[messages.length - 1].text = currentResponse;

        await tick(); // Ensure DOM updates
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error('Fetch error:', error);
      }
      aiTyping = false;
    }
  }

  function handleSendMessage() {
    if (humanInput.trim() && !aiTyping) {
      messages = [...messages, { sender: 'Human', text: humanInput, images, render: true }];
      formattedMessages = [...formattedMessages, { role: 'user', content: humanInput, images }];
      humanInput = "";
      images = [];
      sendToAI();
    }
  }

  function handlePaste(clipboardData: DataTransfer) {
    const text = clipboardData.getData('text');
    if (text) {
      humanInput += text;
    }
    const items = clipboardData.items;

    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.readAsDataURL(blob);

            reader.onloadend = () => {
              const base64data = reader.result;
              if (base64data) {
                images = [...images, base64data.toString().split(",")[1]];
              }
            };
          }
        }
      }
    }
  }

  function removeImage(index: number) {
    images = images.filter((_, i) => i !== index);
  }

  onMount(() => {
    // Optionally, you can handle printer events here
  });
</script>

<div class="bg-black w-full h-full rounded-lg flex flex-col p-4">
  <div class="text-white font-bold flex flex-row w-full mb-4">
    AI
    <div class="ml-auto text-white"><CpuIcon /></div>
  </div>

  <div class="bg-dark-300 w-full flex-grow p-4 overflow-y-auto rounded" id="chatContainer">
    {#each messages as item, index}
      {#if item.render !== false} <!-- Render only if render is true or undefined -->
        <div class={item.sender === 'Human' ? "bg-dark-200 text-white p-2 rounded mb-2 max-w-xs self-end" : "bg-[#2a66c6] text-white p-2 rounded mb-2 max-w-xs self-start"}>
          {#if item.images && item.images.length > 0}
            <div class="flex flex-wrap mb-2">
              {#each item.images as image}
                <img src={"data:image/png;base64," + image} alt="image" class="w-14 h-14 rounded-md mr-2 mb-2" />
              {/each}
            </div>
          {/if}
          <div>{item.text}</div>
        </div>
      {/if}
    {/each}
  </div>

  <div class="mt-4 flex flex-col">
    {#if images.length > 0}
      <div class="flex flex-wrap mb-2">
        {#each images as image, index}
          <div class="relative">
            <img src={"data:image/png;base64," + image} alt="image" class="w-14 h-14 rounded-md mr-2 mb-2" />
            <button class="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center" on:click={() => removeImage(index)}>×</button>
          </div>
        {/each}
      </div>
    {/if}
    <div class="flex">
      <input
        type="text"
        bind:value={humanInput}
        on:keydown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
        placeholder="Type your message..."
        class="bg-dark-200 text-black p-2 rounded flex-grow"
        on:paste={(e) => handlePaste(e.clipboardData)}
        disabled={aiTyping}
      />
      <button on:click={handleSendMessage} class="bg-orange-500 text-white p-2 rounded ml-2"><ArrowUpIcon /></button>
    </div>
  </div>
</div>

<style>
  #chatContainer {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
</style>
