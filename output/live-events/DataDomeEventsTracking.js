var DataDomeRequest = require("../http/DataDomeRequest");
var DataDomeTools = require("../common/DataDomeTools");

// wrap a function in a try/catch that returns null on error
function safeCaller(fn) {
  return function () {
    try {
      return fn.apply(this, arguments);
    } catch (err) {
      return null;
    }
  };
}

// FNV-1a hash of event counters (mousemove, touchmove, scroll, click, keydown, keyup)
function computeUISignatureHash(counters) {
  return function (str) {
    var prime = 16777619;
    var hash = 2166136261;
    for (var i = 0; i < str.length; i++) {
      hash = (hash ^= str.charCodeAt(i)) * prime >>> 0;
    }
    return hash;
  }([Math.ceil(counters.mousemove / 10), Math.ceil(counters.touchmove / 10), counters.scroll, counters.click, counters.keydown > 0 ? 1 : 0, counters.keyup > 0 ? 1 : 0].join("_"));
}

// compute percentile value from a sorted array (e.g. 50 = median)
function percentile(arr, pct) {
  if (!arr || arr.length == 0) {
    return null;
  }
  var sorted = arr.sort(function (a, b) {
    return a - b;
  });
  var rank = (sorted.length - 1) * pct / 100;
  var lowerIndex = Math.floor(rank);
  if (sorted[lowerIndex + 1] !== undefined) {
    var fraction = rank - lowerIndex;
    return sorted[lowerIndex] + fraction * (sorted[lowerIndex + 1] - sorted[lowerIndex]);
  }
  return sorted[lowerIndex];
}

// compute angle in radians between two points
function computeAngle(x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  var angle = Math.acos(dx / Math.sqrt(dx * dx + dy * dy));
  if (dy < 0) {
    return -angle;
  } else {
    return angle;
  }
}

