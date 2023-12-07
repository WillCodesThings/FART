import { writable } from "svelte/store";
import img from "../lib/images/dave.png";
export const printers = writable([
    {
        cardHovered: false,
        name: "Dave",
        image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
        apiKey: "12344",
        printerID: 1,
        ipAddr: "http://192.168.50.200"
    },
    {
        cardHovered: false,
        name: "George",
        image: "../../../lib/images/dave.png",
        apiKey: 'eVc9qg9Pd8L5Biy',
        printerID: 2,
        ipAddr: "http://192.168.50.235"
    },
    {
        cardHovered: false,
        name: "Broken",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9p2r9Y2vJfjmjK077m1bb4Va_Y3bLumbwCQ&usqp=CAU",
        apiKey: "12348",
        printerID: 3,
        ipAddr: "http://192.168.50.200"
    },
    {
        cardHovered: false,
        name: "Special",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmyJ96dCo6Nc2nkwTjtmeZp2DFVt3R-PSyng&usqp=CAU",
        apiKey: "12347",
        printerID: 4,
        ipAddr: "http://192.168.50.200"
    },
    {
        cardHovered: false,
        name: "Wifi",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbIu8bG7mNZ2u6m8cZMU4F1O8519Ul3Z4xEg&usqp=CAU",
        apiKey: "12304",
        printerID: 5,
        ipAddr: "http://192.168.50.200"
    },
    {
        cardHovered: false,
        name: "FART",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBl9iia9cb8G9IKjfD5BYFQfTsk0VxuSHpFw&usqp=CAU",
        apiKey: "12374",
        printerID: 6,
        ipAddr: "http://192.168.50.200"
    },
]);
