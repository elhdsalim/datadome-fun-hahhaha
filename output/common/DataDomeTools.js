var ONE_YEAR_MS = 31536000000; // 365 days in milliseconds

module.exports = function () {
  this.dataDomeCookieName = "datadome"; // name of the main tracking cookie
  this.IECustomEvent = null; // cached IE CustomEvent constructor (lazy-initialized in dispatchEvent)
  this.emptyCookieDefaultValue = ".keep"; // default session value when no cookie exists (first visit)
  this.dataDomeStatusHeader = "x-dd-b"; // header carrying the challenge type bitmask
  this.dataDomeSfccStatusHeader = "x-sf-cc-x-dd-b"; // same header but for Salesforce Commerce Cloud
  this.eventNames = { // custom events dispatched on window (listened to if enableTagEvents=true)
    ready: "dd_ready",
    posting: "dd_post",
    posted: "dd_post_done",
    blocked: "dd_blocked",
    responseDisplayed: "dd_response_displayed",
    responseError: "dd_response_error",
    responsePassed: "dd_response_passed",
    responseUnload: "dd_response_unload",
    captchaDisplayed: "dd_captcha_displayed",
    captchaError: "dd_captcha_error",
    captchaPassed: "dd_captcha_passed"
  };
  this.internalEventNames = { // internal events, not exposed to the website
    replayRequest: "dd_replay_request"
  };
  this.ChallengeType = { // possible challenge types returned by getDataDomeChallengeType
    BLOCK: "block",
    HARD_BLOCK: "hard_block",
    DEVICE_CHECK: "device_check",
    DEVICE_CHECK_INVISIBLE_MODE: "device_check_invisible_mode"
  };
  this.responseFormats = { // used by getResponseTypeAndContent to tag the response
    html: "HTML",
    json: "JSON"
  };

  this.getCookie = function (cookieName, cookieString) {
    // if there is no cookie name, we use "datadome" by default
    if (cookieName == null) {
      cookieName = this.dataDomeCookieName;
    }

    // if there is no value, we use cookies of the navigator
    if (cookieString == null) {
      cookieString = document.cookie;
    }

    // regex to find "nameOfTheCookie=value"
    var match = new RegExp(cookieName + "=([^;]+)").exec(cookieString);

    // if we found, we decode encoded characters (%20 becomes a space)
    if (match != null) {
      return unescape(match[1]);
    } else {
      // cookie not found
      return null;
    }
  };


  // find all cookies matching a name (returns an array, unlike getCookie which returns only the first one)
  this.findCookiesByName = function (cookieName, cookieString) {
    var source = cookieString || document.cookie;
    var regex = new RegExp("(?:^|;\\s*)(" + cookieName + ")=([^;]+)", "gi");
    var results = [];
    var match;

    while (match = regex.exec(source)) {
      results.push({
        name: match[1],
        value: match[2]
      });
    }

    return results;
  };

  this.findDataDomeCookies = function (n) {
    return this.findCookiesByName(this.dataDomeCookieName, n);
  };

  this.setCookie = function (n) {
    try {
      document.cookie = n;
    } catch (n) { }
  };

  // replace the domain in a cookie string
  //"datadome=abc; Domain=.old.com; path=/"
  //                     ↓
  //"datadome=abc; Domain=.new.com; path=/"
  this.replaceCookieDomain = function (cookieString, newDomain) {
    try {
      cookieString = cookieString.replace(/Domain=.*?;/, "Domain=" + newDomain + ";");
    } catch (n) { }
    return cookieString;
  };

  // extract the domain from a cookie string: "...Domain=.example.com;..." => ".example.com"
  this.getCookieDomainFromCookie = function (cookieString) {
    var prefix = "Domain=";
    var start = cookieString.indexOf(prefix);
    if (start === -1) {
      return "";
    }

    var valueStart = start + prefix.length;
    var end = cookieString.indexOf(";", valueStart);
    if (end === -1) {
      end = cookieString.length;
    }

    return cookieString.substring(valueStart, end).trim();
  };

  // check if a cookie string has the "Partitioned" attribute (CHIPS - Chrome's third-party cookie partitioning)
  this.hasPartitionedAttribute = function (cookieString) {
    return !!cookieString && typeof cookieString == "string" && /;\s*Partitioned\s*(;|$)/i.test(cookieString);
  };


  // try to set the datadome cookie, testing different domain suffixes until one works
  // caches the working domain in sessionStorage for next time
  // why ? because on shop.fr.example.com the cookie can works on .example.com, .fr.example.com or shop.fr.example.com, it depends of the navigator and the website config
  this.setCookieWithFallback = function (cookieString) {
    var storageKey = "ddCookieCandidateDomain";
    var expectedValue = this.getCookie(this.dataDomeCookieName, cookieString);
    if (expectedValue === null) {
      return cookieString;
    }

    // try setting cookie on a given domain, return the result
    var tryDomain = function (domain) {
      var candidate = this.replaceCookieDomain(cookieString, domain);
      document.cookie = candidate;
      return {
        candidateCookie: candidate,
        actualValue: this.getCookie(this.dataDomeCookieName)
      };
    }.bind(this);

    // 1. try the cached domain from sessionStorage first
    if (this.isSessionStorageEnabled()) {
      var cachedDomain = window.sessionStorage.getItem(storageKey);
      if (cachedDomain) {
        var result = tryDomain(cachedDomain);
        if (result.actualValue === expectedValue) {
          return result.candidateCookie;
        }
      }
    }

    // 2. build candidate domains: "a.b.example.com" => [".example.com", ".b.example.com", ".a.b.example.com"]
    var parts = window.location.hostname.split(".");
    var candidates = [];
    for (var i = 2; i <= parts.length; i++) {
      candidates.push("." + parts.slice(-i).join("."));
    }
    if (candidates.length === 0) {
      candidates.push(window.location.hostname);
    }

    // 3. try each candidate domain
    for (var j = 0; j < candidates.length; j++) {
      var domain = candidates[j];
      var result = tryDomain(domain);
      if (result.actualValue === expectedValue) {
        // cache the working domain
        if (this.isSessionStorageEnabled()) {
          try {
            window.sessionStorage.setItem(storageKey, domain);
          } catch (e) { }
        }
        return result.candidateCookie;
      }
    }

    return cookieString;
  };

  // get the current datadome session ID
  // - if sessionByHeader mode => read from localStorage
  // - otherwise => read from the datadome cookie
  // - if nothing found => return ".keep" (first visit)
  this.getDDSession = function () {
    if (window.ddSbh && this.isLocalStorageEnabled()) {
      var stored = window.localStorage.getItem(window.dataDomeOptions.ddCookieSessionName);
      if (stored) {
        return stored;
      }
    }
    var cookie = this.getCookie(this.dataDomeCookieName, document.cookie);
    return cookie || this.emptyCookieDefaultValue;
  };

  // its the "reverse" of the getDDSession, it saves the session
  // saves the datadome session
  // - stores in localStorage if sessionByHeader mode
  // - writes the cookie with 1-year expiry on the root domain
  this.setDDSession = function (setCookieHeader) {
    try {
      var cookieValue = this.getCookie(this.dataDomeCookieName, setCookieHeader);
      var rootDomain = this.getRootDomain(window.location.origin ? window.location.origin : window.location.href);

      if (window.ddSbh && this.isLocalStorageEnabled()) {
        window.localStorage.setItem(window.dataDomeOptions.ddCookieSessionName, cookieValue);
      }

      var expires = "; expires=" + new Date(Date.now() + ONE_YEAR_MS).toGMTString();

      this.setCookieWithFallback("datadome=" + cookieValue + expires + "; path=/" + (rootDomain ? "; domain=" + rootDomain : ""));

    } catch (e) { }
  };

  // extract root domain from a URL: "https://shop.example.com:8080/path" => ".example.com"
  this.getRootDomain = function (url) {
    if (typeof url != "string") {
      return "";
    }
    var protocolSep = "://";
    var protocolEnd = url.indexOf(protocolSep);
    if (protocolEnd === -1) {
      return "";
    }
    var afterProtocol = url.substring(protocolEnd + protocolSep.length);
    var slashIndex = afterProtocol.indexOf("/");
    var host = slashIndex !== -1 ? afterProtocol.substring(0, slashIndex) : afterProtocol;
    var colonIndex = host.indexOf(":");
    if (colonIndex > -1) {
      host = host.slice(0, colonIndex);
    }
    var parts = host.split(".");
    if (parts.length >= 2) {
      return "." + parts.slice(-2).join(".");
    } else {
      return host;
    }
  };


  // dead code, checks for console but never actually logs anything
  this.debug = function (msg, level) {
    if (typeof console != "undefined" && console.log !== undefined) {
      window.dataDomeOptions.debug; // reads the value but does nothing with it
    }
  };


  // remove a captured group from a string using a regex pattern
  // used to clean sensitive data from referrer URLs (e.g. remove tokens/IDs)
  this.removeSubstringPattern = function (str, pattern) {
    if (pattern) {
      return str.replace(new RegExp(pattern), function (fullMatch, capturedGroup) {
        return fullMatch.replace(capturedGroup, "");
      });
    } else {
      return str;
    }
  };


  this.addEventListener = function (element, eventName, handler, useCapture) {
    if (element.addEventListener) {
      element.addEventListener(eventName, handler, useCapture);
    } else if (element.attachEvent !== undefined) { // IE8
      element.attachEvent("on" + eventName, handler);
    } else {
      element["on" + eventName] = handler;
    }
  };

  this.removeEventListener = function (element, eventName, handler, useCapture) {
    if (element.removeEventListener) {
      element.removeEventListener(eventName, handler, useCapture);
    } else if (element.detachEvent) { // IE8
      element.detachEvent("on" + eventName, handler);
    }
  };


  this.noscroll = function () {
    window.scrollTo(0, 0);
  };


  this.isSafariUA = function () { // excluse chrome and android (that also contains "safari" in their user agent) to just get the Safari navigator
    return !!window.navigator && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  };

  // dispatch a custom event on window with detail data
  this.dispatchEvent = function (eventName, detail) {
    var event;
    (detail = detail || {}).context = "tags";
    if (typeof window.CustomEvent == "function") {
      event = new CustomEvent(eventName, { detail: detail });
    } else {
      // IE fallback
      this.IECustomEvent ||= function (name, detail) {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(name, false, false, detail);
        return event;
      };
      event = new this.IECustomEvent(eventName, detail);
    }
    if (event) {
      window.dispatchEvent(event);
    }
  };

  this.isLocalStorageEnabled = function () {
    if (this.localStorageEnabled == null) {
      this.localStorageEnabled = function () {
        try {
          return !!window.localStorage;
        } catch (e) { // private browsing mode
          return false;
        }
      }();
    }
    return this.localStorageEnabled;
  };

  this.isSessionStorageEnabled = function () {
    if (this.sessionStorageEnabled == null) {
      this.sessionStorageEnabled = function () {
        try {
          return !!window.sessionStorage;
        } catch (e) { // private browsing mode
          return false;
        }
      }();
    }
    return this.sessionStorageEnabled;
  };

  // remove a cookie by setting its expiry to the past
  this.removeCookie = function (cookieName, options) {
    var parts = [];
    parts.push(cookieName + "=0");

    if (options && options.domain) {
      parts.push("Domain=" + options.domain);
    }
    if (options && options.path) {
      parts.push("Path=" + options.path);
    }
    if (options && options.partitioned) {
      parts.push("Partitioned");
    }
    parts.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");

    document.cookie = parts.join(";");

    return this.getCookie(cookieName) === null;
  };

  // delete all "datadome" cookies on the current host and root domain
  this.deleteAllDDCookies = function () {
    var cookies = document.cookie.split("; ");
    var host = document.location.host;
    var hostParts = host.split(".");
    var domains = [host, hostParts.slice(hostParts.length - 2).join(".")];

    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var eqIndex = cookie.indexOf("=");
      var name = eqIndex > -1 ? cookie.substr(0, eqIndex) : cookie;
      if (name === "datadome") {
        for (var j = 0; j < domains.length; j++) {
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=" + domains[j] + "; path=/";
        }
      }
    }
  };


  // parse a response body: if valid JSON => {type:"JSON", data:{...}}, otherwise => {type:"HTML", data:"..."}
  this.getResponseTypeAndContent = function (responseBody) {
    try {
      var parsed = JSON.parse(responseBody);
      return { type: this.responseFormats.json, data: parsed };
    } catch (e) {
      return { type: this.responseFormats.html, data: responseBody };
    }
  };



  // check if a header exists in either a raw header string or a Headers object
  this.hasHeader = function (headers, headerName) {
    if (typeof headers == "string") {
      var prefix = headerName + ": ";
      return headers.indexOf("\n" + prefix) > 0 || headers.indexOf(prefix) === 0;
    }
    return typeof headers == "object" && headers.constructor.name === "Headers" && headers.has(headerName);
  };


  // check if the response contains the datadome status header (x-dd-b or x-sf-cc-x-dd-b)
  this.checkDataDomeStatusHeader = function (headers) {
    return this.hasHeader(headers, this.dataDomeStatusHeader) || this.hasHeader(headers, this.dataDomeSfccStatusHeader);
  };

  // find a header value in a raw XHR getAllResponseHeaders() string
  this.findXHRHeaderValue = function (rawHeaders, headerName) {
    var lines = rawHeaders.trim().split(/[\r\n]+/);
    for (var i = 0; i < lines.length; i++) {
      var parts = lines[i].split(": ");
      if (parts[0].toLowerCase() === headerName.toLowerCase()) {
        return parts[1] || null;
      }
    }
    return null;
  };

  // decode HTML entities: "&amp;" => "&", "&#39;" => "'"
  this.decodeHTMLEntity = function (html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    if (doc) {
      return doc.documentElement.textContent;
    } else {
      return "";
    }
  };

  // extract the challenge type from the x-dd-b header value (bitmask)
  // bits 0-7: challenge type (1=block, 2=hard_block, 3=device_check)
  // bit 8: if set + type 3 => invisible mode device check
  this.getDataDomeChallengeType = function (headers) {
    var headerValue = null;
    if (typeof headers == "string") {
      headerValue = this.findXHRHeaderValue(headers, this.dataDomeStatusHeader) || this.findXHRHeaderValue(headers, this.dataDomeSfccStatusHeader);
    } else if (typeof headers == "object" && headers.constructor.name === "Headers") {
      headerValue = headers.get(this.dataDomeStatusHeader) || headers.get(this.dataDomeSfccStatusHeader);
    }
    if (!headerValue) {
      return null;
    }
    switch (headerValue & 255) {       // low 8 bits = challenge type
      case 1: return this.ChallengeType.BLOCK;
      case 2: return this.ChallengeType.HARD_BLOCK;
      case 3:
        if (Boolean(headerValue >> 8 & 1)) {  // bit 8 = invisible flag
          return this.ChallengeType.DEVICE_CHECK_INVISIBLE_MODE;
        } else {
          return this.ChallengeType.DEVICE_CHECK;
        }
      default: return this.ChallengeType.UNKNOWN;
    }
  };


  // CHIPS cleanup: if there are 2+ datadome cookies (partitioned + unpartitioned),
  // remove the unpartitioned one to avoid conflicts
  this.removeUnpartitionedCookieIfPartitionedOneIsPresent = function (domain) {
    if (!window.dataDomeUnpartitionedCookieCleanupExecuted) {
      var ddCookies = this.findDataDomeCookies();
      if (!(ddCookies.length < 2)) {
        this.removeCookie(ddCookies[0].name, {
          domain: domain || window.location.hostname,
          path: "/",
          partitioned: false
        });
        window.dataDomeUnpartitionedCookieCleanupExecuted = true;
      }
    }
  };

};