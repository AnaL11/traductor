let model;
const video = document.getElementById('video');
const output = document.getElementById('output');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Iniciar cámara
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    alert("Error al acceder a la cámara.");
  }
}

// Cargar modelo
async function loadModel() {
  model = await tf.loadGraphModel('model/model.json');
  console.log("✅ Modelo cargado.");
}

async function captureAndPredict() {
  // Captura imagen de cámara
  ctx.drawImage(video, 0, 0, 224, 224);
  const img = tf.browser.fromPixels(canvas).resizeNearestNeighbor([224, 224]).toFloat().div(255).expandDims(0);

  // Predicción
  const prediction = await model.predict(img).data();
  const letter = getLetterFromPrediction(prediction);

  output.innerText = Letra detectada: ${letter};
  speak(letter);
}

// Mapea clases a letras (ajusta según tu entrenamiento)
function getLetterFromPrediction(pred) {
  const letras = "AÁBCDEÉFGHIÍJKLMNÑOÓPQRSTUÚVWXYZ";
  const index = pred.indexOf(Math.max(...pred));
  return letras[index] || "?";
}

// Voz en español latinoamericano
function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-MX';
  const voices = speechSynthesis.getVoices();
  const latino = voices.find(v => v.lang.includes('es') && v.name.toLowerCase().includes('mexico'));
  if (latino) u.voice = latino;
  speechSynthesis.speak(u);
}

startCamera();
loadModel();
