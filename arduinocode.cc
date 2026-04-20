#define BLYNK_TEMPLATE_ID "TMPL3xXX3awCy"
#define BLYNK_TEMPLATE_NAME "WiFi Analyzer"

#include <WiFi.h>
#include <HTTPClient.h>
#include <BlynkSimpleEsp32.h>

 
char auth[] = "IRReD0T3OECvhfZlm7OJ26F2QidHy3oI";

const char* ssid = "IOTP";
const char* password = "12345678";

const char* serverUrl = "http://10.154.228.144:3000/data";


void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n Connected");
  Serial.print(" IP: ");
  Serial.println(WiFi.localIP());
}


String getEncryptionType(wifi_auth_mode_t type) {
  switch (type) {
    case WIFI_AUTH_OPEN: return "OPEN";
    case WIFI_AUTH_WPA2_PSK: return "WPA2";
    case WIFI_AUTH_WPA3_PSK: return "WPA3";
    case WIFI_AUTH_WPA_WPA2_PSK: return "WPA/WPA2";
    default: return "OTHER";
  }
}


void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);

  connectWiFi();

  Blynk.begin(auth, ssid, password);
}


void loop() {

  Blynk.run();

  // reconnect WiFi if needed
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(" Reconnecting WiFi...");
    connectWiFi();
  }

  int n = WiFi.scanNetworks();

  Serial.println("\n📡 Scanning WiFi...");
  Serial.print("Total Signals Found: ");
  Serial.println(n);

  String json = "[";

  int openCount = 0;
  String bestSSID = "None";
  int bestRSSI = -100;

  // store unique SSIDs
  String uniqueSSIDs[50];
  int uniqueCount = 0;

  for (int i = 0; i < n; i++) {

    String ssidName = WiFi.SSID(i);
    int rssi = WiFi.RSSI(i);
    int channel = WiFi.channel(i);
    String enc = getEncryptionType(WiFi.encryptionType(i));

    
    Serial.print("SSID: ");
    Serial.print(ssidName);
    Serial.print(" | RSSI: ");
    Serial.print(rssi);
    Serial.print(" | CH: ");
    Serial.print(channel);
    Serial.print(" | ENC: ");
    Serial.println(enc);

 
    if (rssi > bestRSSI) {
      bestRSSI = rssi;
      bestSSID = ssidName;
    }

   
    bool exists = false;
    for (int j = 0; j < uniqueCount; j++) {
      if (uniqueSSIDs[j] == ssidName) {
        exists = true;
        break;
      }
    }

    if (!exists && ssidName != "") {
      uniqueSSIDs[uniqueCount++] = ssidName;

      if (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) {
        openCount++;
      }
    }

    // -------- JSON for Backend --------
    json += "{";
    json += "\"ssid\":\"" + ssidName + "\",";
    json += "\"rssi\":" + String(rssi) + ",";
    json += "\"channel\":" + String(channel) + ",";
    json += "\"encryption\":\"" + enc + "\"";
    json += "}";

    if (i < n - 1) json += ",";
  }

  json += "]";

  // -------- Send to Backend --------
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST(json);

  Serial.print("Server Response: ");
  Serial.println(code);

  http.end();

  // -------- Send to Blynk --------
  Blynk.virtualWrite(V0, bestSSID);     
  Blynk.virtualWrite(V1, bestRSSI);      
  Blynk.virtualWrite(V2, uniqueCount);  
  Blynk.virtualWrite(V3, openCount);     

  Serial.println(" Data sent to Blynk");
  Serial.println("---------------------------");

  delay(5000);
}