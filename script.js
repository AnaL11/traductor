let model;
let streamStarted = false;

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const instructions = document.getElementById('instructions');
const startBtn = document.getElementById('startBtn');
const captureBtn = document.getElementById('captureBtn');
const letterCountInput = document.getElementById('letterCount');

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-MX";
  speechSynthesis.speak(utterance);
}

function getLetterFromIndex(index) {
  const letras = "AÁBCDEÉFGHIÍJKLMNÑOÓPQRSTUÚVWXYZ";
  return letras[index] || "?";
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.style.display = 'block';
    streamStarted = true;
    captureBtn.disabled = false;
    instructions.innerText = "Coloca la palabra usando pop-its y presiona 'Capturar palabra'.";
    speak("Coloca la palabra usando pop-its y presiona capturar palabra.");
  } catch (err) {
    alert("Error al acceder a la cámara.");
    console.error("❌ Error al iniciar la cámara:", err);
  }
}

async function loadModel() {
  try {
    model = await tf.loadGraphModel('model/model.json');
    console.log("✅ Modelo cargado.");
  } catch (err) {
    console.error("❌ Error al cargar el modelo:", err);
  }
}

async function predictWordFromImage(numLetters) {
  if (!streamStarted) {
    speak("Primero debes activar la cámara.");
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const segmentWidth = Math.floor(canvas.width / numLetters);
  let word = [];

  for (let i = 0; i < numLetters; i++) {
    let imageData = ctx.getImageData(i * segmentWidth, 0, segmentWidth, canvas.height);
    let imgTensor = tf.browser.fromPixels(imageData)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      .div(255.0)
      .expandDims(0);

    let prediction = await model.predict(imgTensor);
    let probs = prediction.dataSync();
    let index = prediction.argMax(-1).dataSync()[0];

    if (probs[index] < 0.6) {
      output.innerText = "No se detectó un patrón claro en alguna letra.";
      speak("No se detectó un patrón claro en alguna letra. Intenta de nuevo.");
      return;
    }

    let letter = getLetterFromIndex(index);
    if (letter === "?") {
      output.innerText = "Letra no reconocida en alguna posición.";
      speak("Letra no reconocida en alguna posición. Intenta de nuevo.");
      return;
    }

    word.push(letter);
  }

  const finalWord = word.join('');
  output.innerText = `Palabra detectada: ${finalWord}`;
  speak(`La palabra es ${finalWord}`);
}

// Eventos de botones
startBtn.addEventListener('click', () => {
  startCamera();
  startBtn.disabled = true;
});

captureBtn.addEventListener('click', () => {
  const numLetters = parseInt(letterCountInput.value, 10);
  if (isNaN(numLetters) || numLetters < 1) {
    speak("Por favor, indica un número válido de letras.");
    return;
  }
  predictWordFromImage(numLetters);
});

// Carga modelo al inicio
loadModel();
