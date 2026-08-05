(function () {
  var hash = window.location.hash || '';
  if (/^#(?:invite_token|confirmation_token|recovery_token|access_token|error)=/.test(hash)) {
    window.location.replace('/admin/' + hash);
  }
})();
