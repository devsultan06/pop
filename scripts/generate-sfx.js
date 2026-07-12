const fs = require('fs');
const path = require('path');
const http = require('https');

// Simple parser for .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let apiKey = process.env.ELEVENLABS_API_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/ELEVENLABS_API_KEY\s*=\s*([^\n#]*)/);
  if (match && match[1]) {
    apiKey = match[1].trim().replace(/['"]/g, '');
  }
}

if (!apiKey || apiKey.startsWith('your_')) {
  console.error("Error: ELEVENLABS_API_KEY not found in env or .env.local");
  console.log("Please add your ElevenLabs API Key to .env.local to generate real high-quality sounds.");
  process.exit(1);
}

const sounds = [
  {
    filename: 'tap.mp3',
    prompt: 'soft organic paper tap, subtle UI key click, low frequency and quiet',
    duration: 0.5
  },
  {
    filename: 'success.mp3',
    prompt: 'gentle acoustic chime, warm organic confirm sound, positive feedback',
    duration: 1.2
  }
];

const publicSoundsDir = path.join(__dirname, '..', 'public', 'sounds');
if (!fs.existsSync(publicSoundsDir)) {
  fs.mkdirSync(publicSoundsDir, { recursive: true });
}

async function generateSound(sound) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text: sound.prompt,
      duration_seconds: sound.duration,
      prompt_influence: 0.3
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      port: 443,
      path: '/v1/sound-generation',
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`Generating sound: ${sound.filename} with prompt: "${sound.prompt}"...`);

    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errData = '';
        res.on('data', chunk => errData += chunk);
        res.on('end', () => reject(new Error(`ElevenLabs API error (${res.statusCode}): ${errData}`)));
        return;
      }

      const filePath = path.join(publicSoundsDir, sound.filename);
      const writeStream = fs.createWriteStream(filePath);
      res.pipe(writeStream);

      writeStream.on('finish', () => {
        console.log(`Successfully saved: ${filePath}`);
        resolve();
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    for (const sound of sounds) {
      await generateSound(sound);
    }
    console.log("\nAll ElevenLabs sound effects generated successfully!");
  } catch (error) {
    console.error("\nFailed to generate sound effects:", error.message);
  }
}

main();
