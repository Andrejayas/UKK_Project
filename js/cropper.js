/**
 * @file js/cropper.js
 * @description Editor foto profil interaktif gaya Discord dengan fitur pan, drag, zoom (100%-300%),
 *              masking lingkaran (circular preview), dan export canvas beresolusi tinggi.
 * @author Andrean Rayhan Wijaya
 */

/* ============================================================
   SECTION 1: CROPPER STATE & INITIALIZATION
   ============================================================ */

/**
 * State interaktif untuk pemotongan dan penyesuaian foto profil avatar.
 */
const cropperState = {
  img: null,
  imgNaturalW: 0,
  imgNaturalH: 0,
  circleD: 220,
  scale: 1,
  baseScale: 1,
  zoomFactor: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  initialOffsetX: 0,
  initialOffsetY: 0,
  sourceDataUrl: "",
};

/**
 * Mengompres dan mengecilkan dimensi gambar agar ringan dan tidak membebani memori / LocalStorage.
 * Foto resolusi tinggi (misal kamera HP 4000x3000px 8MB) akan di-scale ke maksimal 1024px.
 * @param {string} dataUrl - Data URL asli.
 * @param {number} maxDimension - Ukuran maksimal lebar/tinggi (default: 1024px).
 * @param {number} quality - Kualitas kompresi JPEG (default: 0.85).
 * @param {(compressedDataUrl: string) => void} callback
 */
function compressImageBeforeCrop(dataUrl, maxDimension = 1024, quality = 0.85, callback) {
  const img = new Image();
  img.onload = () => {
    let w = img.naturalWidth;
    let h = img.naturalHeight;

    if (w <= maxDimension && h <= maxDimension && dataUrl.length < 350000) {
      callback(dataUrl);
      return;
    }

    if (w > h) {
      if (w > maxDimension) {
        h = Math.round((h * maxDimension) / w);
        w = maxDimension;
      }
    } else {
      if (h > maxDimension) {
        w = Math.round((w * maxDimension) / h);
        h = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      callback(dataUrl);
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    const compressed = canvas.toDataURL("image/jpeg", quality);
    callback(compressed);
  };
  img.onerror = () => callback(dataUrl);
  img.src = dataUrl;
}

/**
 * Menangani proses unggah avatar.
 * Membuka editor crop gaya Discord untuk mengatur posisi & zoom.
 * @param {File} file - File gambar yang diunggah.
 * @returns {void}
 */
function handleAvatarUpload(file) {
  const errorEl = document.getElementById("avatarError");
  if (errorEl) { errorEl.textContent = ""; }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    if (errorEl) { errorEl.textContent = "Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP."; }
    return;
  }

  const maxSize = 15 * 1024 * 1024; /* Izinkan file kamera HP hingga 15MB */
  if (file.size > maxSize) {
    if (errorEl) { errorEl.textContent = "Ukuran file terlalu besar. Maksimal 15MB."; }
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const rawDataUrl = e.target.result;
    // Otomatis resize & kompres agar tidak membebani memori dan database LocalStorage
    compressImageBeforeCrop(rawDataUrl, 1024, 0.85, (safeDataUrl) => {
      initCropperWithImage(safeDataUrl);
    });
  };
  reader.readAsDataURL(file);
}

/**
 * Membuka modal crop gaya Discord dengan data URL gambar yang diberikan.
 * @param {string} dataUrl - Gambar dalam format data URL.
 * @returns {void}
 */
function initCropperWithImage(dataUrl) {
  cropperState.sourceDataUrl = dataUrl;
  const image = new Image();
  image.onload = () => {
    cropperState.img = image;
    cropperState.imgNaturalW = image.naturalWidth;
    cropperState.imgNaturalH = image.naturalHeight;

    const ringEl = document.querySelector(".crop-mask-ring");
    const D = ringEl && ringEl.offsetWidth > 0 ? ringEl.offsetWidth : 220;
    cropperState.circleD = D;

    const minDim = Math.min(image.naturalWidth, image.naturalHeight);
    cropperState.baseScale = D / minDim;
    cropperState.zoomFactor = 1.0;
    cropperState.scale = cropperState.baseScale * cropperState.zoomFactor;

    cropperState.offsetX = 0;
    cropperState.offsetY = 0;

    const cropImgEl = document.getElementById("cropImage");
    if (cropImgEl) {
      cropImgEl.src = dataUrl;
    }

    const zoomSlider = document.getElementById("cropZoomSlider");
    if (zoomSlider) {
      zoomSlider.value = 100;
    }
    updateCropZoomBadge(100);

    applyCropTransform();

    const cropModal = document.getElementById("avatarCropModal");
    if (cropModal) {
      cropModal.classList.remove("hidden");
    }
  };
  image.src = dataUrl;
}

/* ============================================================
   SECTION 2: TRANSFORM, ZOOM & DRAG CONTROLS
   ============================================================ */

/**
 * Menerapkan posisi transform (translate & scale) pada gambar di viewport crop.
 * Memastikan area lingkaran selalu tertutup penuh oleh gambar.
 * @returns {void}
 */
function applyCropTransform() {
  const cropImgEl = document.getElementById("cropImage");
  if (!cropImgEl || !cropperState.img) { return; }

  const dispW = Math.round(cropperState.imgNaturalW * cropperState.scale);
  const dispH = Math.round(cropperState.imgNaturalH * cropperState.scale);
  const D = cropperState.circleD;

  const maxOffsetX = Math.max(0, (dispW - D) / 2);
  const maxOffsetY = Math.max(0, (dispH - D) / 2);

  cropperState.offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, cropperState.offsetX));
  cropperState.offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, cropperState.offsetY));

  cropImgEl.style.width = `${dispW}px`;
  cropImgEl.style.height = `${dispH}px`;
  cropImgEl.style.transform = `translate(calc(-50% + ${cropperState.offsetX}px), calc(-50% + ${cropperState.offsetY}px))`;
}

