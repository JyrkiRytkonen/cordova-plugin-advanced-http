module.exports = function init(storage, ToughCookie, WebStorageCookieStore, exec) {
  var storeKey = '__advancedHttpCookieStore__';

  var store = new WebStorageCookieStore(storage, storeKey);
  var cookieJar = new ToughCookie.CookieJar(store);

  return {
    setCookieFromString: setCookieFromString,
    setCookie: setCookie,
    getCookieString: getCookieString,
    clearCookies: clearCookies,
    removeCookies: removeCookies
  };

  function splitCookieString(cookieStr) {
    var cookieParts = cookieStr.split(',');
    var splitCookies = [];
    var processedCookie = null;

    for (var i = 0; i < cookieParts.length; ++i) {
      if (cookieParts[i].substr(-11, 8).toLowerCase() === 'expires=') {
        processedCookie = cookieParts[i] + ',' + cookieParts[i + 1];
        i++;
      } else {
        processedCookie = cookieParts[i];
      }

      processedCookie = processedCookie.trim();
      splitCookies.push(processedCookie);
    }

    return splitCookies;
  }

  function setCookieFromString(url, cookieStr) {
    if (!cookieStr) return;

    var cookies = splitCookieString(cookieStr);

    for (var i = 0; i < cookies.length; ++i) {
      cookieJar.setCookieSync(cookies[i], url, { ignoreError: true });
    }
  }

  function setCookie(url, cookie, options) {
    options = options || {};
    options.ignoreError = false;
    cookieJar.setCookieSync(cookie, url, options);
  }

  function getCookieString(url) {
    return cookieJar.getCookieStringSync(url);
  }

  function clearCookies() {
    // Clear cookies from the plugin's managed store (localStorage)
    window.localStorage.removeItem(storeKey);
    
    // Also clear system cookies on iOS via native plugin when using setHTTPShouldHandleCookies:YES
    // The native clearCookies() method removes all cookies from NSHTTPCookieStorage
    // This ensures that iOS won't automatically attach cookies to subsequent requests
    if (exec) {
      exec(function() {}, function() {}, 'CordovaHttpPlugin', 'clearCookies', []);
    }
  }

  function removeCookies(url, cb) {
    cookieJar.getCookies(url, function (error, cookies) {
      if (!cookies || cookies.length === 0) {
        return cb(null, []);
      }

      var domain = cookies[0].domain;

      cookieJar.store.removeCookies(domain, null, cb);
    });
  }
};
