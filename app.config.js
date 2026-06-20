const fs = require('fs');
const path = require('path');

let mapsKey = process.env.MAPS_SDK_ANDROID;

if (!mapsKey) {
  try {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^MAPS_SDK_ANDROID\s*=\s*(.+)$/m);
      if (match) {
        mapsKey = match[1].trim();
      }
    }
  } catch (e) {
    console.log("Error reading .env.local manually:", e);
  }
}

module.exports = {
  expo: {
    ...require('./app.json').expo,
    android: {
      ...require('./app.json').expo.android,
      config: {
        googleMaps: {
          apiKey: mapsKey || "",
        },
      },
    },
    plugins: [
      ...(require('./app.json').expo.plugins || []),
      [
        "react-native-maps",
        {
          "androidGoogleMapsApiKey": mapsKey || ""
        }
      ],
      "expo-secure-store",
      "@clerk/expo",
    ],
  },
};
