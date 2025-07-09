let model;

window.onload = async () => {
  // Cargar modelo
  model = await tf.loadGraphModel('model/model.json');
  console.log("✅ Modelo cargado.");

  // Iniciar cámara
  const video = document.getElementById("video");
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((err) => {
      alert("Error al acceder a la cámara: " + err.message);
    });

  // Captura de imagen
  document.getElementById("capture").addEventListener("click", async () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 224, 224);

    const imageTensor = tf.browser.fromPixels(canvas).expandDims(0).toFloat().div(255);
    const prediction = await model.predict(imageTensor).data();
    const letter = getLetterFromPrediction(prediction);

    document.getElementById("result").innerText = letter;
    speak(letter);
  });
};

// Mapea índices a letras, incluyendo letras con tilde y ñ
function getLetterFromPrediction(prediction) {
  const alphabet = "AÁBCDEÉFGHIÍJKLMNÑOÓPQRSTUÚVWXYZ";
  const maxIndex = prediction.indexOf(Math.max(...prediction));
  return alphabet[maxIndex] || "?";
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-MX';

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(v =>
    v.lang.startsWith('es') && (v.name.toLowerCase().includes('mexico') || v.name.toLowerCase().includes('latino'))
  );

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  window.speechSynthesis.speak(utterance);
}
