<script lang="ts">
  import Grid, { GridItem, type LayoutChangeDetail } from 'svelte-grid-extended';
  import { writable } from 'svelte/store';
  import { EditIcon, SaveIcon, Trash2Icon } from 'svelte-feather-icons';
  import FilamentLevel from './Widgets/FilamentLevelWidget.svelte';
  import HumidityLevel from './Widgets/HumidityWidget.svelte';
  import PrintProgress from './Widgets/PrintProgressWidget.svelte';
  import TemperatureLevel from './Widgets/TemperatureWidget.svelte';
  import ChatAi from './Widgets/ChatAiWidget.svelte';
  import Upload from './Widgets/uploadWidget.svelte';
  import PrintHead from './Widgets/PrinterHeadWidget.svelte';
  import TimeRemaining from './Widgets/TimeRemainingWidget.svelte';
  import { tick } from 'svelte';
  import FileDisplay from './Widgets/PrinterFileDisplay.svelte';
  import PrinterInfo from './Widgets/PrinterInfoWidget.svelte';

  export let printerData;

  console.log(printerData);

  let readOnly = false;
  let saveKey = 0; // This will be used to force re-rendering
  let deleteMode = writable(false); // Track if delete mode is active

  function getFromLocalStorage(key, defaultValue) {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    }
    return defaultValue;
  }

  function saveToLocalStorage(key, value) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  const initialLayout = getFromLocalStorage('grid-layout', [
    { id: 'a', x: 14, y: 0, w: 1, h: 12, component: 'FilamentLevel' },
    { id: 'b', x: 5, y: 6, w: 3, h: 3, component: 'HumidityLevel' },
    { id: 'c', x: 5, y: 0, w: 3, h: 3, component: 'PrintProgress' },
    { id: 'd', x: 5, y: 3, w: 3, h: 3, component: 'TemperatureLevel' },
    { id: 'e', x: 8, y: 7, w: 6, h: 5, component: 'ChatAi' },
    { id: 'f', x: 8, y: 0, w: 6, h: 3, component: 'Upload' },
    { id: 'g', x: 0, y: 7, w: 5, h: 5, component: 'PrinterHead' },
    { id: 'h', x: 5, y: 9, w: 3, h: 3, component: 'TimeRemaining' },
    { id: 'i', x: 8, y: 3, w: 6, h: 4, component: 'FileDisplay' },
    { id: 'j', x: 0, y: 0, w: 5, h: 7, component: 'PrinterInfo' }
  ]);

  let layout = writable(initialLayout);
  let availableWidgets = writable([
    { id: 'a', component: 'FilamentLevel' },
    { id: 'b', component: 'HumidityLevel' },
    { id: 'c', component: 'PrintProgress' },
    { id: 'd', component: 'TemperatureLevel' },
    { id: 'e', component: 'ChatAi' },
    { id: 'f', component: 'Upload' },
    { id: 'g', component: 'PrinterHead' },
    { id: 'h', component: 'TimeRemaining' },
    { id: 'i', component: 'FileDisplay' },
    { id: 'j', component: 'PrinterInfo' }
    // Add more widgets as needed
  ]);

  // Function to handle layout changes and update the layout store
  const onLayoutChange = (event: CustomEvent<LayoutChangeDetail>) => {
    layout.update(currentLayout => {
      return currentLayout.map(item =>
        item.id === event.detail.item.id ? { ...item, ...event.detail.item, props: { ...item.props, w: event.detail.item.w, h: event.detail.item.h } } : item
      );
    });

    // Save the updated layout to local storage
    saveToLocalStorage('grid-layout', $layout);
  };

  function logItem(event: CustomEvent<LayoutChangeDetail>){
    console.log(event);
    if($deleteMode){removeWidget(event.detail.item.id);}
  }

  let editMode = writable(false);

  async function toggleEditMode() {
    editMode.update(value => !value);
    readOnly = !readOnly;

    if (!readOnly) {
      saveKey++; // Increment the key to force re-rendering
    }

    await tick(); // Ensure DOM updates before continuing
  }

  function removeWidget(id) {
    layout.update(currentLayout => {
      const newLayout = currentLayout.filter(item => item.id !== id);
      console.log("Updated Layout: ", newLayout); // Log updated layout
      saveToLocalStorage('grid-layout', newLayout);
      return newLayout;
    });
    saveKey++; // Increment saveKey to force re-render
    deleteMode.set(false); // Turn off delete mode after deletion
  }

  function addWidget(widget) {
    layout.update(currentLayout => [
      ...currentLayout,
      {
        id: `${widget.id}-${Date.now()}`, // Ensure unique ID
        x: 0,
        y: 0,
        w: 3,
        h: 3,
        component: widget.component
      }
    ]);
    saveKey++; // Increment saveKey to force re-render
  }

  function toggleDeleteMode() {
    deleteMode.update((value) => !value);
  }

  const components = {
    'FilamentLevel': FilamentLevel,
    'HumidityLevel': HumidityLevel,
    'PrintProgress': PrintProgress,
    'TemperatureLevel': TemperatureLevel,
    'ChatAi': ChatAi,
    'Upload': Upload,
    'PrinterHead': PrintHead,
    'TimeRemaining': TimeRemaining,
    'FileDisplay': FileDisplay,
    'PrinterInfo': PrinterInfo
  };
