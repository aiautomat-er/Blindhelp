const camera = document.querySelector('#camera');
const button = document.querySelector('#scanButton');
const detections = document.querySelector('#detections');
const placeholder = document.querySelector('#cameraPlaceholder');
const guidanceText = document.querySelector('#guidanceText');
const muteButton = document.querySelector('#muteButton');
let model, scanning = false, muted = false, lastMessage = '';

const icons = { person: '◉', chair: '▣', couch: '▰', 'dining table': '▤', bottle: '◌', backpack: '◇', car: '▱', bicycle: '◯', dog: '⌁', cat: '⌁' };
function distance(box) { const size = box[2] * box[3]; return size > 75000 ? 'very close' : size > 26000 ? 'nearby' : 'ahead'; }
function speak(message) { if (muted || message === lastMessage || !('speechSynthesis' in window)) return; lastMessage = message; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(message); utterance.rate = .92; utterance.pitch = .95; window.speechSynthesis.speak(utterance); }
function render(items) { if (!items.length) { detections.innerHTML = '<div class="empty-state"><span>⌁</span><p>Looking around…<br />No clear objects yet</p></div>'; return; } detections.innerHTML = items.slice(0, 3).map(item => `<div class="detection"><span class="detection-icon">${icons[item.class] || '◌'}</span><span>${item.class}<small>${Math.round(item.score * 100)}% confidence</small></span><span class="distance">${distance(item.bbox)}</span></div>`).join(''); }
async function detect() { if (!scanning || !model) return; const results = await model.detect(camera); const relevant = results.filter(x => x.score > .52).sort((a,b) => b.score - a.score); render(relevant); if (relevant[0]) { const item = relevant[0]; const message = `${item.class} ${distance(item.bbox)}.`; guidanceText.textContent = message; speak(message); } requestAnimationFrame(() => setTimeout(detect, 900)); }
async function start() { try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); camera.srcObject = stream; placeholder.hidden = true; button.disabled = true; button.textContent = 'Loading vision…'; model = await cocoSsd.load(); scanning = true; button.textContent = 'Scanning now'; button.classList.add('active'); guidanceText.textContent = 'Scanning your surroundings'; speak('Camera started. Scanning your surroundings.'); detect(); } catch (error) { guidanceText.textContent = 'Camera access is needed to scan'; detections.innerHTML = '<div class="empty-state"><span>!</span><p>Please allow camera access<br />then try again</p></div>'; button.textContent = 'Try camera again'; } finally { button.disabled = false; } }
button.addEventListener('click', () => scanning ? null : start());
muteButton.addEventListener('click', () => { muted = !muted; muteButton.textContent = muted ? '×' : '⌁'; muteButton.setAttribute('aria-label', muted ? 'Unmute narration' : 'Mute narration'); if (muted) window.speechSynthesis.cancel(); });
