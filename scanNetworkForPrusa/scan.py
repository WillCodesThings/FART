import requests
import threading
import time

startTime = time.time()  # Start timer

apiToCard = ["{\n    cardHovered: false,\n    name: \"Dave\",\n    image: \"https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp\",\n    apiKey: \"eVc9qg9Pd8L5Biy\",\n    printerID: 1,\n    ipAddr: ", "{\n    cardHovered: false,\n    name: \"Greg\",\n    image: \"https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp\",\n    apiKey: \"iiEjCdV9rkC3oUh\",\n    printerID: 2,\n    ipAddr: ", "{\n    cardHovered: false,\n    name: \"Larry\",\n    image: \"https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp\",\n    apiKey: \"8xjWDu9cUSVEXf7\",\n    printerID: 3,\n    ipAddr: ","{\n    cardHovered: false,\n    name: \"Mark\",\n    image: \"https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp\",\n    apiKey: \"UZtsmAmQjU4EuwJ\",\n    printerID: 4,\n    ipAddr: ",]
apiKeys = ["eVc9qg9Pd8L5Biy", "iiEjCdV9rkC3oUh", "8xjWDu9cUSVEXf7", "UZtsmAmQjU4EuwJ"]
lock = threading.Lock()  # Lock to prevent race conditions
headers = [{"X-Api-Key": i} for i in apiKeys]

stringToWrite = "import { writable } from \"svelte/store\";\n\n\n/*\n\nused to find the printers, just to store data\n\n*/\n\nexport let printers = writable(["

def find_prusa(ip):
    global stringToWrite  # Declare stringToWrite as a global variable
    url = "http://192.168.50." + str(ip) + "/printer/info"
    try:
        for key in headers:
            r = requests.get(f'http://192.168.50.{ip}/api/job', headers=key)
            if r.status_code == 200:
                with lock:
                    print("\nPrusa found at 192.168.50." + str(ip) + "\n with key " + key.get("X-Api-Key") + "\n")
                    stringToWrite = stringToWrite + "\n    " + apiToCard[apiKeys.index(key.get("X-Api-Key"))] + "\"192.168.50." + str(ip) + "\"\n},"
                return
    except requests.RequestException:
        return

def find_prusa_range(start, end):
    threads = []
    for ip in range(start, end):
        thread = threading.Thread(target=find_prusa, args=(ip,))
        threads.append(thread)
        thread.start()

    for thread in threads:
        thread.join()

find_prusa_range(0, 256)  # Pass IP range as parameters
print(stringToWrite)
stringToWrite = stringToWrite + "]);"
with open("C:\\Users\\IDEA Center\\Documents\\Github\\FART\\src\\routes\\printer.ts", "w") as file:
    file.write(stringToWrite)
endTime = time.time()  # End timer
print("")
print("\n\nRan in : " + str(endTime - startTime) + "s")
print("")
input("Press Enter to continue...")
