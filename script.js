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
const output = document.getElementById('output');
const instructions = document.getElementById('instructions');

// 🗣 Voz en español latino
function speak(texto) {
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "es-419";
  speechSynthesis.speak(utterance);
}

// 🔤 Mapeo de clases a letras
function getLetterFromIndex(index) {
  const letras = "AÁBCDEÉFGHIÍJKLMNÑOÓPQRSTUÚVWXYZ";
  return letras[index] || "?";
}

// 📷 Activar cámara trasera
async function startCamera() {
  try {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    video.srcObject = stream;
    video.style.display = 'block';
    canvas.style.display = 'none';
    capturedImage.style.display = 'none';
    streamStarted = true;

    captureBtn.disabled = false;
    resetBtn.disabled = true;

    instructions.innerText = "Coloca el pop-it en el centro y presiona Capturar.";
    speak("Coloca el pop-it en el centro y presiona capturar.");
  } catch (err) {
    alert("No se pudo activar la cámara.");
    console.error(err);
  }
}

// ✋ Detener cámara
function stopCamera() {
  if (stream && stream.getTracks) {
    stream.getTracks().forEach(track => track.stop());
  }
  streamStarted = false;
}

// 📦 Cargar modelo TensorFlow
async function loadModel() {
  try {
    model = await tf.loadGraphModel('model/model.json');
    console.log("✅ Modelo cargado.");
  } catch (err) {
    console.error("❌ Error al cargar el modelo:", err);
  }
}

// 🔍 Predecir una sola letra centrada
async function predictLetter() {
  if (!streamStarted) {
    speak("Primero debes activar la cámara.");
    return;
  }

  // Captura la imagen del video al canvas
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  stopCamera();
  video.style.display = 'none';

  // Mostrar imagen capturada
  const dataURL = canvas.toDataURL();
  capturedImage.src = dataURL;
  capturedImage.style.display = 'block';

  // Recorte centrado
  const side = Math.min(canvas.width, canvas.height) * 0.6;
  const x = (canvas.width - side) / 2;
  const y = (canvas.height - side) / 2;

  const imageData = ctx.getImageData(x, y, side, side);

  const imgTensor = tf.browser.fromPixels(imageData)
    .resizeNearestNeighbor([224, 224])
    .toFloat()
    .div(255.0)
    .expandDims(0);

  const prediction = await model.predict(imgTensor);
  const probs = prediction.dataSync();
  const index = prediction.argMax(-1).dataSync()[0];

  if (probs[index] < 0.5) {
    output.innerText = "No se detectó un pop-it válido.";
    speak("No se detectó un pop-it válido. Intenta de nuevo.");
  } else {
    const letra = getLetterFromIndex(index);
    output.innerText = `Letra detectada: ${letra}`;
    speak(`La letra es ${letra}`);
  }

  resetBtn.disabled = false;
  captureBtn.disabled = true;
}

// 🎛 Botones
startBtn.addEventListener('click', () => {
  startCamera();
  startBtn.disabled = true;
});

captureBtn.addEventListener('click', () => {
  predictLetter();
});

resetBtn.addEventListener('click', async () => {
  capturedImage.style.display = 'none';
  output.innerText = "Esperando...";
  instructions.innerText = "Reiniciando cámara...";
  speak("Puedes capturar otra letra.");

  await startCamera();

  captureBtn.disabled = false;
  resetBtn.disabled = true;
  startBtn.disabled = true;
});

// 🔁 Cargar modelo al iniciar
loadModel();
