document.addEventListener('DOMContentLoaded', () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let isMuted = false;
    let hasInteracted = false;
    let currentFillFrequency = 350;
    const backgroundMusic = new Audio('music/Sad Piano Wind - Coyote Hearing.mp3');
    backgroundMusic.loop = true;
    let sliderVolumes = [0.3, 0.3, 0.3];

    // Function to play a generated sound
    function playGeneratedSound(frequency, duration = 0.4, type = 'sine', volume = 0.2) {
        if (isMuted) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), duration * 1000);
    }

    // Function to play a "wet" sound for color buttons
    function playWetSound(frequency) {
        if (isMuted) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        oscillator.type = 'sawtooth';
        oscillator.frequency.value = frequency;
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        filter.Q.value = 10;

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 600);
    }

    // Update background music volume based on slider values
    function updateBackgroundVolume() {
        const totalVolume = sliderVolumes.reduce((sum, vol) => sum + vol, 0);
        const normalizedVolume = Math.min(totalVolume / 3, 1);
        backgroundMusic.volume = isMuted ? 0 : normalizedVolume;
    }

    // Start background music on first interaction
    function startBackgroundMusic() {
        if (!hasInteracted) {
            updateBackgroundVolume();
            backgroundMusic.play().catch(e => console.log("Error playing background music:", e));
            hasInteracted = true;
        }
    }

    // Mute button logic
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
            muteBtn.style.background = isMuted ? '#22c55e' : '#ef4444';
            updateBackgroundVolume();
            startBackgroundMusic();
        });
    }

    // Sound buttons
    const soundButtons = [
        { id: 'btn1', freq: 200 }, { id: 'btn2', freq: 250 }, { id: 'btn3', freq: 300 }, { id: 'btn4', freq: 350 },
        { id: 'btn5', freq: 180 }, { id: 'btn6', freq: 220 }, { id: 'btn7', freq: 260 }, { id: 'btn8', freq: 320 }
    ];
    soundButtons.forEach(btn => {
        const button = document.getElementById(btn.id);
        button.style.background = `hsl(${Math.random() * 360}, 70%, 70%)`;
        const soundHandler = () => {
            button.style.background = `hsl(${Math.random() * 360}, 70%, 70%)`;
            currentFillFrequency = btn.freq;
            playGeneratedSound(btn.freq, 0.5, 'triangle');
            startBackgroundMusic();
        };
        button.addEventListener('click', soundHandler);
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            soundHandler();
        });
    });

    // Throttling for slider sound: debounce for 150ms
    let sliderSoundTimeout;
    function sliderSoundThrottle(frequency) {
        if (sliderSoundTimeout) clearTimeout(sliderSoundTimeout);
        sliderSoundTimeout = setTimeout(() => {
            playGeneratedSound(frequency);
        }, 150);
    }

    // Vertical sliders setup
    function setupSlider(sliderId, frequency, index) {
        const slider = document.getElementById(sliderId);
        slider.addEventListener('input', () => {
            const value = parseInt(slider.value);
            sliderVolumes[index] = value / 100;
            const hue = (value / 100) * 360;
            const color = `hsl(${hue}, 70%, 70%)`;
            slider.style.setProperty('--thumb-color', color);
            updateBackgroundVolume();
            sliderSoundThrottle(frequency);
            startBackgroundMusic();
        });
        slider.style.setProperty('--thumb-color', `hsl(${30 * index}, 70%, 70%)`);
    }
    setupSlider('slider1', 220, 0);
    setupSlider('slider2', 270, 1);
    setupSlider('slider3', 320, 2);

    // Color Picker (12 colors)
    const colorPicker = document.getElementById('color-picker');
    const numColors = 12;
    let selectedColor = 'hsl(270, 70%, 70%)';
    const colorFrequencies = Array.from({ length: numColors }, (_, i) => 200 + i * 40);
    for (let i = 0; i < numColors; i++) {
        // Round hue value to ensure correct color generation
        const hue = Math.round(270 - (i * 22.5));
        const color = `hsl(${hue}, 70%, 70%)`;
        const option = document.createElement('div');
        option.className = 'color-option';
        option.style.background = color;
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedColor = color;
            playWetSound(colorFrequencies[i]);
            startBackgroundMusic();
        });
        colorPicker.appendChild(option);
    }
    colorPicker.children[0].classList.add('selected');

    // Coloring Canvas Setup
    const coloringCanvas = document.getElementById('coloring-canvas');
    const coloringCtx = coloringCanvas.getContext('2d');
    const clearColoringBtn = document.getElementById('clear-coloring');
    coloringCanvas.width = 400;
    coloringCanvas.height = 400;

    const NUM_IMAGES = 9;
    const imageList = Array.from({ length: NUM_IMAGES }, (_, i) => `images/image${i + 1}.jpg`);
    let currentImageIndex = 0;
    let zoomLevel = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let startX, startY;
    let paintedData = null;
    let currentImage = null;

    function loadImage() {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageList[currentImageIndex];
        img.onload = () => {
            currentImage = img;
            drawImage();
        };
    }

    function drawImage() {
        coloringCtx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
        const scaledWidth = coloringCanvas.width * zoomLevel;
        const scaledHeight = coloringCanvas.height * zoomLevel;
        coloringCtx.drawImage(currentImage, offsetX, offsetY, scaledWidth, scaledHeight);

        if (paintedData) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = coloringCanvas.width;
            tempCanvas.height = coloringCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(paintedData, 0, 0);
            coloringCtx.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
        }
    }

    loadImage();

    // Helper function to clamp offsets so the image stays within canvas boundaries
    function clampOffsets() {
        const canvasW = coloringCanvas.width;
        const canvasH = coloringCanvas.height;
        const scaledWidth = canvasW * zoomLevel;
        const scaledHeight = canvasH * zoomLevel;
        // Clamp offsetX between (canvasW - scaledWidth) and 0
        offsetX = Math.min(0, Math.max(offsetX, canvasW - scaledWidth));
        // Clamp offsetY between (canvasH - scaledHeight) and 0
        offsetY = Math.min(0, Math.max(offsetY, canvasH - scaledHeight));
    }

    // Zoom handler with focus on cursor position and offset clamping
    function handleZoom(e, delta) {
        e.preventDefault();
        const rect = coloringCanvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

        const zoomFactor = delta < 0 ? 1.1 : 0.9;
        const newZoomLevel = zoomLevel * zoomFactor;

        if (newZoomLevel < 1) {
            zoomLevel = 1;
            offsetX = 0;
            offsetY = 0;
        } else if (newZoomLevel > 5) {
            zoomLevel = 5;
        } else {
            zoomLevel = newZoomLevel;
            // Adjust offsets so the zoom focuses on the cursor position
            offsetX -= (x / zoomLevel) * (zoomFactor - 1);
            offsetY -= (y / zoomLevel) * (zoomFactor - 1);
        }
        clampOffsets();
        drawImage();
        startBackgroundMusic();
    }

    coloringCanvas.addEventListener('wheel', (e) => {
        handleZoom(e, e.deltaY);
    });

    // Unified touch handling on coloring canvas for pinch-zoom, pan, and flood fill
    let lastTouchDistance = 0;
    coloringCanvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            lastTouchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        } else if (e.touches.length === 1) {
            const rect = coloringCanvas.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            const touchY = e.touches[0].clientY - rect.top;
            // If zoomed in, assume pan gesture; otherwise trigger flood fill
            if (zoomLevel > 1) {
                isDragging = true;
                startX = touchX - offsetX;
                startY = touchY - offsetY;
            } else {
                e.preventDefault();
                const x = (touchX - offsetX) / zoomLevel;
                const y = (touchY - offsetY) / zoomLevel;
                floodFill(x, y, selectedColor);
            }
        }
        startBackgroundMusic();
    });

    coloringCanvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const newDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const zoomFactor = newDistance / lastTouchDistance;
            const newZoomLevel = zoomLevel * zoomFactor;
            const rect = coloringCanvas.getBoundingClientRect();
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
            if (newZoomLevel < 1) {
                zoomLevel = 1;
                offsetX = 0;
                offsetY = 0;
            } else if (newZoomLevel > 5) {
                zoomLevel = 5;
            } else {
                zoomLevel = newZoomLevel;
                offsetX -= (centerX / zoomLevel) * (zoomFactor - 1);
                offsetY -= (centerY / zoomLevel) * (zoomFactor - 1);
            }
            lastTouchDistance = newDistance;
            clampOffsets();
            drawImage();
            startBackgroundMusic();
        } else if (isDragging && e.touches.length === 1) {
            e.preventDefault();
            const rect = coloringCanvas.getBoundingClientRect();
            offsetX = e.touches[0].clientX - rect.left - startX;
            offsetY = e.touches[0].clientY - rect.top - startY;
            clampOffsets();
            drawImage();
        }
    });

    coloringCanvas.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Mouse events for panning on the coloring canvas
    coloringCanvas.addEventListener('mousedown', (e) => {
        if (zoomLevel > 1) {
            isDragging = true;
            const rect = coloringCanvas.getBoundingClientRect();
            startX = e.clientX - rect.left - offsetX;
            startY = e.clientY - rect.top - offsetY;
        }
        startBackgroundMusic();
    });

    coloringCanvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const rect = coloringCanvas.getBoundingClientRect();
            offsetX = e.clientX - rect.left - startX;
            offsetY = e.clientY - rect.top - startY;
            clampOffsets();
            drawImage();
        }
    });

    // Ensure dragging stops even if the mouse is released outside the canvas
    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Flood fill with tolerance for color matching
    // Helper function to check if a pixel is black (or nearly black)
    function isBlack(color, tolerance = 30) {
        return color[0] < tolerance && color[1] < tolerance && color[2] < tolerance;
    }

    function floodFill(x, y, fillColor) {
        const origX = Math.floor(x);
        const origY = Math.floor(y);
        if (origX < 0 || origX >= coloringCanvas.width || origY < 0 || origY >= coloringCanvas.height) return;
        const imageData = coloringCtx.getImageData(0, 0, coloringCanvas.width, coloringCanvas.height);
        const data = imageData.data;
        const targetColor = getPixelColor(origX, origY, data);
        // If the origin pixel is black, do not fill.
        if (isBlack(targetColor)) return;
        // If target color matches the fill color (within tolerance), do not fill.
        if (colorsMatch(targetColor, hslToRgb(fillColor), 10)) return;

        const stack = [[origX, origY]];
        while (stack.length) {
            const [currX, currY] = stack.pop();
            if (currX < 0 || currX >= coloringCanvas.width || currY < 0 || currY >= coloringCanvas.height) continue;
            const pos = (currY * coloringCanvas.width + currX) * 4;
            // Skip if the current pixel is black
            if (isBlack(getPixelColor(currX, currY, data))) continue;
            if (!colorsMatch(getPixelColor(currX, currY, data), targetColor, 10)) continue;
            const rgb = hslToRgb(fillColor);
            data[pos] = rgb[0];
            data[pos + 1] = rgb[1];
            data[pos + 2] = rgb[2];
            data[pos + 3] = 255;
            stack.push([currX + 1, currY]);
            stack.push([currX - 1, currY]);
            stack.push([currX, currY + 1]);
            stack.push([currX, currY - 1]);
        }
        coloringCtx.putImageData(imageData, 0, 0);
        paintedData = coloringCtx.getImageData(0, 0, coloringCanvas.width, coloringCanvas.height);
        playGeneratedSound(currentFillFrequency);
        startBackgroundMusic();
        drawImage();
    }

    function getPixelColor(x, y, data) {
        const pos = (y * coloringCanvas.width + x) * 4;
        return [data[pos], data[pos + 1], data[pos + 2], data[pos + 3]];
    }

    // Compare two colors with a given tolerance
    function colorsMatch(c1, c2, tolerance = 0) {
        return Math.abs(c1[0] - c2[0]) <= tolerance &&
               Math.abs(c1[1] - c2[1]) <= tolerance &&
               Math.abs(c1[2] - c2[2]) <= tolerance &&
               Math.abs(c1[3] - c2[3]) <= tolerance;
    }

    // Convert an HSL string to an RGB array with full opacity
    function hslToRgb(hsl) {
        const [h, s, l] = hsl.match(/\d+/g).map(Number);
        const hNorm = h / 360;
        const sNorm = s / 100;
        const lNorm = l / 100;
        let r, g, b;
        if (sNorm === 0) {
            r = g = b = lNorm;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
            const p = 2 * lNorm - q;
            r = hue2rgb(p, q, hNorm + 1 / 3);
            g = hue2rgb(p, q, hNorm);
            b = hue2rgb(p, q, hNorm - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
    }

    // Click event for flood fill on desktop
    coloringCanvas.addEventListener('click', (e) => {
        if (!isDragging) {
            const rect = coloringCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - offsetX) / zoomLevel;
            const y = (e.clientY - rect.top - offsetY) / zoomLevel;
            floodFill(x, y, selectedColor);
        }
    });

    clearColoringBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % imageList.length;
        zoomLevel = 1;
        offsetX = 0;
        offsetY = 0;
        paintedData = null;
        loadImage();
        playGeneratedSound(300);
        startBackgroundMusic();
    });

    // Scribble Canvas Setup
    const scribbleCanvas = document.getElementById('scribble-canvas');
    const scribbleCtx = scribbleCanvas.getContext('2d');
    const lineWidth = document.getElementById('line-width');
    const clearScribbleBtn = document.getElementById('clear-scribble');
    scribbleCanvas.width = 400;
    scribbleCanvas.height = 400;
    let isDrawing = false;

    scribbleCtx.lineCap = 'round';
    scribbleCtx.lineJoin = 'round';

    function getCanvasCoordinates(e, canvas, rect) {
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
    }

    function startDrawing(e) {
        isDrawing = true;
        const rect = scribbleCanvas.getBoundingClientRect();
        const { x, y } = getCanvasCoordinates(e, scribbleCanvas, rect);
        scribbleCtx.beginPath();
        scribbleCtx.moveTo(x, y);
        scribbleCtx.strokeStyle = selectedColor;
        scribbleCtx.lineWidth = lineWidth.value;
        playGeneratedSound(320);
        startBackgroundMusic();
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const rect = scribbleCanvas.getBoundingClientRect();
        const { x, y } = getCanvasCoordinates(e, scribbleCanvas, rect);
        scribbleCtx.lineTo(x, y);
        scribbleCtx.stroke();
    }

    function stopDrawing() {
        isDrawing = false;
        scribbleCtx.closePath();
    }

    scribbleCanvas.addEventListener('mousedown', startDrawing);
    scribbleCanvas.addEventListener('mousemove', draw);
    scribbleCanvas.addEventListener('mouseup', stopDrawing);
    scribbleCanvas.addEventListener('mouseleave', stopDrawing);
    scribbleCanvas.addEventListener('touchstart', startDrawing);
    scribbleCanvas.addEventListener('touchmove', draw);
    scribbleCanvas.addEventListener('touchend', stopDrawing);

    clearScribbleBtn.addEventListener('click', () => {
        scribbleCtx.clearRect(0, 0, scribbleCanvas.width, scribbleCanvas.height);
        playGeneratedSound(300);
        startBackgroundMusic();
    });

    // Piano setup with a rainbow scale matching the color picker palette
    const piano = document.getElementById('piano');
    const notes = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'];
    const blackNotes = [1, 3, 6, 8, 10];

    notes.forEach((note, index) => {
        const key = document.createElement('button');
        // Calculate hue similar to the color picker, rounding to an integer
        const hue = Math.round(270 - (index * 22.5));
        key.className = `key ${blackNotes.includes(index) ? 'black' : 'white'}`;
        key.dataset.note = note;
        // Set background color using the HSL scale
        key.style.background = `hsl(${hue}, 70%, 70%)`;
        piano.appendChild(key);

        key.addEventListener('click', () => {
            playNote(note);
            startBackgroundMusic();
        });
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playNote(note);
            startBackgroundMusic();
        });
    });

    function playNote(note) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.value = noteToFrequency(note);
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 500);
    }

    function noteToFrequency(note) {
        const frequencies = {
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
            'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
            'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88
        };
        return frequencies[note];
    }
});
