/**
 * This is not part of the detection system, it configures the behavior of other modules of the tag (network, listeners, events, captcha, cookies…)
 */

module.exports = function () {
  // === default values ===
  this.endpoint = "https://api-js.datadome.co/js/"; // endpoint where the tag sends fingerprint signals
  this.version = "5.2.0"; // latest version of tags.js
  this.ajaxListenerPath = null; // paths/urls to watch => if true, datadome watches all requests to the current domain
  this.ajaxListenerPathExclusion = null; // urls to exclude from the watch
  this.customParam = null; // custom parameter to send with each datadome request
  this.exposeCaptchaFunction = false; // if true => exposes window.displayDataDomeCaptchaPage() to manually show the captcha
  this.abortAsyncOnChallengeDisplay = true; // if true => cancel async requests when a challenge is displayed
  this.patternToRemoveFromReferrerUrl = null; // regex to clean the referrer url
  this.eventsTrackingEnabled = true; // enable user events (mouse movements, mouse clicks...etc...)
  this.overrideAbortFetch = true; // removes AbortSignal from intercepted fetch requests so datadome can show the challenge
  this.ddResponsePage = "origin"; // where the challenge page comes from ("origin"/"datadome")
  this.isSalesforce = false; // special mode for Salesforce Commerce Cloud (uses x-sf-cc-x-dd-b header instead of x-dd-b)
  this.disableAutoRefreshOnCaptchaPassed = false; // if true, doesn't refresh automatically after the captcha resolution
  this.enableTagEvents = false; // enable custom events (to listen to datadome actions like dd_ready, dd_blocked, dd_captcha_passed...)
  this.withCredentials = false; // if true => include cookies in cors
  this.overrideCookieDomain = false; // lets you define a custom domain for the datadome cookie
  this.dryRun = []; // array of module IDs to disable (1=sync, 2=async, 3=events, 4=async challenges, 5=detection flag)
  this.sessionByHeader = false; // if true, transmits the session via http header instead of cookie
  this.ddCookieSessionName = "ddSession"; // name of the datadome session cookie
  this.enableServiceWorkerPlugin = false;  // enable service worker
  this.deferSignals = false; // if true, waits for window.load before launching modules
  this.replayAfterChallenge = false; // if true, automatically replays the blocked request after challenge resolution
  this.enableCookieDomainFallback = false;  // if true, use an alternative cookie domain if the main one fails 
  this.challengeLanguage = null; // force language for the captcha (fr,en...)

  // merge user options (window.ddoptions) onto the defaults
  this.check = function (userOptions) {
    if (!userOptions || typeof userOptions != "object") {
      userOptions = {};
    }
    if (userOptions.ajaxListenerPath == null && window.ddCaptchaOptions == null) {
      userOptions.ajaxListenerPath = true;
    }

    // get api endpoint from script url or the user config
    this.endpoint = resolveEndpoint(userOptions.endpoint);

    // normalize paths into [{url: ...}]
    this.ajaxListenerPath = normalizePath(userOptions.ajaxListenerPath);
    this.ajaxListenerPathExclusion = normalizePath(userOptions.ajaxListenerPathExclusion);
    if (this.ajaxListenerPathExclusion == null) {
      this.ajaxListenerPathExclusion = [{ url: "https://www.google-analytics.com" }];
    }

    // copy user options -> defaults
    if (userOptions.sfcc != null) this.isSalesforce = userOptions.sfcc;
    if (userOptions.customParam != null) this.customParam = userOptions.customParam;
    if (userOptions.exposeCaptchaFunction != null) this.exposeCaptchaFunction = userOptions.exposeCaptchaFunction;
    if (userOptions.abortAsyncOnCaptchaDisplay != null) this.abortAsyncOnChallengeDisplay = userOptions.abortAsyncOnCaptchaDisplay;
    if (userOptions.abortAsyncOnChallengeDisplay != null) this.abortAsyncOnChallengeDisplay = userOptions.abortAsyncOnChallengeDisplay;
    if (userOptions.debug != null) this.debug = userOptions.debug;
    if (userOptions.testingMode != null) this.testingMode = userOptions.testingMode;
    if (userOptions.eventsTrackingEnabled != null) this.eventsTrackingEnabled = userOptions.eventsTrackingEnabled;
    if (userOptions.responsePage != null) this.ddResponsePage = userOptions.responsePage;
    if (userOptions.patternToRemoveFromReferrerUrl != null) this.patternToRemoveFromReferrerUrl = userOptions.patternToRemoveFromReferrerUrl;
    if (userOptions.overrideAbortFetch != null) this.overrideAbortFetch = userOptions.overrideAbortFetch;
    if (userOptions.disableAutoRefreshOnCaptchaPassed != null) this.disableAutoRefreshOnCaptchaPassed = userOptions.disableAutoRefreshOnCaptchaPassed;
    if (userOptions.enableTagEvents != null) this.enableTagEvents = userOptions.enableTagEvents;
    if (userOptions.withCredentials != null) this.withCredentials = userOptions.withCredentials;
    if (userOptions.overrideCookieDomain != null) this.overrideCookieDomain = userOptions.overrideCookieDomain;
    if (userOptions.dryRun != null) this.dryRun = userOptions.dryRun;
    if (userOptions.sessionByHeader != null) {
      this.sessionByHeader = userOptions.sessionByHeader;
      window.ddSbh = userOptions.sessionByHeader;
      if (userOptions.cookieName != null && userOptions.cookieName != "") {
        this.ddCookieSessionName = "ddSession_" + userOptions.cookieName;
      }
    }
    if (userOptions.enableServiceWorkerPlugin != null) this.enableServiceWorkerPlugin = userOptions.enableServiceWorkerPlugin;
    if (userOptions.deferSignals != null) this.deferSignals = userOptions.deferSignals;
    if (userOptions.replayAfterChallenge === true) {
      this.replayAfterChallenge = userOptions.replayAfterChallenge;
      this.disableAutoRefreshOnCaptchaPassed = true;
    }
    if (typeof userOptions.enableCookieDomainFallback == "boolean") this.enableCookieDomainFallback = userOptions.enableCookieDomainFallback;
    if (typeof userOptions.challengeLanguage == "string") this.challengeLanguage = userOptions.challengeLanguage;
  };
};

