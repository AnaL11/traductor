let model;
let stream;
let streamStarted = false;

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const capturedImage = document.getElementById('capturedImage');
const ctx = canvas.getContext('2d');

const startBtn = document.getElementById('startBtn');
const captureBtn = document.getElementById('captureBtn');
const resetBtn = document.getElementById('resetBtn');
const letterCountInput = document.getElementById('letterCount');
const output = document.getElementById('output');
const instructions = document.getElementById('instructions');

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
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } },
      audio: false
    });
    video.srcObject = stream;
    video.style.display = 'block';
    canvas.style.display = 'none';
    capturedImage.style.display = 'none';
    streamStarted = true;
    captureBtn.disabled = false;
    resetBtn.disabled = true;

    instructions.innerText = "Coloca el pop-it en el centro y presiona Capturar palabra.";
    speak("Coloca el pop-it en el centro y presiona Capturar palabra.");
  } catch (err) {
    alert("No se pudo acceder a la cámara trasera.");
    console.error(err);
  }
}

function stopCamera() {
  if (stream && stream.getTracks) {
    stream.getTracks().forEach(track => track.stop());
  }
  streamStarted = false;
}

async function predictWordFromImage(numLetters) {
  if (!streamStarted) {
    speak("Primero debes activar la cámara.");
    return;
  }

  // Captura la imagen actual del video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Detener cámara
  stopCamera();
  video.style.display = 'none';
  canvas.style.display = 'none';

  // Mostrar imagen capturada
  const dataURL = canvas.toDataURL();
  capturedImage.src = dataURL;
  capturedImage.style.display = 'block';

  // Procesar segmentos
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
      output.innerText = "Letra no reconocida. Intenta de nuevo.";
      speak("Letra no reconocida. Intenta de nuevo.");
      return;
    }

    let letter = getLetterFromIndex(index);
    word.push(letter);
  }

  const finalWord = word.join('');
  output.innerText = `Palabra detectada: ${finalWord}`;
  speak(`La palabra es ${finalWord}`);
  resetBtn.disabled = false;
  captureBtn.disabled = true;
}

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

resetBtn.addEventListener('click', () => {
  startBtn.disabled = false;
  captureBtn.disabled = true;
  resetBtn.disabled = true;
  capturedImage.style.display = 'none';
  output.innerText = "Esperando...";
  instructions.innerText = "Presiona Activar cámara trasera para comenzar.";
  speak("Puedes tomar otra foto. Presiona Activar cámara trasera para empezar.");
});

// Cargar modelo al inicio
async function loadModel() {
  try {
    model = await tf.loadGraphModel('model/model.json');
    console.log("✅ Modelo cargado.");
  } catch (err) {
    console.error("❌ Error al cargar el modelo:", err);
  }
}
loadModel();
