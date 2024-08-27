import { writable } from "svelte/store";


/*

used to find the printers, just to store data

*/

export let printers = [
    {
    select: false,
    name: "Dave",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    desc: "Dave doesn't work",
    apiKey: "eVc9qg9Pd8L5Biy",
    id: 1,
    ipAddr: "192.168.50.234",
    model:"Prusa MK-4",
    status: "Offline",
    specs: {}
},
    {
    select: false,
    name: "Greg",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    desc: "Dave works pretty well",
    apiKey: "iiEjCdV9rkC3oUh",
    id: 2,
    ipAddr: "192.168.50.186",
    model:"Prusa MK-4",
    status: "Offline",
    specs: {}
},
    {
    select: false,
    name: "Mark",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    desc: "One of us is telling the truth",
    apiKey: "UZtsmAmQjU4EuwJ",
    id: 4,
    ipAddr: "192.168.50.206",
    model:"Prusa MK-4",
    status: "Offline",
    specs: {}
},
    {
    select: false,
    name: "Larry",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    desc: "One of us is lying",
    apiKey: "8xjWDu9cUSVEXf7",
    id: 3,
    ipAddr: "192.168.50.106",
    model:"Prusa MK-4",
    status: "Offline",
    specs: {}
},];