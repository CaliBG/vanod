// Click-to-play enhancement; native controls remain available without JavaScript.
document.querySelectorAll('[data-brand-film]').forEach(player => {
  const video = player.querySelector('video');
  const play = player.querySelector('[data-film-play]');
  const error = player.parentElement?.querySelector('[data-film-error]');
  if (!(video instanceof HTMLVideoElement) || !(play instanceof HTMLButtonElement)) return;
  video.controls = false;
  play.hidden = false;
  const fail = () => { video.controls = true; play.hidden = true; if (error) error.hidden = false; };
  play.addEventListener('click', async () => {
    video.controls = true;
    play.hidden = true;
    try { await video.play(); } catch { fail(); }
  });
  video.addEventListener('play', () => {
    play.hidden = true;
    if (error) error.hidden = true;
    document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
  });
  video.addEventListener('error', fail);
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  window.addEventListener('pagehide', () => video.pause());
});
