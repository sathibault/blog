// This sample code demonstrates audio classification on the MRK1000
// using a convolutional neural network.  This code samples the audio,
// performs the FFT and sends the data to a server for prediction.

#include <SPI.h>
#include <WiFi101.h>
#include "FFT16.h"

char ssid[] = "";     // network SSID (name)
char pass[] = "";     // network password
int keyIndex = 0;     // network key Index number (needed only for WEP)

int status = WL_IDLE_STATUS;

WiFiClient client;

// server address:
#define SERVER "192.168.2.148"
#define PORTNO 9000

void printWifiStatus() {
  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your WiFi shield's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print the received signal strength:
  long rssi = WiFi.RSSI();
  Serial.print("signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
}

void connectToAP() {
  // check for the presence of the shield:
  if (WiFi.status() == WL_NO_SHIELD) {
    Serial.println("WiFi shield not present");
    // don't continue:
    while (true);
  }

  // attempt to connect to Wifi network:
  while ( status != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
    status = WiFi.begin(ssid, pass);
//    status = WiFi.begin(ssid);
    // wait 1 second for connection:
    delay(1000);
  }
}

unsigned int sqrt32(unsigned long n)
{
  unsigned int c = 0x8000;
  unsigned int g = 0x8000;
  for(;;) {
     if(g*g > n) {
          g ^= c;
     }  
     c >>= 1;
     if(c == 0) {
          return g;
     }
     g |= c;
   }
}

#define FFT_SIZE       128
#define log2FFT       7
#define N             (2 * FFT_SIZE)
#define log2N         (log2FFT + 1)

// SPI microphone interface
const int ssPin = 7;

SPISettings spiConfig(20000000, MSBFIRST, SPI_MODE2);

// LED pin numbers
int white = 2;
int yellow = 4;


void setup() {
  pinMode(ssPin, OUTPUT);
  pinMode(white, OUTPUT);
  pinMode(yellow, OUTPUT);
  Serial.begin(115200);
  SPI.begin();
  connectToAP();    // connect the board to the access point
  printWifiStatus();
}

int re[N];
int im[N];

void loop() {
  // Sample the audio

  SPI.beginTransaction(spiConfig);
  int t1 = micros();
  for (int i = 0 ; i < N ; i++) {
    digitalWrite(ssPin, LOW);
    re[i] = (SPI.transfer16(0) << 4) - 0x8000;
    im[i] = 0;
    digitalWrite(ssPin, HIGH);
  }
  int t2 = micros();
  SPI.endTransaction();

  // Perform the FFT
  fix_fft(re,im,log2N);
  int peak = 0;
  int peakbin = 0;
  for (int j = 0; j < FFT_SIZE ; j++) {
    int m = sqrt32(re[j] * re[j] + im[j] * im[j]);
    if (m > peak) {
      peak = m;
      peakbin = j;
    }
    re[j] = m;
  }

  Serial.print(peakbin);
  Serial.print(' ');
  Serial.print(peak);
  Serial.print(' ');
  Serial.print(t2-t1);
  Serial.println("");

  // Send data and use result to set LEDs
  char mode = postFFT();
  if (mode == '2') {
    analogWrite(white, 255);
    analogWrite(yellow,0);
  } else if (mode == '1') {
    analogWrite(white, 0);
    analogWrite(yellow,32);
  } else {
    analogWrite(white, 0);
    analogWrite(yellow,0);
  }'
}

char buf[1024];

// Read HTTP response

char listenToClient()
{
  unsigned long startTime = millis();
  bool received = false;
  char res;
  
  while ((millis() - startTime < 60000) && !received) {
    char prev = ' ';
    bool blank = false;
    while (client.available()) {
      char c = client.read();
      if (blank) {
        res = c;
        Serial.println(res);
      }
      blank = ((c=='\n'||c=='\r')&&prev=='\n') || (blank&&c=='\n');
      prev = c;
      received = true;
    }
  }
  client.stop();
  Serial.println("end");
  return res;
}

// Send HTTP request

char postFFT() {
  int pos=0;
 
  for (int j = 0; j < FFT_SIZE ; j++) {
    if (j > 0) buf[pos++] = ',';
    sprintf(buf + pos, " %d", re[j]);
    pos += strlen(buf+pos);
  }
  buf[pos] = 0;

  Serial.println("Connecting...");
  if (client.connect(SERVER, PORTNO)) {
    client.println("POST /fft HTTP/1.1");
    client.println("Host: " SERVER);
    client.println("Connection: close");
    client.println("User-Agent: MKR1000");
    client.println("Content-Type: text/plain");
    client.print("Content-Length: ");
    client.print(pos);
    client.print("\n\n");
    client.print(buf);
    Serial.println("sent");
    return listenToClient();
  }
  else {
    Serial.println("connection failed");
  }
  return '0';
}