/**
 * Mengatur zoom level pada cropper (100% sampai 300%).
 * @param {number} val - Nilai persentase zoom (100 - 300).
 * @returns {void}
 */
function setCropZoom(val) {
  const clampedVal = Math.max(100, Math.min(300, Math.round(val)));
  cropperState.zoomFactor = clampedVal / 100;
  cropperState.scale = cropperState.baseScale * cropperState.zoomFactor;

  const slider = document.getElementById("cropZoomSlider");
  if (slider) { slider.value = clampedVal; }
  updateCropZoomBadge(clampedVal);

  applyCropTransform();
}

/**
 * Memperbarui teks badge persentase zoom.
 * @param {number} val - Nilai persentase.
 * @returns {void}
 */
function updateCropZoomBadge(val) {
  const badge = document.getElementById("cropZoomBadge");
  if (badge) { badge.textContent = `${val}%`; }
}

/**
 * Memulai aksi drag / pan foto.
 * @param {number} clientX - Posisi X kursor / sentuhan.
 * @param {number} clientY - Posisi Y kursor / sentuhan.
 * @returns {void}
 */
function onCropDragStart(clientX, clientY) {
  if (!cropperState.img) { return; }
  cropperState.isDragging = true;
  cropperState.dragStartX = clientX;
  cropperState.dragStartY = clientY;
  cropperState.initialOffsetX = cropperState.offsetX;
  cropperState.initialOffsetY = cropperState.offsetY;
}

/**
 * Memperbarui posisi pan saat kursor / jari bergerak.
 * @param {number} clientX - Posisi X kursor / sentuhan.
 * @param {number} clientY - Posisi Y kursor / sentuhan.
 * @returns {void}
 */
function onCropDragMove(clientX, clientY) {
  if (!cropperState.isDragging) { return; }
  const dx = clientX - cropperState.dragStartX;
  const dy = clientY - cropperState.dragStartY;
  cropperState.offsetX = cropperState.initialOffsetX + dx;
  cropperState.offsetY = cropperState.initialOffsetY + dy;
  applyCropTransform();
}

/**
 * Mengakhiri aksi drag / pan foto.
 * @returns {void}
 */
function onCropDragEnd() {
  cropperState.isDragging = false;
}

/**
 * Menutup modal crop.
 * @returns {void}
 */
function closeCropModal() {
  const modal = document.getElementById("avatarCropModal");
  if (modal) { modal.classList.add("hidden"); }
  cropperState.isDragging = false;
}

/**
 * Merender hasil crop ke canvas 256x256, menyimpannya sebagai avatar user,
 * dan memperbarui seluruh tampilan antarmuka.
 * @returns {void}
 */
function applyAvatarCrop() {
  if (!cropperState.img) { return; }

  const targetSize = 256;
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) { return; }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const D = cropperState.circleD || 220;
  const k = targetSize / D;

  const dispW = cropperState.imgNaturalW * cropperState.scale;
  const dispH = cropperState.imgNaturalH * cropperState.scale;

  const imgCenterCanvasX = (targetSize / 2) + (cropperState.offsetX * k);
  const imgCenterCanvasY = (targetSize / 2) + (cropperState.offsetY * k);

  const drawW = dispW * k;
  const drawH = dispH * k;
  const drawX = imgCenterCanvasX - (drawW / 2);
  const drawY = imgCenterCanvasY - (drawH / 2);

  ctx.drawImage(cropperState.img, drawX, drawY, drawW, drawH);

  // Kompres hasil crop ke ukuran hemat (< 35KB)
  const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.88);

  // Pastikan rawAvatar juga hemat memori LocalStorage
  const safeRaw = (cropperState.sourceDataUrl && cropperState.sourceDataUrl.length < 250000)
    ? cropperState.sourceDataUrl
    : croppedDataUrl;

  saveProfile({
    avatar: croppedDataUrl,
    rawAvatar: safeRaw,
  });

  updateAvatarDisplays();
  renderProfileDropdown();
  closeCropModal();
  showToast("Foto profil berhasil disesuaikan! ✨", "success");
}
