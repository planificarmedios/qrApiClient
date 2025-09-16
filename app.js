// ---------------- BOT LOTTIE ----------------
const botContainer = document.getElementById('bot');
const botText = document.getElementById('botText');
let botAnim = null;

function showBotText(text) {
    botText.textContent = text;
    botText.style.opacity = '1';
    // Ocultar automáticamente si no es QR
    if (!text.startsWith("✅")) {
        setTimeout(() => botText.style.opacity = '0', 3000);
    }
}

function loadBotAnimation(animPath) {
    if (botAnim) botAnim.destroy();

    botAnim = lottie.loadAnimation({
        container: botContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: animPath
    });

    botText.style.animation = animPath.includes("Robot-Bot3D.json") ? "blink 1s infinite" : "";
}

// ---------------- CONFIGURACIÓN DE ANIMACIONES POR RANGO DE MESA ----------------
const animacionesPorRango = [
    { min: 1, max: 5, animPath: "/lottie/Robot-Bot3D.json" },
    { min: 6, max: 10, animPath: "/lottie/RobotHello.json" },
    { min: 11, max: 15, animPath: "/lottie/RobotLoading.json" },
    { min: 16, max: 30, animPath: "/lottie/RobotAssistant.json" },
    // Agregá más rangos si querés
];

function getAnimacionPorMesa(mesa) {
    console.log ("Mesa detectada:", mesa);
    for (const rango of animacionesPorRango) {
        if (mesa >= rango.min && mesa <= rango.max) return rango.animPath;
    }
    return "/lottie/Mapping.json"; // animación por defecto
}

// Animación inicial
loadBotAnimation("/lottie/Mapping.json");

// ---------------- VARIABLES ----------------
let faceStream = null;
let qrScanner = null;
let faceDetected = false;

const video = document.getElementById('video');   // cámara de rostros
const qrResult = document.getElementById('qrResult');

// IDs de cámaras preseleccionadas
const INTEGRADA_ID = "d5dffc2a6f2ba64390ffd49820e60c637859ec17ea3b3e7adb3c04a530d5a6ff";
const USB_ID = "8936d5623547ac5c662720bbb28aa2c588130ba2d75c752b4a8860cfcb7b5014";

// ---------------- FACE DETECTION ----------------
async function initFaceDetection() {
    await faceapi.nets.tinyFaceDetector.loadFromUri(
        "https://justadudewhohacks.github.io/face-api.js/models/"
    );

    setInterval(async () => {
        if (!video.srcObject) return;

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

        if (detections.length === 0) {
            faceDetected = false;
            loadBotAnimation("/lottie/Mapping.json");
        } else if (detections.length > 0 && !faceDetected) {
            faceDetected = true;
            // Animación por defecto hasta leer QR
            loadBotAnimation("/lottie/Robot-Bot3D.json");
        }
    }, 1000);
}

// ---------------- MODAL CAMARAS ----------------
document.getElementById('selectCamsBtn').onclick = async () => {
    document.getElementById('camModal').style.display = 'flex';
    await populateCameraOptions();
};

document.getElementById('closeCamModal').onclick = () => {
    document.getElementById('camModal').style.display = 'none';
};

async function populateCameraOptions() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');

    const faceSelect = document.getElementById('faceCamSelect');
    const qrSelect = document.getElementById('qrCamSelect');

    faceSelect.innerHTML = '';
    qrSelect.innerHTML = '';

    videoDevices.forEach((d, i) => {
        const opt1 = document.createElement('option');
        opt1.value = d.deviceId;
        opt1.text = d.label || `Cámara ${i + 1}`;
        faceSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = d.deviceId;
        opt2.text = d.label || `Cámara ${i + 1}`;
        qrSelect.appendChild(opt2);
    });

    if ([...faceSelect.options].some(opt => opt.value === INTEGRADA_ID)) faceSelect.value = INTEGRADA_ID;
    if ([...qrSelect.options].some(opt => opt.value === USB_ID)) qrSelect.value = USB_ID;
}

document.getElementById('saveCamSelection').onclick = async () => {
    const faceCamId = document.getElementById('faceCamSelect').value;
    const qrCamId = document.getElementById('qrCamSelect').value;

    if (faceStream) faceStream.getTracks().forEach(t => t.stop());
    if (qrScanner) await qrScanner.stop().catch(() => {});

    try {
        faceStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: faceCamId } } });
        video.srcObject = faceStream;
        //initFaceDetection();
        startQrScanner(qrCamId);
        document.getElementById('camModal').style.display = 'none';
    } catch (err) {
        console.error("❌ Error iniciando cámaras:", err);
    }
};

// ---------------- CONFETTI ----------------
const confettiCanvas = document.getElementById("confettiCanvas");
let lastConfetti = 0;
function launchConfetti() {
    const now = Date.now();
    if (now - lastConfetti < 2000) return;
    lastConfetti = now;

    if(!confettiCanvas) return;
    const myConfetti = confetti.create(confettiCanvas, { resize: true, useWorker: true });
    myConfetti({
        particleCount: 200,
        spread: 120,
        startVelocity: 40,
        gravity: 0.6,
        ticks: 200,
        origin: { y: 0.3 },
        colors: ['#ff0a54','#ff477e','#ff7096','#ff85a1','#fbb1b1','#f9bec7']
    });
}

// ---------------- QR SCANNER ----------------
async function startQrScanner(qrCamId) { 
    qrScanner = new Html5Qrcode("qrVideo");

    try {
        await qrScanner.start(
            { deviceId: { exact: qrCamId } },
            { fps: 10, qrbox: 250 },
            qrCodeMessage => {
                qrResult.style.color = "lime";

                let mensajeFinal = "QR inválido";
                let nroMesa = 0;

                if (qrCodeMessage.includes(" | ")) {
                    const partes = qrCodeMessage.split(" | ");
                    const mensaje = partes[0];                    
                    const codigo = partes[1];                     
                    nroMesa = parseInt(codigo.split("-")[1]) || 0;
                    mensajeFinal = `${mensaje} ${nroMesa}`;

                    // Cargar animación según el rango de mesa
                    const animPath = getAnimacionPorMesa(nroMesa);
                    loadBotAnimation(animPath);
                }

                qrResult.textContent = "✅ " + mensajeFinal;
                showBotText("✅ " + mensajeFinal);
                launchConfetti();

                // ---------------- RESET AUTOMÁTICO ----------------
                setTimeout(() => {
                    // Volver al estado inicial
                    qrResult.textContent = "📷 Cámara activada, apunta a un QR";
                    qrResult.style.color = "#fef9f9ff";
                    loadBotAnimation("/lottie/Mapping.json");
                    showBotText(" ");
                }, 5000); // 5 segundos antes de resetear
            },
            errorMessage => {
                console.log("Escaneo activo, sin QR todavía");
            }
        );

        qrResult.style.color = "#fef9f9ff";
        qrResult.textContent = "📷 Cámara activada, apunta a un QR";
    } catch(err) {
        console.error("❌ Error iniciando lector QR:", err);
        qrResult.style.color = "red";
        qrResult.textContent = "❌ Error iniciando lector QR: " + err;
    }
}

