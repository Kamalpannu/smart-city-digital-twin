import requests

url = "http://127.0.0.1:8000/scenario"  # change if your server runs elsewhere

data = {
    "zone": "A",
    "pollution": 0.65,
    "closure_event": True
}

response = requests.post(url, json=data)

if response.status_code == 200:
    result = response.json()
    print("Predicted traffic:", result["predicted_traffic"])
    print("Reroute suggested:", result["reroute_suggested"])
    print("Analysis:", result["analysis"])
else:
    print(f"Error: {response.status_code} - {response.text}")
