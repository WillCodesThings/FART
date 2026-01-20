const DEFAULT_PRINTERS = [
  {
    id: 0,
    name: "Mock Printer",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    description: "Local mock printer for testing",
    apiKey: "test-api-key",
    ipAddr: "mock-printer:8888",
    model: "Mock Prusa MK-4",
    status: "Offline",
    specs: {}
  },
  {
    id: 1,
    name: "Dave",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    description: "Dave doesn't work",
    apiKey: "eVc9qg9Pd8L5Biy",
    ipAddr: "192.168.50.234",
    model: "Prusa MK-4",
    status: "Offline",
    specs: {}
  },
  {
    id: 2,
    name: "Greg",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    description: "Dave works pretty well",
    apiKey: "iiEjCdV9rkC3oUh",
    ipAddr: "192.168.50.186",
    model: "Prusa MK-4",
    status: "Offline",
    specs: {}
  },
  {
    id: 4,
    name: "Mark",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    description: "One of us is telling the truth",
    apiKey: "UZtsmAmQjU4EuwJ",
    ipAddr: "192.168.50.206",
    model: "Prusa MK-4",
    status: "Offline",
    specs: {}
  },
  {
    id: 3,
    name: "Larry",
    image: "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
    description: "One of us is lying",
    apiKey: "8xjWDu9cUSVEXf7",
    ipAddr: "192.168.50.106",
    model: "Prusa MK-4",
    status: "Offline",
    specs: {}
  }
];
let printers = [...DEFAULT_PRINTERS];
function getAllPrinters() {
  return printers;
}
function getPrinterById(id) {
  return printers.find((p) => p.id === id);
}
function addPrinter(printer) {
  const newPrinter = {
    ...printer,
    id: Date.now()
  };
  printers.push(newPrinter);
  return newPrinter;
}
function updatePrinter(id, updates) {
  const index = printers.findIndex((p) => p.id === id);
  const existing = printers[index];
  if (index !== -1 && existing) {
    const updated = { ...existing, ...updates };
    printers[index] = updated;
    return updated;
  }
  return null;
}
function deletePrinter(id) {
  const index = printers.findIndex((p) => p.id === id);
  if (index !== -1) {
    printers.splice(index, 1);
    return true;
  }
  return false;
}

export { addPrinter as a, getAllPrinters as b, deletePrinter as d, getPrinterById as g, updatePrinter as u };
//# sourceMappingURL=printerStore.mjs.map
