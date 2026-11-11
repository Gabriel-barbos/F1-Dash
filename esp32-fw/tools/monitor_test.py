import serial
import time

try:
    s = serial.Serial('COM4', 115200, timeout=1)
    print("Opened COM4 successfully. Reading lines for 5 seconds...")
    t0 = time.time()
    while time.time() - t0 < 5:
        line = s.readline().decode('utf-8', errors='ignore').strip()
        if line:
            print(f"[SERIAL] {line}")
    s.close()
except Exception as e:
    print(f"Error: {e}")
