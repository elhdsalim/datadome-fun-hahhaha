module.exports = function () {
  this.endpoint = "https://api-js.datadome.co/js/";
  this.version = "5.2.0";
  this.ajaxListenerPath = null;
  this.ajaxListenerPathExclusion = null;
  this.customParam = null;
  this.exposeCaptchaFunction = false;
  this.abortAsyncOnChallengeDisplay = true;
  this.patternToRemoveFromReferrerUrl = null;
  this.eventsTrackingEnabled = true;
  this.overrideAbortFetch = true;
  this.ddResponsePage = "origin";
  this.isSalesforce = false;
  this.disableAutoRefreshOnCaptchaPassed = false;
  this.enableTagEvents = false;
  this.withCredentials = false;
  this.overrideCookieDomain = false;
  this.dryRun = [];
  this.sessionByHeader = false;
  this.ddCookieSessionName = "ddSession";
  this.enableServiceWorkerPlugin = false;
  this.deferSignals = false;
  this.replayAfterChallenge = false;
  this.enableCookieDomainFallback = false;
  this.challengeLanguage = null;
  this.check = function (n) {
    if (!n || typeof n != "object") {
      n = {};
    }
    if (n.ajaxListenerPath == null && window.ddCaptchaOptions == null) {
      n.ajaxListenerPath = true;
    }
    this.endpoint = function (n) {
      if (n) {
        return n;
      }
      var e = "https://api-js.datadome.co/js/";
      var t = "https://js.datadome.co/";
      var r = document && document.currentScript ? document.currentScript.src : t;
      if (r.indexOf("https://js.datadome.co/") === 0) {
        return e;
      }
      if (r.indexOf("/tags.js") !== -1) {
        return r.replace("/tags.js", "/js/");
      } else {
        return r;
      }
    }(n.endpoint);
    function e(n) {
      var e = null;
      var t = typeof n;
      if (t !== "undefined") {
        var r = n;
        if (t === "string") {
          e = [{
            url: r
          }];
        } else if (r === true) {
          e = [{
            url: document.location.host
          }];
        } else if (Array.isArray(r)) {
          if (r.length > 0) {
            e = [];
            for (var i = 0; i < r.length; ++i) {
              var c = r[i];
              var o = typeof c;
              if (o === "string") {
                e.push({
                  url: c
                });
              } else if (o === "object") {
                e.push(c);
              }
            }
          }
        } else if (t === "object") {
          e = [r];
        }
      }
      return e;
    }
    this.ajaxListenerPath = e(n.ajaxListenerPath);
    this.ajaxListenerPathExclusion = e(n.ajaxListenerPathExclusion);
    if (this.ajaxListenerPathExclusion == null) {
      this.ajaxListenerPathExclusion = [{
        url: "https://www.google-analytics.com"
      }];
    }
    if (n.sfcc != null) {
      this.isSalesforce = n.sfcc;
    }
    if (n.customParam != null) {
      this.customParam = n.customParam;
    }
    if (n.exposeCaptchaFunction != null) {
      this.exposeCaptchaFunction = n.exposeCaptchaFunction;
    }
    if (n.abortAsyncOnCaptchaDisplay != null) {
      this.abortAsyncOnChallengeDisplay = n.abortAsyncOnCaptchaDisplay;
    }
    if (n.abortAsyncOnChallengeDisplay != null) {
      this.abortAsyncOnChallengeDisplay = n.abortAsyncOnChallengeDisplay;
    }
    if (n.debug != null) {
      this.debug = n.debug;
    }
    if (n.testingMode != null) {
      this.testingMode = n.testingMode;
    }
    if (n.eventsTrackingEnabled != null) {
      this.eventsTrackingEnabled = n.eventsTrackingEnabled;
    }
    if (n.responsePage != null) {
      this.ddResponsePage = n.responsePage;
    }
    if (n.patternToRemoveFromReferrerUrl != null) {
      this.patternToRemoveFromReferrerUrl = n.patternToRemoveFromReferrerUrl;
    }
    if (n.overrideAbortFetch != null) {
      this.overrideAbortFetch = n.overrideAbortFetch;
    }
    if (n.disableAutoRefreshOnCaptchaPassed != null) {
      this.disableAutoRefreshOnCaptchaPassed = n.disableAutoRefreshOnCaptchaPassed;
    }
    if (n.enableTagEvents != null) {
      this.enableTagEvents = n.enableTagEvents;
    }
    if (n.withCredentials != null) {
      this.withCredentials = n.withCredentials;
    }
    if (n.overrideCookieDomain != null) {
      this.overrideCookieDomain = n.overrideCookieDomain;
    }
    if (n.dryRun != null) {
      this.dryRun = n.dryRun;
    }
    if (n.sessionByHeader != null) {
      this.sessionByHeader = n.sessionByHeader;
      window.ddSbh = n.sessionByHeader;
      if (n.cookieName != null && n.cookieName != "") {
        this.ddCookieSessionName = "ddSession_" + n.cookieName;
      }
    }
    if (n.enableServiceWorkerPlugin != null) {
      this.enableServiceWorkerPlugin = n.enableServiceWorkerPlugin;
    }
    if (n.deferSignals != null) {
      this.deferSignals = n.deferSignals;
    }
    if (n.replayAfterChallenge === true) {
      this.replayAfterChallenge = n.replayAfterChallenge;
      this.disableAutoRefreshOnCaptchaPassed = true;
    }
    if (typeof n.enableCookieDomainFallback == "boolean") {
      this.enableCookieDomainFallback = n.enableCookieDomainFallback;
    }
    if (typeof n.challengeLanguage == "string") {
      this.challengeLanguage = n.challengeLanguage;
    }
  };
};