import { writable } from "svelte/store";

export const printers = writable([
    {
        cardHovered: false,
        name: "Dave",
        image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
        apiKey: "12344",
        printerID: 1,
    },
    {
        cardHovered: false,
        name: "George",
        image: "https://media.tenor.com/-DU5l9gh3iwAAAAC/george-pig-peppa-pig.gif",
        apiKey: "12343",
        printerID: 2,
    },
    {
        cardHovered: false,
        name: "Broken",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9p2r9Y2vJfjmjK077m1bb4Va_Y3bLumbwCQ&usqp=CAU",
        apiKey: "12348",
        printerID: 3,
    },
    {
        cardHovered: false,
        name: "Special",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmyJ96dCo6Nc2nkwTjtmeZp2DFVt3R-PSyng&usqp=CAU",
        apiKey: "12347",
        printerID: 4,
    },
    {
        cardHovered: false,
        name: "Wifi",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbIu8bG7mNZ2u6m8cZMU4F1O8519Ul3Z4xEg&usqp=CAU",
        apiKey: "12304",
        printerID: 5,
    },
    {
        cardHovered: false,
        name: "FART",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBl9iia9cb8G9IKjfD5BYFQfTsk0VxuSHpFw&usqp=CAU",
        apiKey: "12374",
        printerID: 6,
    },
]);

export function selectPrinter(apiKey: string) {
    printers.update((printers) => {
        printers.forEach((printer) => {
            printer.selected = printer.apiKey === apiKey;
        });
        return printers;
    });
}
