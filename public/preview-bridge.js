(() => {
  const CHANNEL = 'guild-preview';
  const VERSION = 1;
  if (window.parent === window) return;

  const params = new URLSearchParams(window.location.search);
  const sessionNonce = params.get('guildNonce') || '';
  const designRevisionId = params.get('guildRevision') || '';
  const screenKey = params.get('guildScreen') || '';
  if (!sessionNonce || !designRevisionId || !screenKey) return;

  function post(type, payload) {
    const message = {
      channel: CHANNEL,
      version: VERSION,
      sessionNonce,
      designRevisionId,
      screenKey,
      type,
      payload,
    };
    window.parent.postMessage(message, document.referrer ? new URL(document.referrer).origin : '*');
  }

  function report(type) {
    post(type, {
      route: `${window.location.pathname}${window.location.search}`,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
  }

  window.addEventListener('load', () => report('ready'));
  window.addEventListener('hashchange', () => report('route'));
  window.addEventListener('popstate', () => report('route'));
  window.addEventListener('scroll', () => report('scroll'), { passive: true });
  window.addEventListener('resize', () => report('viewport'));
})();
