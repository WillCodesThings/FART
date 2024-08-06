<script>
    import Grid from "svelte-grid";
    import gridHelp from "svelte-grid/build/helper/index.mjs";

    import HumidityWidget from "./Widgets/HumidityWidget.svelte";
    import TemperatureWidget from "./Widgets/TemperatureWidget.svelte";
    import PrinterStatusWidget from "./Widgets/PrinterStatusWidget.svelte";
    import PrintProgressWidget from "./Widgets/PrintProgressWidget.svelte";
    import FilamentLevelWidget from "./Widgets/FilamentLevelWidget.svelte";

    const id = () => "_" + Math.random().toString(36).substr(2, 9);

    let items = [
        {
            6: gridHelp.item({
                x: 0,
                y: 0,
                w: 2,
                h: 1,
            }),
            id: id(),
            component: HumidityWidget,
            props: { humidity: 37.8, previousHumidity: 41.3, humidityHistory: [41.3, 39.5, 38.7, 37.8] }
        },
        {
            6: gridHelp.item({
                x: 2,
                y: 0,
                w: 2,
                h: 1,
            }),
            id: id(),
            component: TemperatureWidget,
            props: { temperature: 200, previousTemperature: 195, temperatureHistory: [190, 192, 198, 200] }
        },
        {
            6: gridHelp.item({
                x: 4,
                y: 0,
                w: 2,
                h: 1,
            }),
            id: id(),
            component: PrinterStatusWidget,
            props: { status: "Printing" }
        },
        {
            6: gridHelp.item({
                x: 0,
                y: 1,
                w: 2,
                h: 2,
            }),
            id: id(),
            component: PrintProgressWidget,
            props: { progress: 75 }
        },
        {
            6: gridHelp.item({
                x: 2,
                y: 1,
                w: 2,
                h: 1,
            }),
            id: id(),
            component: FilamentLevelWidget,
            props: { level: 50 }
        }
    ];

    const breakpoint = 1200;
    const column = 6;

    const cols = [[breakpoint, column]];
</script>

<Grid {cols} bind:items={items} let:item={item}>
    <svelte:component this={item.component} {...item.props} />
</Grid>

<style>
    .widget {
        background: #1f2937;
        border-radius: 8px;
        padding: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        height: 100%;
        width: 100%;
    }
</style>
