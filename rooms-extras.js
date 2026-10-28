/* Wynee Rooms: TTS local de mensaje libre. No escribe en Firebase ni se emite a otras cuentas. */
(() => {
  'use strict';
  const input = document.getElementById('wyneeJokeCommand');
  const button = document.getElementById('wyneeJokeSpeak');
  const status = document.getElementById('wyneeJokeStatus');
  if (!input || !button || !status) return;
  function run() {
    const raw = input.value.trim();
    if (raw.length < 2) {
      status.textContent = 'Escribe el mensaje que quieres escuchar.';
      return;
    }
    if (!('speechSynthesis' in window)) {
      status.textContent = 'Este navegador no admite voz sintetizada.';
      return;
    }
    const utterance = new SpeechSynthesisUtterance(raw);
    utterance.lang = 'es-MX';
    utterance.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    status.textContent = `Reproduciendo en este dispositivo: ${raw}`;
  }
  button.addEventListener('click', run);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); run(); }
  });
})();
