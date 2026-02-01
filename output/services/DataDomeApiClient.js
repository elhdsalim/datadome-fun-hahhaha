var DataDomeAnalyzer = require("../fingerprint/DataDomeAnalyzer.js");
var DataDomeRequest = require("../http/DataDomeRequest.js");
var DataDomeResponse = require("../http/DataDomeResponse.js");
var DataDomeTools = require("../common/DataDomeTools.js");
var MAX_ARRAYBUFFER_DECODE = 2048;
var fetchReplayInProgress = false;
var xhrReplayInProgress = false;
module.exports = function (wrapper) {
  var DD_CLIENT_ID_HEADER = "x-datadome-clientid";
  var SET_COOKIE_HEADER = "x-set-cookie";
  var SF_SET_COOKIE_HEADER = "x-sf-cc-x-set-cookie";
  var tools = new DataDomeTools();

  // sync mode: run fingerprint analyzer, then send data on detection complete
  this.processSyncRequest = function () {
    var analyzer = new DataDomeAnalyzer(wrapper);
    var hasSent = false;
    window.addEventListener("datadome-jstag-ch", function () {
      if (!hasSent) {
        hasSent = true;
        var request = new DataDomeRequest("ch");
        if (window.dataDomeOptions) {
          request.requestApi(window.ddjskey, wrapper, [], window.dataDomeOptions.patternToRemoveFromReferrerUrl, true, window.dataDomeOptions.ddResponsePage);
        }
      }
    }, {
      capture: true,
      once: true
    });
    analyzer.process();
  };

  // async mode: monkey-patch XHR and fetch to intercept responses and inject challenges
  this.processAsyncRequests = function (inclusionPatterns, exclusionPatterns, shouldAbort, shouldDisplay, isSalesforce) {
    var DataDomeUrlTools = require("../common/DataDomeUrlTools.js");
    var self = this;
    if (window.XMLHttpRequest) {
      var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

      // patch setRequestHeader to save original headers for replay
      if (window.dataDomeOptions.replayAfterChallenge) {
        XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
          this._datadome = this._datadome || {};
          this._datadome.originalRequestHeaders ||= [];
          if (!xhrReplayInProgress && header !== DD_CLIENT_ID_HEADER) {
            this._datadome.originalRequestHeaders.push({
              header: header,
              value: value
            });
          }
          originalSetRequestHeader.call(this, header, value);
        };

        // patch send to save original args for replay
        var originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function () {
          this._datadome = this._datadome || {};
          this._datadome.originalSendArgs = Array.prototype.slice.call(arguments);
          originalSend.apply(this, arguments);
        };
      }

      // patch open to intercept responses and inject session header
      var originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function () {
        this._datadome = this._datadome || {};
        this._datadome.originalOpenArgs = Array.prototype.slice.call(arguments);
        var replayEnabled = window.dataDomeOptions.replayAfterChallenge;
        if (this.addEventListener !== undefined) {

          // if replay enabled, intercept at HEADERS_RECEIVED to save onload before challenge
          if (replayEnabled) {
            this.addEventListener("readystatechange", function (event) {
              var xhr = event.currentTarget;
              if (xhr.readyState === 2 && typeof xhr.onload == "function") {
                var matchesFilter = self.filterAsyncResponse(xhr.responseURL, inclusionPatterns, exclusionPatterns, isSalesforce);
                var responseHeaders = xhr.getAllResponseHeaders();
                var challengeType = tools.getDataDomeChallengeType(responseHeaders);
                if (matchesFilter && challengeType != null) {
                  xhr._datadome.onload = xhr.onload;
                  xhr.onload = null;
                }
              }
            });
          }

          // on load: check for challenge in response, handle session cookies, replay if needed
          this.addEventListener("load", function (loadEvent) {
            var xhr = loadEvent.currentTarget;
            var responseHeaders = xhr.getAllResponseHeaders();
            tools.getCookie("datadome");
            if (xhr.responseType === "text" || xhr.responseType === "" || xhr.responseType === "json" || xhr.responseType === "blob" || xhr.responseType === "arraybuffer") {
              var matchesFilter = self.filterAsyncResponse(xhr.responseURL, inclusionPatterns, exclusionPatterns, isSalesforce);

              // handle session-by-header cookie extraction
              if (matchesFilter) {
                if (window.ddSbh) {
                  var setCookieValue = tools.findXHRHeaderValue(responseHeaders, SF_SET_COOKIE_HEADER) || tools.findXHRHeaderValue(responseHeaders, SET_COOKIE_HEADER);
                  if (window.ddSbh && setCookieValue != null) {
                    tools.setDDSession(setCookieValue);
                  }
                  if (setCookieValue && tools.hasPartitionedAttribute(setCookieValue)) {
                    var cookieDomain = tools.getCookieDomainFromCookie(setCookieValue);
                    if (cookieDomain) {
                      tools.removeUnpartitionedCookieIfPartitionedOneIsPresent(cookieDomain);
                    }
                  }
                } else {
                  tools.removeUnpartitionedCookieIfPartitionedOneIsPresent();
                }
              }

              var challengeType = tools.getDataDomeChallengeType(responseHeaders);
              if (challengeType || matchesFilter) {
                var responsePage = new DataDomeResponse(wrapper);

                // process the response body based on responseType
                function processBody(body) {
                  if (responsePage.process(body, shouldAbort, shouldDisplay, xhr, isSalesforce, xhr.responseURL, challengeType) && !xhrReplayInProgress && replayEnabled && xhr._datadome.originalRequestHeaders && xhr._datadome.originalSendArgs && xhr._datadome.originalOpenArgs) {
                    if (typeof xhr.onloadend == "function") {
                      xhr._datadome.onloadend = xhr.onloadend;
                      xhr.onloadend = null;
                    }
                    xhrReplayInProgress = true;

                    // replay the original request after challenge is passed
                    window.addEventListener(tools.internalEventNames.replayRequest, function replayHandler() {
                      xhr.abort();
                      loadEvent.stopImmediatePropagation();
                      loadEvent.preventDefault();
                      xhr.open.apply(xhr, xhr._datadome.originalOpenArgs);
                      if (xhr._datadome.originalRequestHeaders) {
                        xhr._datadome.originalRequestHeaders.forEach(function (entry) {
                          xhr.setRequestHeader(entry.header, entry.value);
                        });
                      }
                      if (window.ddSbh) {
                        xhr.setRequestHeader(DD_CLIENT_ID_HEADER, tools.getDDSession());
                      }
                      if (typeof xhr._datadome.onload == "function") {
                        xhr.onload = xhr._datadome.onload;
                      }
                      if (typeof xhr._datadome.onloadend == "function") {
                        xhr.onloadend = xhr._datadome.onloadend;
                      }
                      xhr.send.apply(xhr, xhr._datadome.originalSendArgs);
                      window.removeEventListener(tools.internalEventNames.replayRequest, replayHandler);
                      xhrReplayInProgress = false;
                    });
                  }
                }
                switch (xhr.responseType) {
                  case "blob":
                    if (typeof FileReader != "undefined") {
                      var reader = new FileReader();
                      reader.onload = function (readerEvent) {
                        if (typeof readerEvent.target.result == "string") {
                          processBody(readerEvent.target.result);
                        }
                      };
                      reader.readAsText(xhr.response);
                    }
                    break;
                  case "json":
                    processBody(xhr.response);
                    break;
                  case "text":
                  case "":
                    processBody(xhr.responseText);
                    break;
                  case "arraybuffer":
                    if (window.TextDecoder && xhr.response.byteLength <= MAX_ARRAYBUFFER_DECODE) {
                      var decoded = new TextDecoder("utf-8").decode(xhr.response);
                      processBody(decoded);
                    }
                }
              }
            }
          });
        }

        // call original open, then inject session header if needed
        var openArgs = arguments.length ? Array.prototype.slice.call(arguments) : [];
        if (originalOpen) {
          originalOpen.apply(this, openArgs);
        }
        try {
          if (openArgs.length > 1 && openArgs[1] && (!DataDomeUrlTools.isAbsoluteUrl(openArgs[1]) || self.filterAsyncResponse(openArgs[1], inclusionPatterns, exclusionPatterns, isSalesforce)) && (window.dataDomeOptions.withCredentials && (this.withCredentials = true), window.ddSbh)) {
            var session = tools.getDDSession();
            if (!this._dd_hook) {
              this.setRequestHeader(DD_CLIENT_ID_HEADER, session);
              this._dd_hook = true;
            }
          }
        } catch (err) {}
      };
    }

    // proxy Request constructor to strip AbortSignal from matching requests
    var overrideAbortFetch = window.dataDomeOptions.overrideAbortFetch;
    var hasRequest = window.Request && typeof window.Request == "function";
    var hasProxy = window.Proxy && typeof window.Proxy == "function";
    var hasReflect = window.Reflect && typeof window.Reflect.construct == "function";
    if (overrideAbortFetch && hasRequest && hasProxy && hasReflect) {
      window.Request = new Proxy(window.Request, {
        construct: function (Target, args, newTarget) {
          if (args.length > 1) {
            var requestUrl = DataDomeUrlTools.getRequestURL(args[0]);
            if (self.filterAsyncResponse(requestUrl, inclusionPatterns, exclusionPatterns, isSalesforce) && args[1] != null && args[1].signal) {
              try {
                delete args[1].signal;
              } catch (err) {}
            }
            return new Target(args[0], args[1]);
          }
          return Reflect.construct(Target, args);
        }
      });
    }

    // patch fetch to intercept responses and inject session header
    if (window.fetch) {
      var originalFetch = window.fetch;
      window.fetch = function () {
        var clonedRequest;
        var fetchArgs = arguments.length ? Array.prototype.slice.call(arguments) : [];
        var requestUrl = DataDomeUrlTools.getRequestURL(fetchArgs[0]);

        // strip AbortSignal from matching requests if overrideAbortFetch
        if (overrideAbortFetch && fetchArgs.length > 1 && fetchArgs[1] && fetchArgs[1].signal !== undefined && typeof fetchArgs[0] == "string" && (!DataDomeUrlTools.isAbsoluteUrl(requestUrl) || self.filterAsyncResponse(requestUrl, inclusionPatterns, exclusionPatterns, isSalesforce))) {
          try {
            delete fetchArgs[1].signal;
          } catch (err) {}
        }

        // inject credentials and session header for matching requests
        if (window.dataDomeOptions.withCredentials || window.ddSbh) {
          var fetchUrl;
          if (typeof fetchArgs[0] == "string") {
            fetchUrl = fetchArgs[0];
          } else if (typeof fetchArgs[0] == "object") {
            if (typeof fetchArgs[0].url == "string") {
              fetchUrl = fetchArgs[0].url;
            } else if (typeof fetchArgs[0].href == "string") {
              fetchUrl = fetchArgs[0].href;
            }
          }
          var matchesFilter = false;
          try {
            matchesFilter = self.filterAsyncResponse(fetchUrl, inclusionPatterns, exclusionPatterns, isSalesforce);
          } catch (err) {}
          if (typeof fetchUrl == "string" && (!DataDomeUrlTools.isAbsoluteUrl(fetchUrl) || matchesFilter)) {

            // set credentials: "include" for matching requests
            if (window.dataDomeOptions.withCredentials) {
              if (typeof fetchArgs[0] == "object" && typeof fetchArgs[0].url == "string") {
                fetchArgs[0].credentials = "include";
              } else if (fetchArgs.length >= 1) {
                if (fetchArgs[1] == null) {
                  var argsCopy = [];
                  for (var idx = 0; idx < fetchArgs.length; ++idx) {
                    argsCopy[idx] = fetchArgs[idx];
                  }
                  (fetchArgs = argsCopy)[1] = {};
                }
                fetchArgs[1].credentials = "include";
              }
            }

            // inject x-datadome-clientid header for session-by-header mode
            if (window.ddSbh) {
              var session = tools.getDDSession();
              var hasHeadersApi = typeof Headers == "function" && typeof Headers.prototype.set == "function";
              if (typeof fetchArgs[0] == "object" && typeof fetchArgs[0].url == "string") {
                if (!fetchArgs[0].headers) {
                  if (hasHeadersApi) {
                    fetchArgs[0].headers = new Headers();
                  }
                }
                if (fetchArgs[0].headers) {
                  fetchArgs[0].headers.set(DD_CLIENT_ID_HEADER, session);
                }
              } else if (fetchArgs.length >= 1) {
                if (fetchArgs[1] == null) {
                  var argsCopy2 = [];
                  for (var idx2 = 0; idx2 < fetchArgs.length; ++idx2) {
                    argsCopy2[idx2] = fetchArgs[idx2];
                  }
                  (fetchArgs = argsCopy2)[1] = {};
                }
                if (fetchArgs[1].headers == null) {
                  fetchArgs[1].headers = {};
                }
                if (hasHeadersApi && fetchArgs[1].headers.constructor === Headers) {
                  fetchArgs[1].headers.set(DD_CLIENT_ID_HEADER, session);
                } else if (Array.isArray(fetchArgs[1].headers)) {
                  fetchArgs[1].headers.push([DD_CLIENT_ID_HEADER, session]);
                } else {
                  fetchArgs[1].headers[DD_CLIENT_ID_HEADER] = session;
                }
              }
            }
          }
        }

        // clone Request for potential replay
        if (window.dataDomeOptions.replayAfterChallenge && fetchArgs[0] instanceof Request) {
          try {
            clonedRequest = fetchArgs[0].clone();
          } catch (err) {}
        }

        var fetchPromise;
        var isWindowContext;
        var fetchError;
        var MAX_ERROR_LEN = 250;

        // client-specific: force window context for fetch (key: 1F633CDD...)
        if (window.ddjskey === "1F633CDD8EF22541BD6D9B1B8EF13A") {
          try {
            isWindowContext = this === window;
            fetchPromise = originalFetch.apply(window, fetchArgs);
          } catch (err) {
            fetchError = typeof err.message == "string" ? err.message.slice(0, MAX_ERROR_LEN) : "errorfetch";
          }
        } else {
          try {
            fetchPromise = originalFetch.apply(this, fetchArgs);
          } catch (err) {
            fetchError = typeof err.message == "string" ? err.message.slice(0, MAX_ERROR_LEN) : "errorfetch";
          }
        }
        wrapper.i("nowd", isWindowContext);
        wrapper.i("sfex", fetchError);

        // trust token or non-thenable: return as-is
        if (fetchArgs.length > 1 && fetchArgs[1] && fetchArgs[1].trustToken || fetchPromise.then === undefined) {
          return fetchPromise;
        } else {
          // wrap the fetch promise to intercept challenge responses
          return new Promise(function (resolve, reject) {
            fetchPromise.then(function (response) {

              // handle session-by-header cookie extraction from fetch response
              if (window.ddSbh) {
                var setCookieValue = response.headers.get(SF_SET_COOKIE_HEADER) || response.headers.get(SET_COOKIE_HEADER);
                if (setCookieValue != null && window.ddSbh) {
                  try {
                    tools.setDDSession(setCookieValue);
                  } catch (err) {}
                }
                if (setCookieValue && tools.hasPartitionedAttribute(setCookieValue)) {
                  var cookieDomain = tools.getCookieDomainFromCookie(setCookieValue);
                  if (cookieDomain) {
                    tools.removeUnpartitionedCookieIfPartitionedOneIsPresent(cookieDomain);
                  }
                }
              } else {
                tools.removeUnpartitionedCookieIfPartitionedOneIsPresent();
              }
              if (response.ok) {
                resolve(response);
              } else {
                // non-ok response: check for challenge
                response.clone().text().then(function (bodyText) {
                  var headers = response.headers;
                  var challengeType = tools.getDataDomeChallengeType(headers);
                  var matchesFilter = self.filterAsyncResponse(response.url, inclusionPatterns, exclusionPatterns, isSalesforce);
                  if (challengeType || matchesFilter) {
                    var challengeDetected = new DataDomeResponse(wrapper).process(bodyText, shouldAbort, shouldDisplay, null, isSalesforce, response.url, challengeType);
                    var replayEnabled = window.dataDomeOptions.replayAfterChallenge;
                    if (challengeDetected && !fetchReplayInProgress && replayEnabled) {
                      function cleanupReplay() {
                        fetchReplayInProgress = false;
                        window.removeEventListener(tools.internalEventNames.replayRequest, onReplay);
                      }
                      function onReplay() {
                        if (fetchArgs[0] instanceof Request && clonedRequest) {
                          fetchArgs[0] = clonedRequest;
                        }
                        window.fetch.apply(window, fetchArgs).then(function (replayResponse) {
                          cleanupReplay();
                          resolve(replayResponse);
                        }).catch(function (replayError) {
                          cleanupReplay();
                          reject();
                        });
                      }
                      fetchReplayInProgress = true;
                      window.addEventListener(tools.internalEventNames.replayRequest, onReplay);
                    } else {
                      resolve(response);
                    }
                  } else {
                    resolve(response);
                  }
                }).catch(function (err) {
                  reject();
                });
              }
            }).catch(function (err) {
              reject(err);
            });
          });
        }
      };
    }
  };

  // check if a URL should be intercepted (matches inclusion/exclusion config)
  this.filterAsyncResponse = function (url, inclusionPatterns, exclusionPatterns, isSalesforce) {
    if (url == null) {
      return true;
    }
    if (url === window.dataDomeOptions.endpoint) {
      return false;
    }
    if (isSalesforce) {
      var suffix = "DDUser-Challenge";
      var urlWithoutQuery = url.replace(/\?.*/, "");
      return urlWithoutQuery.slice(urlWithoutQuery.length - suffix.length) === suffix;
    }
    return !!inclusionPatterns && inclusionPatterns.length === 0 || require("../common/DataDomeUrlTools.js").matchURLConfig(url, inclusionPatterns, exclusionPatterns);
  };
};
