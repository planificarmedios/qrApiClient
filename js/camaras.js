let faceStream = null;
let qrStream = null;

// Abrir modal
document.getElementById('selectCamsBtn').onclick = async () => {
  document.getElementById('camModal').style.display = 'flex';
  await populateCameraOptions();
};

// Cerrar modal
document.getElementById('closeCamModal').onclick = () => {
  document.getElementById('camModal').style.display = 'none';
};

// Listar cámaras disponibles
async function populateCameraOptions() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(d => d.kind === 'videoinput');

  const faceSelect = document.getElementById('faceCamSelect');
  const qrSelect = document.getElementById('qrCamSelect');

  // limpiar opciones previas
  faceSelect.innerHTML = '';
  qrSelect.innerHTML = '';

  videoDevices.forEach(d => {
    const option1 = document.createElement('option');
    option1.value = d.deviceId;
    option1.text = d.label || `Cámara ${faceSelect.length+1}`;
    faceSelect.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = d.deviceId;
    option2.text = d.label || `Cámara ${qrSelect.length+1}`;
    qrSelect.appendChild(option2);
  });

  // Evitar duplicados: si ya elegiste una para rostros, la removemos del select QR y viceversa
  if(faceStream) {
    Array.from(qrSelect.options).forEach(opt => {
      if(opt.value === faceStream.getVideoTracks()[0].getSettings().deviceId) opt.disabled = true;
    });
  }
  if(qrStream) {
    Array.from(faceSelect.options).forEach(opt => {
      if(opt.value === qrStream.getVideoTracks()[0].getSettings().deviceId) opt.disabled = true;
    });
  }
}

// Guardar selección
document.getElementById('saveCamSelection').onclick = async () => {
  const faceCamId = document.getElementById('faceCamSelect').value;
  const qrCamId = document.getElementById('qrCamSelect').value;

  // Detener streams previos
  if(faceStream) faceStream.getTracks().forEach(t => t.stop());
  if(qrStream) qrStream.getTracks().forEach(t => t.stop());

  // Iniciar cámara rostros
  faceStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: faceCamId } });
  document.getElementById('video').srcObject = faceStream;

  // Iniciar cámara QR
  qrStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: qrCamId } });
  document.getElementById('qrVideo').srcObject = qrStream;

  document.getElementById('camModal').style.display = 'none';
};
