import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm";

const dropzone = document.getElementById("dropzone");
const dropText = document.getElementById("dropText");
const fileInput = document.getElementById("fileInput");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const originalImg = document.getElementById("original");
const outputImg = document.getElementById("output");
const downloadBtn = document.getElementById("downloadBtn");

let originalUrl = null;
let outputUrl = null;
let outputName = "hasil-no-bg.png";
let busy = false;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
  statusEl.hidden = !message;
}

function revokeUrls() {
  if (originalUrl) URL.revokeObjectURL(originalUrl);
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  originalUrl = null;
  outputUrl = null;
}

async function handleFile(file) {
  if (busy || !file) return;

  if (!file.type.startsWith("image/")) {
    setStatus("File harus berupa gambar (PNG, JPG, atau WebP).", true);
    return;
  }

  busy = true;
  revokeUrls();
  downloadBtn.disabled = true;
  outputImg.removeAttribute("src");

  originalUrl = URL.createObjectURL(file);
  originalImg.src = originalUrl;
  resultEl.hidden = false;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "gambar";
  outputName = `${baseName}-no-bg.png`;

  setStatus("Menyiapkan...");

  try {
    const blob = await removeBackground(file, {
      output: { format: "image/png" },
      progress: (key, current, total) => {
        const percent = total ? Math.round((current / total) * 100) : 0;
        if (key.startsWith("fetch")) {
          setStatus(`Mengunduh model AI (hanya saat pertama kali)... ${percent}%`);
        } else {
          setStatus("Memproses gambar...");
        }
      },
    });

    outputUrl = URL.createObjectURL(blob);
    outputImg.src = outputUrl;
    downloadBtn.disabled = false;
    setStatus("Selesai.");
  } catch (err) {
    console.error(err);
    setStatus("Gagal memproses gambar. Pastikan internet aktif saat pertama kali dipakai, lalu coba lagi.", true);
  } finally {
    busy = false;
  }
}

fileInput.addEventListener("change", () => {
  handleFile(fileInput.files[0]);
  fileInput.value = "";
});

["dragenter", "dragover"].forEach((type) => {
  dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((type) => {
  dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", (e) => {
  handleFile(e.dataTransfer.files[0]);
});

downloadBtn.addEventListener("click", () => {
  if (!outputUrl) return;
  const a = document.createElement("a");
  a.href = outputUrl;
  a.download = outputName;
  document.body.appendChild(a);
  a.click();
  a.remove();
});