// arithmetic mean of an array
function mean(arr) {
  if (!arr || arr.length == 0) {
    return null;
  }
  var sum = 0;
  for (var i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum / arr.length;
}

// standard deviation of an array given a precomputed mean
function stddev(arr, avg) {
  if (!arr || arr.length == 0) {
    return null;
  }
  var sumSquares = 0;
  for (var i = 0; i < arr.length; i++) {
    var diff = avg - arr[i];
    sumSquares += Math.pow(diff, 2);
  }
  var variance = sumSquares / arr.length;
  return Math.sqrt(variance);
}

// orchestrates mouse and keyboard analyzers, validates events, dispatches to analyzers
function EventStats(wrapper) {
  this.keysAnalyzer = new KeysAnalyzer();
  this.mouseAnalyzer = new MouseAnalyzer();
  var firstMouseMoveSent = false;
  this._eventIsValid = function (event) {
    if (event.isTrusted && !event.repeat) {
      var now = performance.now();
      if (event.timeStamp > 0 && event.timeStamp > now - 5000 && event.timeStamp < now) {
        return true;
      }
    }
    return false;
  };
  this.handleEvent = function (event) {
    if (this._eventIsValid(event)) {
      switch (event.type) {
        case "mousemove":
          if (!firstMouseMoveSent) {
            firstMouseMoveSent = true;
            wrapper.i("m_fmi", event.pageY == event.screenY && event.pageX == event.screenX);
          }
          this.mouseAnalyzer._handleMouseMove(event);
          break;
        case "keydown":
        case "keyup":
          this.keysAnalyzer.recordKeyEvent(event);
      }
    }
  };
  this.buildAndStoreSignals = function () {
    try {
      var mouseSignals = this.mouseAnalyzer.computeSignals();
      var keySignals = this.keysAnalyzer.computeSignals();
      for (var key in mouseSignals) {
        wrapper.i(key, mouseSignals[key]);
      }
      for (var key2 in keySignals) {
        wrapper.i(key2, keySignals[key2]);
      }
    } catch (err) {}
  };
}

// analyzes mouse movement strokes: timestamps, distances, angles
function MouseAnalyzer() {
  this._lastMouseMoveEvent = null;
  this._currentStrokeEvents = [];
  this._sigmas = [];
  this._mus = [];
  this._dists = [];
  this._startAngles = [];
  this._endAngles = [];
  this._consumeStroke = function () {
    try {
      var count = this._currentStrokeEvents.length;
      if (count > 1) {
        var sumLog = 0;
        var sumLogSquared = 0;
        for (var i = 0; i < count; i++) {
          var logTs = Math.log(this._currentStrokeEvents[i].timeStamp);
          sumLog += logTs;
          sumLogSquared += logTs * logTs;
        }
        this._sigmas.push(Math.sqrt((count * sumLogSquared - sumLog * sumLog) / count * (count - 1)) / 1000);
        this._mus.push(sumLog / count);
        var firstEvent = this._currentStrokeEvents[0];
        var lastEvent = this._currentStrokeEvents[count - 1];
        this._dists.push((dx = firstEvent.clientX, dy = firstEvent.clientY, dx2 = lastEvent.clientX, dy2 = lastEvent.clientY, ddx = dx2 - dx, ddy = dy2 - dy, Math.sqrt(ddx * ddx + ddy * ddy)));
        var angleOffset = count < 4 ? count - 1 : 3;
        var nearStartEvent = this._currentStrokeEvents[angleOffset];
        var nearEndEvent = this._currentStrokeEvents[count - angleOffset - 1];
        var startAngle = computeAngle(firstEvent.clientX, firstEvent.clientY, nearStartEvent.clientX, nearStartEvent.clientY);
        var endAngle = computeAngle(lastEvent.clientX, lastEvent.clientY, nearEndEvent.clientX, nearEndEvent.clientY);
        this._startAngles.push(startAngle);
        this._endAngles.push(endAngle);
      }
      this._currentStrokeEvents = [];
    } catch (err) {}
    var dx;
    var dy;
    var dx2;
    var dy2;
    var ddx;
    var ddy;
  };
  this._handleMouseMove = function (event) {
    if (this._lastMouseMoveEvent) {
      if (event.timeStamp - this._lastMouseMoveEvent.timeStamp > 499) {
        this._consumeStroke();
      }
    }
    this._currentStrokeEvents.push(event);
    this._lastMouseMoveEvent = event;
  };
  this.computeSignals = function () {
    try {
      this._consumeStroke();
      return {
        es_sigmdn: safeCaller(percentile)(this._sigmas, 50),
        es_mumdn: safeCaller(percentile)(this._mus, 50),
        es_distmdn: safeCaller(percentile)(this._dists, 50),
        es_angsmdn: safeCaller(percentile)(this._startAngles, 50),
        es_angemdn: safeCaller(percentile)(this._endAngles, 50)
      };
    } catch (err) {
      return {};
    }
  };
}

// analyzes keyboard events: hold time, press-to-press, release-to-release, inter-key timing
function KeysAnalyzer() {
  this._keyEvents = [];
  this.keydowns = 0;
  this.keyups = 0;
  this.recordKeyEvent = function (event) {
    try {
      if (event && event instanceof KeyboardEvent && (event.type === "keydown" || event.type === "keyup")) {
        this._keyEvents.push({
          ts: event.timeStamp,
          key: event.key,
          type: event.type
        });
      }
    } catch (err) {}
  };
  this._getSequenceWindows = function (arr, windowSize) {
    var windows = [];
    for (var i = 0; i < arr.length - windowSize + 1; i++) {
      windows.push(arr.slice(i, i + windowSize));
    }
    return windows;
  };
  this.computeSignals = function () {
    try {
      var holdTimes = [];
      var pressToPress = [];
      var releaseToRelease = [];
      var interKeyTimes = [];
      var lastKeydown = null;
      var lastKeyup = null;
      var activeKeys = {};
      var keyPairs = [];
      var pairedIndices = new window.Set();
      for (var i = 0; i < this._keyEvents.length; i++) {
        var evt = this._keyEvents[i];
        if (evt.type === "keydown") {
          this.keydowns++;
          activeKeys[evt.key] = evt;
          if (lastKeydown) {
            pressToPress.push(evt.ts - lastKeydown.ts);
          }
          lastKeydown = evt;
        } else if (evt.type === "keyup") {
          this.keyups++;
          if (activeKeys[evt.key]) {
            var downEvt = activeKeys[evt.key];
            activeKeys[evt.key] = null;
            holdTimes.push(evt.ts - downEvt.ts);
          }
          if (lastKeyup) {
            releaseToRelease.push(evt.ts - lastKeyup.ts);
          }
          lastKeyup = evt;
        }
        if (!pairedIndices.has(i)) {
          for (var j = i + 1; j < this._keyEvents.length; j++) {
            var other = this._keyEvents[j];
            if (evt.key === other.key) {
              keyPairs.push([evt, other]);
              pairedIndices.add(i);
              pairedIndices.add(j);
              break;
            }
          }
        }
      }
      for (var pairWindows = this._getSequenceWindows(keyPairs, 2), k = 0; k < pairWindows.length; k++) {
        var firstPair = pairWindows[k][0];
        var secondPair = pairWindows[k][1];
        interKeyTimes.push(secondPair[0].ts - firstPair[1].ts);
      }
      var holdMean = safeCaller(mean)(holdTimes);
      var pressMean = safeCaller(mean)(pressToPress);
      var releaseMean = safeCaller(mean)(releaseToRelease);
      var interKeyMean = safeCaller(mean)(interKeyTimes);
      return {
        k_hA: holdMean,
        k_hSD: safeCaller(stddev)(holdTimes, holdMean),
        k_pA: pressMean,
        k_pSD: safeCaller(stddev)(pressToPress, pressMean),
        k_rA: releaseMean,
        k_rSD: safeCaller(stddev)(releaseToRelease, releaseMean),
        k_ikA: interKeyMean,
        k_ikSD: safeCaller(stddev)(interKeyTimes, interKeyMean),
        k_kdc: this.keydowns,
        k_kuc: this.keyups
      };
    } catch (err) {
      return {};
    }
  };
}
module.exports.EventStats = EventStats;
module.exports.DataDomeEventsTracking = function (wrapper, isFormMode) {
  var SEND_DELAY = 10000;
  var useCapture = true;
  var jsType = "le";
  if (isFormMode) {
    jsType = "fm";
  }
  var rafId;
  var request = new DataDomeRequest(jsType);
  var tools = new DataDomeTools();
  var eventStats = new EventStats(wrapper);
  var hasSent = false;
  var sendTimer = null;
  var isAnimationFrameFired = false;
  var hasCollected = false;
  var EVENT_TYPES = ["mousemove", "click", "scroll", "touchstart", "touchend", "touchmove", "keydown", "keyup"];
  var eventCounters = function () {
    var counters = {};
    for (var i = 0; i < EVENT_TYPES.length; i++) {
      counters[EVENT_TYPES[i]] = 0;
    }
    return counters;
  }();
  function onEvent(event) {
    hasSent = true;
    if (!isFormMode) {
      (function () {
        if (sendTimer != null || !isAnimationFrameFired) {
          return;
        }
        sendTimer = setTimeout(function () {
          sendData(true);
        }, SEND_DELAY);
      })();
    }
    eventCounters[event.type]++;
    eventStats.handleEvent(event);
  }
  function sendData(needsResponse) {
    if (!hasCollected && hasSent && window.dataDomeOptions) {
      hasCollected = true;
      eventStats.buildAndStoreSignals();
      wrapper.i("m_s_c", eventCounters.scroll);
      wrapper.i("m_m_c", eventCounters.mousemove);
      wrapper.i("m_c_c", eventCounters.click);
      wrapper.i("m_cm_r", eventCounters.mousemove === 0 ? -1 : eventCounters.click / eventCounters.mousemove);
      wrapper.i("m_ms_r", eventCounters.scroll === 0 ? -1 : eventCounters.mousemove / eventCounters.scroll);
      try {
        var hash = computeUISignatureHash(eventCounters);
        wrapper.i("uish", String(hash));
      } catch (err) {}
      request.requestApi(window.ddjskey, wrapper, eventCounters, window.dataDomeOptions.patternToRemoveFromReferrerUrl, needsResponse, window.dataDomeOptions.ddResponsePage);
      (function () {
        for (var i = 0; i < EVENT_TYPES.length; i++) {
          tools.removeEventListener(document, EVENT_TYPES[i], onEvent, useCapture);
        }
      })();
    }
  }
  this.process = function () {
    (function () {
      for (var i = 0; i < EVENT_TYPES.length; i++) {
        tools.addEventListener(document, EVENT_TYPES[i], onEvent, useCapture);
      }
    })();
    rafId = window.requestAnimationFrame(function (timestamp) {
      isAnimationFrameFired = true;
    });
    if (!isFormMode) {
      tools.addEventListener(window, "onpagehide" in window ? "pagehide" : "beforeunload", function () {
        clearTimeout(sendTimer);
        window.cancelAnimationFrame(rafId);
        sendData(false);
      });
    }
  };
  this.collect = function () {
    sendData(true);
  };
};
module.exports.nech = computeUISignatureHash;
