let model;

window.onload = async () => {
  model = await tf.loadGraphModel('model/model.json');
  console.log("Modelo cargado.");
};

document.getElementById("predictBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("imageInput");
  if (!fileInput.files[0]) return alert("Selecciona una imagen");

  const image = await loadImage(fileInput.files[0]);
  const tensor = preprocessImage(image);
  const prediction = await model.predict(tensor).data();

  const predictedLetter = getLetterFromPrediction(prediction);
  document.getElementById("result").innerText = predictedLetter;

  speak(predictedLetter);
});

function loadImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => resolve(img);
    };
    reader.readAsDataURL(file);
  });
}

function preprocessImage(img) {
  return tf.tidy(() => {
    let tensor = tf.browser.fromPixels(img).resizeNearestNeighbor([224, 224]).toFloat();
    tensor = tensor.div(255.0).expandDims(0);
    return tensor;
  });
}

function getLetterFromPrediction(prediction) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const maxIdx = prediction.indexOf(Math.max(...prediction));
  return alphabet[maxIdx];
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-MX'; // Español latinoamericano
  utterance.rate = 1;
  utterance.pitch = 1;

  // Buscar voz en español latino
  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = voices.find(voice =>
    voice.lang.startsWith('es') && (voice.name.toLowerCase().includes('mexico') || voice.name.toLowerCase().includes('latino'))
  );

  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }

  window.speechSynthesis.speak(utterance);
}
