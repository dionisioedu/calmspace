document.addEventListener('DOMContentLoaded', () => {
    // === Audio & Background Music Setup ===
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let isMuted = false;
    let hasInteracted = false;
    let currentFillFrequency = 350;
    const backgroundMusic = new Audio('music/Sad Piano Wind - Coyote Hearing.mp3');
    backgroundMusic.loop = true;
    const sliderVolumes = [0.1, 0.1, 0.1];
  
    // === Global Painting Color (Controlled by Color Picker Only) ===
    let selectedColor = 'hsl(270, 70%, 70%)';
  
    // === Utility Functions ===
    function playGeneratedSound(freq, duration = 0.4, type = 'sine', volume = 0.2) {
      if (isMuted) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => osc.stop(), duration * 1000);
    }
  
    function playWetSound(freq) {
      if (isMuted) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      filter.Q.value = 10;
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 600);
    }
  
    function updateBackgroundVolume() {
      const total = sliderVolumes.reduce((sum, v) => sum + v, 0);
      backgroundMusic.volume = isMuted ? 0 : Math.min(total / 3, 1);
    }
  
    function startBackgroundMusic() {
      if (!hasInteracted) {
        updateBackgroundVolume();
        backgroundMusic.play().catch(e => console.log("Music error:", e));
        hasInteracted = true;
      }
    }
  
    // === Mute Button Setup ===
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
  
    // === Background Flash Effect ===
    function flashBackground() {
      const flash = document.createElement('div');
      flash.style.position = 'fixed';
      flash.style.top = '0';
      flash.style.left = '0';
      flash.style.width = '100%';
      flash.style.height = '100%';
      flash.style.backgroundColor = `hsla(${Math.floor(Math.random() * 360)}, 80%, 70%, 0.5)`;
      flash.style.opacity = '1';
      flash.style.transition = 'opacity 0.9s ease-out';
      document.body.appendChild(flash);
      setTimeout(() => flash.style.opacity = '0', 10);
      setTimeout(() => flash.remove(), 1000);
    }
  
    // === Particle Rain Effect ===
    function rainParticles() {
      const dropDistance = document.body.scrollHeight;
      for (let i = 0; i < 100; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 70%)`;
        particle.style.borderRadius = '50%';
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * 50;
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        particle.style.transition = 'transform 5s linear, opacity 5s linear';
        document.body.appendChild(particle);
        setTimeout(() => {
          particle.style.transform = `translateY(${dropDistance - startY}px)`;
          particle.style.opacity = '0';
        }, 0);
        setTimeout(() => particle.remove(), 5000);
      }
    }
  
    // === Button Replacement Animation ===
    function replaceButton(button) {
      button.style.transition = 'opacity 1.5s';
      button.style.opacity = '0';
      setTimeout(() => {
        button.style.background = `hsl(${Math.random() * 360}, 70%, 70%)`;
        button.style.opacity = '1';
        button.dataset.exploding = "false";
      }, 1500);
    }
  
    // === Explosion Effect ===
    // When two sound buttons (from either row) match, trigger a rain of particles and a background flash.
    function explodePair(lastButton, matchingButton) {
      flashBackground();
      rainParticles();
      [lastButton, matchingButton].forEach(button => {
        if (button.dataset.exploding === "true") return;
        button.dataset.exploding = "true";
        button.style.transition = 'opacity 1.5s';
        button.style.opacity = '0';
        setTimeout(() => {
          button.style.background = `hsl(${Math.random() * 360}, 70%, 70%)`;
          button.style.opacity = '1';
          button.dataset.exploding = "false";
        }, 1500);
      });
      playGeneratedSound(660, 1, 'sine', 0.15);
    }
  
    // === Pair Matching Logic ===
    // Compare the last-clicked sound button's new color with all other sound buttons.
    const allButtonIDs = ['btn5', 'btn6', 'btn7', 'btn8', 'btn1', 'btn2', 'btn3', 'btn4'];
    function getButton(id) {
      return document.getElementById(id);
    }
    function checkForMatch(lastButton) {
      const lastColor = lastButton.style.background;
      for (let id of allButtonIDs) {
        const btn = getButton(id);
        if (btn === lastButton) continue;
        if (btn.style.background === lastColor) {
          explodePair(lastButton, btn);
          return true;
        }
      }
      return false;
    }
    function maybeForcePair(lastButton) {
      if (Math.random() < 1 / 20) {
        const otherIDs = allButtonIDs.filter(id => getButton(id) !== lastButton);
        const randomOther = getButton(otherIDs[Math.floor(Math.random() * otherIDs.length)]);
        randomOther.style.background = lastButton.style.background;
        explodePair(lastButton, randomOther);
      }
    }
  
    // === Sound Buttons Setup (Two Rows) ===
    const soundButtonsData = [
      { id: 'btn1', freq: 200 },
      { id: 'btn2', freq: 250 },
      { id: 'btn3', freq: 300 },
      { id: 'btn4', freq: 350 },
      { id: 'btn5', freq: 180 },
      { id: 'btn6', freq: 220 },
      { id: 'btn7', freq: 260 },
      { id: 'btn8', freq: 320 }
    ];
    soundButtonsData.forEach(btnData => {
      const btn = getButton(btnData.id);
      btn.style.background = `hsl(${Math.random() * 360}, 70%, 70%)`;
      btn.style.transition = 'background 0.3s, opacity 1.5s';
      const handler = () => {
        // Update the button's color with a new random color and play its sound.
        btn.style.background = `hsl(${Math.random() * 360}, 70%, 70%)`;
        // Do NOT update selectedColor here—the painting color remains solely set by the color picker.
        currentFillFrequency = btnData.freq;
        playGeneratedSound(btnData.freq, 0.5, 'triangle');
        startBackgroundMusic();
        if (!checkForMatch(btn)) {
          maybeForcePair(btn);
        }
      };
      btn.addEventListener('click', handler);
      btn.addEventListener('touchstart', e => {
        e.preventDefault();
        handler();
      });
    });

    const bloopSound1 = new Audio('sounds/bloop-1.mp3');
    const bloopSound2 = new Audio('sounds/bloop-2.mp3');
    const bloopBtn1 = document.getElementById('bloop1');
    const bloopBtn2 = document.getElementById('bloop2');

    bloopBtn1.addEventListener('click', playBloop1);
    bloopBtn2.addEventListener('click', playBloop2);

    function playBloop1(event) {
      // Stop current sound and reset
      bloopSound1.pause(); // Pausa o som atual
      bloopSound1.currentTime = 0; // Volta ao início
      bloopSound1.play(); // Toca novamente

      // Create ripple effect
      const button = event.target;
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');

      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;

      // Position ripple at click location
      const rect = button.getBoundingClientRect();
      ripple.style.width = ripple.style.height = `${diameter}px`;
      ripple.style.left = `${event.clientX - rect.left - radius}px`;
      ripple.style.top = `${event.clientY - rect.top - radius}px`;

      button.appendChild(ripple);

      // Remove ripple after animation
      ripple.addEventListener('animationend', () => {
          ripple.remove();
      });
    }
    function playBloop2(event) {
      // Stop current sound and reset
      bloopSound2.pause(); // Pausa o som atual
      bloopSound2.currentTime = 0; // Volta ao início
      bloopSound2.play(); // Toca novamente

      // Create ripple effect
      const button = event.target;
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');

      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;

      // Position ripple at click location
      const rect = button.getBoundingClientRect();
      ripple.style.width = ripple.style.height = `${diameter}px`;
      ripple.style.left = `${event.clientX - rect.left - radius}px`;
      ripple.style.top = `${event.clientY - rect.top - radius}px`;

      button.appendChild(ripple);

      // Remove ripple after animation
      ripple.addEventListener('animationend', () => {
          ripple.remove();
      });
    }

    const stringSound = new Audio('sounds/button-15.mp3');
    const stringContainer = document.getElementById('string-container');
    stringContainer.addEventListener('click', (e) => {
      const string = document.querySelector('.string');

      stringSound.pause(); // Pausa o som atual
      stringSound.currentTime = 0; // Volta ao início
      stringSound.play(); // Toca novamente

      // Remove a classe vibrating para reiniciar a animação
      string.classList.remove('vibrating');
      
      // Força um reflow para reiniciar a animação
      void string.offsetWidth;
      
      // Adiciona a classe para iniciar a vibração
      string.classList.add('vibrating');
    });
  
    // === Slider Setup (Vertical) ===
    let sliderSoundTimeout;
    function sliderSoundThrottle(freq) {
      if (sliderSoundTimeout) clearTimeout(sliderSoundTimeout);
      sliderSoundTimeout = setTimeout(() => playGeneratedSound(freq), 150);
    }
    function setupSlider(id, freq, idx) {
      const slider = document.getElementById(id);
      slider.addEventListener('input', () => {
        const value = parseInt(slider.value, 10);
        sliderVolumes[idx] = value / 100;
        const hue = (value / 100) * 360;
        const color = `hsl(${hue}, 70%, 70%)`;
        slider.style.setProperty('--thumb-color', color);
        updateBackgroundVolume();
        sliderSoundThrottle(freq);
        startBackgroundMusic();
      });
      slider.style.setProperty('--thumb-color', `hsl(${30 * idx}, 70%, 70%)`);
    }
    setupSlider('slider1', 220, 0);
    setupSlider('slider2', 270, 1);
    setupSlider('slider3', 320, 2);
  
    // === Color Picker Setup ===
    const colorPicker = document.getElementById('color-picker');
    const numColors = 12;
    for (let i = 0; i < numColors; i++) {
      const hue = Math.round(270 - (i * 22.5));
      const color = `hsl(${hue}, 70%, 70%)`;
      const option = document.createElement('div');
      option.className = 'color-option';
      option.style.background = color;
      option.style.transition = 'opacity 0.3s';
      option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedColor = color;
        playWetSound(200 + i * 40);
        startBackgroundMusic();
      });
      colorPicker.appendChild(option);
    }
    if (colorPicker.firstChild) {
      colorPicker.firstChild.classList.add('selected');
    }
  
    // === Coloring Canvas Setup ===
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
    
    function clampOffsets() {
      const canvasW = coloringCanvas.width;
      const canvasH = coloringCanvas.height;
      const scaledWidth = canvasW * zoomLevel;
      const scaledHeight = canvasH * zoomLevel;
      offsetX = Math.min(0, Math.max(offsetX, canvasW - scaledWidth));
      offsetY = Math.min(0, Math.max(offsetY, canvasH - scaledHeight));
    }
    
    // === Revised Zoom Handler ===
    // This version ensures that if zooming out goes below 1, the canvas resets to initial scale.
    function handleZoom(e, delta) {
      e.preventDefault();
      const rect = coloringCanvas.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
      const zoomFactor = delta < 0 ? 1.1 : 0.9;
      let newZoom = zoomLevel * zoomFactor;
      // Reset to initial scale if zooming out too far
      if (newZoom < 1) {
        newZoom = 1;
        offsetX = 0;
        offsetY = 0;
      } else if (newZoom > 5) {
        newZoom = 5;
      }
      // Adjust offsets so that zoom focuses on the cursor position
      offsetX -= (x / newZoom) * (zoomFactor - 1);
      offsetY -= (y / newZoom) * (zoomFactor - 1);
      zoomLevel = newZoom;
      clampOffsets();
      drawImage();
      startBackgroundMusic();
    }
    
    coloringCanvas.addEventListener('wheel', e => handleZoom(e, e.deltaY));
    
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
        let newZoom = zoomLevel * zoomFactor;
        const rect = coloringCanvas.getBoundingClientRect();
        const centerX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
        const centerY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
        if (newZoom < 1) {
          newZoom = 1;
          offsetX = 0;
          offsetY = 0;
        } else if (newZoom > 5) {
          newZoom = 5;
        }
        offsetX -= (centerX / newZoom) * (zoomFactor - 1);
        offsetY -= (centerY / newZoom) * (zoomFactor - 1);
        zoomLevel = newZoom;
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
    
    coloringCanvas.addEventListener('touchend', () => { isDragging = false; });
    
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
    
    window.addEventListener('mouseup', () => { isDragging = false; });
    
    // === Flood Fill Function ===
    function isBlack(color, tol = 30) {
      return color[0] < tol && color[1] < tol && color[2] < tol;
    }
    
    function floodFill(x, y, fillColor) {
      const origX = Math.floor(x);
      const origY = Math.floor(y);
      if (origX < 0 || origX >= coloringCanvas.width || origY < 0 || origY >= coloringCanvas.height) return;
      const imageData = coloringCtx.getImageData(0, 0, coloringCanvas.width, coloringCanvas.height);
      const data = imageData.data;
      const targetColor = getPixelColor(origX, origY, data);
      if (isBlack(targetColor)) return;
      if (colorsMatch(targetColor, hslToRgb(fillColor), 10)) return;
      const stack = [[origX, origY]];
      while (stack.length) {
        const [cx, cy] = stack.pop();
        if (cx < 0 || cx >= coloringCanvas.width || cy < 0 || cy >= coloringCanvas.height) continue;
        const pos = (cy * coloringCanvas.width + cx) * 4;
        if (isBlack(getPixelColor(cx, cy, data))) continue;
        if (!colorsMatch(getPixelColor(cx, cy, data), targetColor, 10)) continue;
        const rgb = hslToRgb(fillColor);
        data[pos] = rgb[0];
        data[pos + 1] = rgb[1];
        data[pos + 2] = rgb[2];
        data[pos + 3] = 255;
        stack.push([cx + 1, cy]);
        stack.push([cx - 1, cy]);
        stack.push([cx, cy + 1]);
        stack.push([cx, cy - 1]);
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
    
    function colorsMatch(c1, c2, tol = 0) {
      return Math.abs(c1[0] - c2[0]) <= tol &&
             Math.abs(c1[1] - c2[1]) <= tol &&
             Math.abs(c1[2] - c2[2]) <= tol &&
             Math.abs(c1[3] - c2[3]) <= tol;
    }
    
    // Updated hslToRgb now matches floating numbers correctly.
    function hslToRgb(hsl) {
      const parts = hsl.match(/[\d\.]+/g);
      if (!parts || parts.length < 3) return [0, 0, 0, 255];
      const h = parseFloat(parts[0]), s = parseFloat(parts[1]), l = parseFloat(parts[2]);
      const hN = h / 360, sN = s / 100, lN = l / 100;
      let r, g, b;
      if (sN === 0) {
        r = g = b = lN;
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
        const p = 2 * lN - q;
        r = hue2rgb(p, q, hN + 1/3);
        g = hue2rgb(p, q, hN);
        b = hue2rgb(p, q, hN - 1/3);
      }
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
    }
    
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
    
    // === Scribble Canvas Setup ===
    const scribbleCanvas = document.getElementById('scribble-canvas');
    const scribbleCtx = scribbleCanvas.getContext('2d');
    const lineWidthInput = document.getElementById('line-width');
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
      scribbleCtx.lineWidth = lineWidthInput.value;
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
    
    // === Piano Setup (Rainbow Scale) ===
    const piano = document.getElementById('piano');
    const notes = ['C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4'];
    const blackNotes = [1,3,6,8,10];
    notes.forEach((note, index) => {
      const key = document.createElement('button');
      const hue = Math.round(270 - (index * 22.5));
      key.className = `key ${blackNotes.includes(index) ? 'black' : 'white'}`;
      key.dataset.note = note;
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
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = noteToFrequency(note);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 500);
    }
    
    function noteToFrequency(note) {
      const freqs = {
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
        'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
        'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88
      };
      return freqs[note];
    }
  });
  