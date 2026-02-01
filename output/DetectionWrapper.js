var r = require("./common/DataDomeTools");
module.exports = function (e) {
  var t;
  var i;
  var c;
  var o = true;
  setTimeout(function () {
    t = require("detection-js/dist/jstag");
  });
  setTimeout(function () {
    let n = {};
    if (e && Array.isArray(e) && e.indexOf(5) > -1) {
      n.dww = true;
    }
    i = t(n);
    c = i[2];
    o = false;
  });
  this.i = function (n, e) {
    function t() {
      try {
        (0, c[1])(n, e);
      } catch (n) {}
    }
    if (o) {
      setTimeout(t);
    } else {
      t();
    }
  };
  this.o = function (n) {
    return (0, c[2])(n);
  };
  this.u = function () {
    window.addEventListener("datadome-det-d", function () {
      (0, i[1])();
      setTimeout(function () {
        new r().dispatchEvent("datadome-jstag-ch");
      });
    }, {
      capture: true,
      once: true
    });
    (0, i[0])();
  };
};