</script>

<div class="h-screen w-screen flex">
  <!-- Sidebar -->
  <div class="w-12 h-12 flex flex-col justify-center items-center bg-black rounded-xl m-2 border border-darkOrange border-2 absolute z-20" on:click={toggleEditMode} >
    {#if $editMode}
      <SaveIcon class="w-8 h-8 text-orange-400 fill-white" />
    {:else}
      <EditIcon class="w-8 h-8 text-orange-400 fill-white" />
    {/if}
  </div>

  <!-- Trash button -->
  {#if $editMode}
  <div class="w-12 h-12 flex flex-col justify-center items-center bg-red-600 rounded-xl m-2 border border-darkOrange border-2 absolute z-20 top-16 right-2 cursor-pointer  {$deleteMode ? "animate-shake" : ""} " on:click={toggleDeleteMode}>
    <Trash2Icon class="w-8 h-8 text-white" />
  </div>
  {/if}

  {#if $editMode}
    <!-- Widgets that can be added -->
    <div class="fixed top-28 left-2 bg-gray-800 p-2 rounded-lg z-30">
      <div class="text-white mb-2">Available Widgets</div>
      {#each $availableWidgets as widget}
        <div class="p-2 bg-gray-700 rounded mb-2 text-white cursor-pointer" on:click={() => addWidget(widget)}>
          {widget.component}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Grid Layout -->
  <div class="flex-grow p-2 relative">
    {#key saveKey}
      <Grid cols={15} rows={12} on:change={onLayoutChange} {saveKey}>
        {#each $layout as item (item.id)}
          <GridItem
            key={item.id + '-' + saveKey}
            id={item.id}
            x={item.x}
            y={item.y}
            w={item.w}
            h={item.h}
            class="grid-item"
            movable={$editMode}
            resizable={$editMode}
            on:change={logItem}
            on:click={deleteMode ? () => removeWidget(item.id) : undefined}
          >
            <div class="relative bg-gray-900 border border-gray-700 flex items-center justify-center h-full w-full text-white">
              <!-- Pass dimensions and other properties as props -->
              <svelte:component this={components[item.component]} props={printerData} />
            </div>
          </GridItem>
        {/each}
      </Grid>
    {/key}
  </div>
</div>

<style>
  :global(.grid-item) {
    position: absolute;
  }

  button {
    cursor: pointer;
  }

  .animate-shake {
    animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both infinite;
  }

  @keyframes shake {
    10%, 90% {
      transform: translate3d(-1px, 0, 0);
    }

    20%, 80% {
      transform: translate3d(2px, 0, 0);
    }

    30%, 50%, 70% {
      transform: translate3d(-4px, 0, 0);
    }

    40%, 60% {
      transform: translate3d(4px, 0, 0);
    }
  }
</style>