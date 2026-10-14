from flask import Flask, request
import json

app = Flask(__name__)

# 🔴 عدل المسار حسب جهازك
FILE_PATH = r"C:\Users\WIN 11 PRO\AppData\Roaming\MetaQuotes\Terminal\YOUR_ID\MQL5\Files\signal.json"

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json

    print("📩 RECEIVED:", data)

    if not data:
        return "No data", 400

    signal = ""

    # 🧠 تحديد نوع الإشارة
    if "signal" in data:
        signal = data["signal"]

    if "action" in data:
        if data["action"] == "BUY":
            signal = "BUY"
        elif data["action"] == "SELL":
            signal = "SELL"

    if "type" in data:
        if data["type"] == "CLOSE_BUY":
            signal = "CLOSE_BUY"
        elif data["type"] == "CLOSE_SELL":
            signal = "CLOSE_SELL"

    # 🔥 تجهيز JSON
    final_data = {
        "symbol": data.get("symbol", "BTCUSD"),
        "signal": signal
    }

    # 💾 حفظ الملف
    with open(FILE_PATH, "w") as f:
        json.dump(final_data, f)

    print("🔥 FINAL:", final_data)

    return "OK", 200


if __name__ == "__main__":
    print("🚀 Server running on http://127.0.0.1:5000")
    app.run(port=5000)