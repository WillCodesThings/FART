<script lang="ts">
  import Grid, { GridItem, type LayoutChangeDetail } from 'svelte-grid-extended';
  import { writable } from 'svelte/store';
  import { EditIcon, SaveIcon } from 'svelte-feather-icons';
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

  let readOnly = false;
  let saveKey = 0; // This will be used to force re-rendering

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

  // Function to handle layout changes and update the layout store
  const onLayoutChange = (event: CustomEvent<LayoutChangeDetail>) => {
    layout.update(currentLayout => {
      return currentLayout.map(item =>
        item.id === event.detail.item.id ? { ...item, ...event.detail.item, props: { ...item.props, w: event.detail.item.w, h: event.detail.item.h } } : item
      );
    });

    console.log($layout);

    // Save the updated layout to local storage
    saveToLocalStorage('grid-layout', $layout);
  };

  let editMode = writable(false);

  async function toggleEditMode() {
    editMode.update(value => !value);
    readOnly = !readOnly;

    if (!readOnly) {
      saveKey++; // Increment the key to force re-rendering
    }

    await tick(); // Ensure DOM updates before continuing
  }

  function logItem(event: CustomEvent<LayoutChangeDetail>){
    console.log(event.detail.item);
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
  <div class="w-12 h-12 flex flex-col justify-center items-center bg-black rounded-xl m-2 border border-darkOrange cursor-pointer border-2 absolute z-20" on:click={toggleEditMode} >
    {#if $editMode}
      <SaveIcon class="w-8 h-8 text-white " />
    {:else}
      <EditIcon class="w-8 h-8 text-white" />
    {/if}
  </div>

  <!-- Grid Layout -->
  <div class="flex-grow p-2">
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
        >
          <div class="bg-gray-900 border border-gray-700 flex items-center justify-center h-full w-full text-white">
            <!-- Pass dimensions and other properties as props -->
            <svelte:component this={components[item.component]} {...item.props} />
          </div>
        </GridItem>
      {/each}
    </Grid>
  </div>
</div>

<style>
  :global(.grid-item) {
    position: absolute;
  }
</style>
