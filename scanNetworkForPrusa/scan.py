import requests

apiKeys = ["eVc9qg9Pd8L5Biy"]


def findPrusa(ipStart, ipEnd):
    for i in range(ipStart, ipEnd):
        ip = "192.168.50." + str(i)
        url = "http://" + ip + "/printer/info"
        try:
            for i in apiKeys:
                r = requests.get(url, headers={"X-Api-Key": i}, timeout=0.5)
                if r.status_code == 200:
                    print()
                    print("Prusa found at " + ip)
                    print()
                    return
        except:
            print("on ip: " + ip + " no Prusa found")


findPrusa(1, 255)
input("Press Enter to continue...")
