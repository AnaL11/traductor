let model;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    console.log("Cámara iniciada");
  } catch (err) {
    alert("Error al acceder a la cámara.");
    console.error("Error al iniciar la cámara:", err);
  }
}

async function loadModel() {
  try {
    model = await tf.loadGraphModel('model/model.json');
    console.log("Modelo cargado.");
  } catch (err) {
    console.error("Error al cargar el modelo:", err);
  }
}

async function captureAndPredict() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  let img = tf.browser.fromPixels(canvas)
    .resizeNearestNeighbor([224, 224])
    .toFloat()
    .div(255.0)
    .expandDims(0);

  let prediction = await model.predict(img);
  let index = prediction.argMax(-1).dataSync()[0];

  let letter = getLetterFromIndex(index);

  if (letter === "?") {
    output.innerText = "No se detectó un patrón válido.";
    speak("Lo que estás mostrando no parece un pop-it válido. Intenta de nuevo.");
  } else {
    output.innerText = `Letra detectada: ${letter}`;
    speak(`La letra es ${letter}`);
  }
}

function getLetterFromIndex(index) {
  const letras = "AÁBCDEÉFGHIÍJKLMNÑOÓPQRSTUÚVWXYZ";
  return letras[index] || "?";
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-MX";
  speechSynthesis.speak(utterance);
}

// Ejecutar funciones principales
startCamera();
loadModel();