// get API endpoint from the datadome script url
// - if user set a custom endpoint => returns it
// - if loaded from https://js.datadome.co/tags.js => returns https://api-js.datadome.co/js/
// - if self-hosted like https://mysite.com/datadome/tags.js => returns https://mysite.com/datadome/js/
// - otherwise => returns the script url as-is
function resolveEndpoint(userEndpoint) {
  if (userEndpoint) return userEndpoint;
  
  var defaultApi = "https://api-js.datadome.co/js/";
  var defaultCdn = "https://js.datadome.co/";
  var scriptSrc = document && document.currentScript ? document.currentScript.src : defaultCdn;

  if (scriptSrc.indexOf(defaultCdn) === 0) return defaultApi;
  if (scriptSrc.indexOf("/tags.js") !== -1) return scriptSrc.replace("/tags.js", "/js/");
  
  return scriptSrc;
}

// normalize into [{url: ...}] :
// "example.com"  -> [{url: "example.com"}]
// true           -> [{url: document.location.host}]
// [{url:..}]     -> [{url:..}]
// {url:..}       -> [{url:..}]
function normalizePath(value) {
    if (typeof value === "undefined") return null;
    if (typeof value === "string") return [{ url: value }];
    if (value === true) return [{ url: document.location.host }];

    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      var result = [];

      for (var i = 0; i < value.length; i++) {
        var item = value[i];
        if (typeof item === "string") result.push({ url: item });
        else if (typeof item === "object") result.push(item);
      }

      return result;
    }

    if (typeof value === "object") return [value];

    return null;
}