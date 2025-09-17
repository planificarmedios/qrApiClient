// ---------------- CONFIGURACIÓN DE RUTAS ----------------
const ROOT_PATH = window.location.hostname.includes("github.io") 
    ? "/qrApiClient/"  // Reemplaza con tu repo si cambia
    : "/";              // Localhost

function asset(path) {
    return ROOT_PATH + path.replace(/^\/+/, "");
}

// ---------------- BOT LOTTIE ----------------
const botContainer = document.getElementById('bot');
const botText = document.getElementById('botText');
let botAnim = null;

function showBotText(text) {
    botText.textContent = text;
    botText.style.opacity = '1';
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
        path: asset(animPath)
    });
    botText.style.animation = animPath.includes("Robot-Bot3D.json") ? "blink 1s infinite" : "";
}

// ---------------- ANIMACIONES POR RANGO DE MESA ----------------
const animacionesPorRango = [
    { min: 1, max: 5, animPath: "lottie/Robot-Bot3D.json" },
    { min: 6, max: 10, animPath: "lottie/Mapping.json" },
    { min: 11, max: 15, animPath: "lottie/RobotLoading.json" },
    { min: 16, max: 30, animPath: "lottie/RobotAssistant.json" },
];

function getAnimacionPorMesa(mesa) {
    for (const rango of animacionesPorRango) {
        if (mesa >= rango.min && mesa <= rango.max) return rango.animPath;
    }
    return "lottie/RobotDefault.json"; // por defecto
}

// Animación inicial
loadBotAnimation("lottie/RobotDefault.json");

// ---------------- VARIABLES ----------------
let qrScanner = null;
const qrResult = document.getElementById('qrResult');
const video = document.getElementById('video');

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

    const qrSelect = document.getElementById('qrCamSelect');
    qrSelect.innerHTML = '';
    videoDevices.forEach((d, i) => {
        const opt = document.createElement('option');
        opt.value = d.deviceId;
        opt.text = d.label || `Cámara ${i + 1}`;
        qrSelect.appendChild(opt);
    });
}

// ---------------- INICIAR CÁMARA DE QR ----------------
document.getElementById('saveCamSelection').onclick = async () => {
    const qrCamId = document.getElementById('qrCamSelect').value;

    if (qrScanner) await qrScanner.stop().catch(() => {});

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: qrCamId } } });
        video.srcObject = stream;
        startQrScanner(qrCamId);
        document.getElementById('camModal').style.display = 'none';
    } catch (err) {
        console.error("❌ Error iniciando cámara QR:", err);
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

                    // Cargar animación según la mesa detectada
                    const animPath = getAnimacionPorMesa(nroMesa);
                    loadBotAnimation(animPath);
                }

                qrResult.textContent = "✅ " + mensajeFinal;
                showBotText("✅ " + mensajeFinal);
                launchConfetti();

                // Reset al estado inicial después de 5 segundos
                setTimeout(() => {
                    qrResult.textContent = "📷 Cámara activada, apunta a un QR";
                    qrResult.style.color = "#fef9f9ff";
                    loadBotAnimation("lottie/RobotDefault.json");
                    showBotText(" ");
                }, 5000);
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
