import { writable } from "svelte/store";


/*

used to find the printers, just to store data

*/

export let printers = writable([
    {
    cardHovered: false,
    name: "Larry",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    apiKey: "8xjWDu9cUSVEXf7",
    printerID: 3,
    ipAddr: "192.168.50.103"
},
    {
    cardHovered: false,
    name: "Dave",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    apiKey: "eVc9qg9Pd8L5Biy",
    printerID: 1,
    ipAddr: "192.168.50.234"
},
    {
    cardHovered: false,
    name: "Mark",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    apiKey: "UZtsmAmQjU4EuwJ",
    printerID: 4,
    ipAddr: "192.168.50.206"
},
    {
    cardHovered: false,
    name: "Greg",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    apiKey: "iiEjCdV9rkC3oUh",
    printerID: 2,
    ipAddr: "192.168.50.186"
},]);