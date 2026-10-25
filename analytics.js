/*
 * Code With Impact: privacy-friendly analytics (GoatCounter).
 * No cookies, no personal profiles. GoatCounter stores only aggregate counts.
 *
 * SETUP: create a free account at https://www.goatcounter.com and choose the
 * site code below ("codewithimpact"). If that code is taken, change GC_CODE.
 *
 * Analytics is skipped when:
 *  - the visitor has opted out on privacy.html (stored on their device only), or
 *  - their browser sends Global Privacy Control or Do Not Track.
 */
(function () {
  var GC_CODE = 'codewithimpact';

  var optedOut = false;
  try { optedOut = window.localStorage.getItem('skipgc') === 't'; } catch (e) {}
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') optedOut = true;
  window.cwiAnalyticsOff = optedOut;
  if (optedOut) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + GC_CODE + '.goatcounter.com/count');
  document.head.appendChild(s);

  // Count clicks on the actions that matter: forms, donations, socials, email, live projects.
  // Links with a data-goatcounter-click attribute are counted by GoatCounter itself.
  var VOL_FORM = '1FAIpQLSdKV3MCejsBWqHJJTQsNKtXnq5dQZwMrV2oWecGjBSsBYtOkg';
  var SUB_FORM = '1FAIpQLSf5lx7s6qApnilmF91cXnFFweXpXip7QSle1LdDbivNnrTJNQ';

  function classify(a) {
    var href = a.getAttribute('href') || '';
    var text = (a.textContent || '').toLowerCase();
    if (href.indexOf(SUB_FORM) > -1) return 'click-subscribe';
    if (href.indexOf(VOL_FORM) > -1) return text.indexOf('volunteer') > -1 ? 'click-volunteer-form' : 'click-partner-form';
    if (href.indexOf('buymeacoffee.com') > -1) return 'click-buy-coffee';
    if (href.indexOf('linkedin.com/company') > -1) return 'click-linkedin';
    if (href.indexOf('instagram.com') > -1) return 'click-instagram';
    if (href.indexOf('mailto:') === 0) return 'click-email';
    if (href.indexOf('streamlit.app') > -1) return 'click-project-dashboard';
    return null;
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.hasAttribute('data-goatcounter-click')) return;
    var name = classify(a);
    if (!name || !window.goatcounter || !window.goatcounter.count) return;
    window.goatcounter.count({ path: name, title: 'From ' + location.pathname, event: true });
  });
})();
