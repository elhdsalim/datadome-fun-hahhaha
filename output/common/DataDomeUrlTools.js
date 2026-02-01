var WILDCARD = "*";
var DOUBLE_SLASH = "//";
var SLASH = "/";
var QUESTION_MARK = "?";
var HASH = "#";

var s = {
  // check if a string matches a pattern (supports wildcard *)
  matchesPattern: function (str, pattern) {
    return !!pattern && !!str && (pattern.indexOf(WILDCARD) > -1 ? this.wildcardMatch(str, pattern) : str.indexOf(pattern) > -1);
  },
  // "api.*.com" matches "api.example.com" — splits on * and checks each part appears in order
  wildcardMatch: function (str, pattern) {
    var parts = pattern.split("*");
    var searchFrom = 0;
    for (var i = 0; i < parts.length; i++) {
      var segment = parts[i];
      if (segment !== "") {
        var index = str.indexOf(segment, searchFrom);
        if (index === -1) {
          return false;
        }
        searchFrom = index + segment.length;
      }
    }
    return true;
  },
  // strict mode: ALL specified fields (url, host, path, query, fragment) must match
  urlStrictlyMatchesPattern: function (fullUrl, parsedParts, patternConfig) {
    var self = this;
    return Object.keys(patternConfig).filter(function (key) {
      return key !== "strict";
    }).every(function (key) {
      switch (key) {
        case "url":
          return self.matchesPattern(fullUrl, patternConfig[key]);
        case "host":
        case "fragment":
        case "path":
        case "query":
          return self.matchesPattern(parsedParts[key], patternConfig[key]);
        default:
          return false;
      }
    });
  },

  // parse a URL into parts (host, path, query, fragment) and match against a pattern config
  matchURLParts: function (patternConfig, url) {
    if (typeof url != "string") {
      return false;
    }
    // simple mode: just match the full URL string
    if (patternConfig.host == null && patternConfig.path == null && patternConfig.query == null && patternConfig.fragment == null) {
      return patternConfig.url != null && this.matchesPattern(url, patternConfig.url);
    }

    // parse the URL into parts
    var afterProtocol;
    var parts = { host: "", path: "", query: "", fragment: "" };
    var doubleSlashIndex = url.indexOf(DOUBLE_SLASH);

    if (url.indexOf("://") > -1 || doubleSlashIndex === 0) {
      afterProtocol = url.slice(doubleSlashIndex + DOUBLE_SLASH.length);
      var slashIndex = afterProtocol.indexOf(SLASH);
      parts.host = afterProtocol.slice(0, slashIndex > -1 ? slashIndex : undefined);
    } else {
      afterProtocol = url;
      parts.host = document.location.host;
    }

    var pathStart = afterProtocol.indexOf(SLASH);
    var queryStart = afterProtocol.indexOf(QUESTION_MARK);
    var hashStart = afterProtocol.indexOf(HASH);
    var pathFrom = pathStart > -1 ? pathStart : 0;

    if (queryStart > -1) {
      parts.path ||= afterProtocol.slice(pathFrom, queryStart);
      parts.query = afterProtocol.slice(queryStart, hashStart > -1 ? hashStart : undefined);
    }
    if (hashStart > -1) {
      parts.path ||= afterProtocol.slice(pathFrom, hashStart);
      parts.fragment = afterProtocol.slice(hashStart);
    }
    parts.path ||= afterProtocol.slice(pathFrom);

    if (patternConfig.strict) {
      return this.urlStrictlyMatchesPattern(url, parts, patternConfig);
    } else {
      // non-strict: ANY field matching is enough
      return this.matchesPattern(parts.host, patternConfig.host) || this.matchesPattern(parts.path, patternConfig.path) || this.matchesPattern(parts.query, patternConfig.query) || this.matchesPattern(parts.fragment, patternConfig.fragment) || this.matchesPattern(url, patternConfig.url);
    }
  },
  // main entry point: check if a URL matches the inclusion list but NOT the exclusion list
  matchURLConfig: function (url, inclusionPatterns, exclusionPatterns) {
    if (url == null) {
      return false;
    }
    // check exclusions first
    if (Array.isArray(exclusionPatterns)) {
      for (var i = 0; i < exclusionPatterns.length; ++i) {
        if (this.matchURLParts(exclusionPatterns[i], url)) {
          return false;
        }
      }
    }
    // then check inclusions
    if (Array.isArray(inclusionPatterns)) {
      for (var j = 0; j < inclusionPatterns.length; ++j) {
        if (this.matchURLParts(inclusionPatterns[j], url)) {
          return true;
        }
      }
    }
    return false;
  },

  isAbsoluteUrl: function (n) {
    return typeof n == "string" && (n.indexOf("://") !== -1 || n.indexOf("//") === 0);
  },
  // check if a URL belongs to datadome's own domains
  hasDatadomeDomain: function (url) {
    if (!this.isAbsoluteUrl(url)) {
      return false;
    }
    var hostPart = url.split("/")[2]; // "https://example.com:8080/path" => "example.com:8080"
    var rootDomain = hostPart.split(":")[0].split("?")[0].split("#")[0].split(".").slice(-2).join(".");
    var datadomeDomains = ["datado.me", "captcha-delivery.com"];
    for (var i = 0; i < datadomeDomains.length; i++) {
      if (rootDomain === datadomeDomains[i]) {
        return true;
      }
    }
    return false;
  },


  getHostname: function (n) {
    var e = "https://";
    if (typeof n != "string" || n.indexOf(e) !== 0) {
      return "";
    } else {
      return n.replace(e, "").split("/")[0];
    }
  },
  // check if a URL is a first-party DataDome endpoint (ddc.example.com where example.com is the current site)
  isFpOrigin: function (url) {
    var urlHostname = this.getHostname(url);
    var pageHostname = this.getHostname(window.location.href);
    if (!urlHostname || !pageHostname) {
      return false;
    }
    // compare domain parts from right to left
    var urlParts = urlHostname.split(".").reverse();
    var pageParts = pageHostname.split(".").reverse();
    var matchCount = 0;
    for (var i = 0; i < pageParts.length && urlParts[i] === pageParts[i]; ++i) {
      ++matchCount;
    }
    // must share at least 2 labels (domain.tld) and the next label in the URL must be "ddc"
    return matchCount >= 2 && urlParts[matchCount] === "ddc";
  },
  isTrustedOrigin: function (n) {
    return this.hasDatadomeDomain(n) || this.isFpOrigin(n);
  },

  // extract the URL string from a Request object, URL object, or plain string
  getRequestURL: function (input) {
    var isRequest = false;
    var isURL = false;
    if (window.URL && typeof window.URL == "function") {
      isURL = input instanceof URL;
    }
    if (window.Request && typeof window.Request == "function") {
      isRequest = input instanceof Request;
    }
    if (isRequest) {
      return input.url;
    } else if (isURL) {
      return input.href;
    } else {
      return input;
    }
  },

};


module.exports = s;