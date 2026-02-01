/**
 * Step 1 : get all o(N) values
 */

var v = String.fromCharCode;

function z(n, e) {
  return (e & n) * 14 + (e & ~n) * 8 - e * 7 - ~(e & ~n) * 7 + ~(e | n) * 7 + ~(e | ~n) * 6;
}
function r(n, e) {
  return (e & ~n) * -1 + (e | ~n) * 2 + ~(e | ~n) * 3 - ~e * 2;
}
function i(n, e) {
  return (n & e) * 3 + (n ^ e) * 1 - ~(n ^ e) * 1 + ~(n | e) * 1;
}
function c(n, e) {
  return (e & n) * 3 - ~(e ^ n) * 2 + ~(e | n) * 3 + ~(e | ~n) * 2 - ~e * 1;
}
function f(n, e) {
  return (n & e) * 12 + (n & ~e) * 8 - n * 7 - e * 5 + ~(n | ~e) * 4;
}
function u(n, e) {
  return (n & e) * -1 + (n & ~e) * 6 + ~(n ^ e) * 2 + ~(n | e) * 3 - ~e * 5;
}
function h(n, e) {
  return (e & n) * 4 + (e & ~n) * 5 - (e ^ n) * 2 - (e | n) * 3 + ~(e | ~n) * 6;
}
function l(n, e) {
  return (n & e) * 2 - e * 2 + ~(n & ~e) * 1 - ~(n | e) * 1 + ~(n | ~e) * 2;
}
function w(n, e) {
  return (n & e) * -1 - (n & ~e) * 1 + e * 1 + ~(n & e) * 2 - ~(n | e) * 2 - ~(n | ~e) * 4;
}
function d(n, e) {
  return (n & e) * 14 + (n & ~e) * 13 - n * 1 - ~(n & ~n) * 11 + ~(n | e) * 11 + ~(n | ~e) * 12;
}

var b = ["Y2VpbA", "Yl9l", "YXBwbHk", "ZnVuY3Rpb24", "c2V0UHJvdG90eXBlT2Y", "dG9TdHJpbmc", "XHtccypcW25hdGl2ZSBjb2RlXF1ccypcfSQ", "Cg", "c3RhY2s", "dA", "am9pbg", "bw", "aQ", "ZGlzcGF0Y2hFdmVudA", "ZGV0YWls", "QXJyYXk", "dGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVk", "dGd2ag", "UmVmbGVjdA", "VHlwZUVycm9y", "ZG9uZQ", "dQ", "aXNBcnJheQ", "SW52YWxpZCBhdHRlbXB0IHRvIGl0ZXJhdGUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlLgpJbiBvcmRlciB0byBiZSBpdGVyYWJsZSwgbm9uLWFycmF5IG9iamVjdHMgbXVzdCBoYXZlIGEgW1N5bWJvbC5pdGVyYXRvcl0oKSBtZXRob2Qu", "X19wcm90b19" + v(102), "dGRvdg", "QXJndW1lbnRz", "dGVzdA", "aXNOYU4", "QmxvYg", "d3ds", "Z2x2ZA", "cA", "dHpw", "SW5uZXJFcnI6IA", "dGhlbg", "c2l6ZQ", "Y2F0Y2g", "ZW1k", "bWVkaWFEZXZpY2Vz", "cGlzZg", "a2luZA", "YXVkaW9vdXRwdXQ", "dmk", "ZGV2aWNlSWQ", "IGw6", "bGV2ZWw", "YmR0", "ZGlzY2hhcmdpbmdUaW1l", "Z2V0SGlnaEVudHJvcHlWYWx1ZXM", "bW9kZWw", "bW9iaWxl", "YWRkZWROb2Rlcw", "aWQ", "ZGlzY29ubmVjdA", "Y29ubmVjdEVuZA", "bnRfcmQ", "bnRfaXJ0", "cmVzcG9uc2VTdGFydA", "c2VjdXJlQ29ubmVjdGlvblN0YXJ0", "cmVzcG9uc" + v(50) + "VFbmQ", "ZGVj" + v(98) + "2RlZEJvZHlTa" + v(88) + "pl", "bnRfcmRj", "bnRfZXNj", "bnRfbGU", "bG9hZEV2ZW50RW5k", "ZG9tQ29tcGxldGU", "cGVyZm9ybWFuY2U", "bmF2aWdhdGlvbg", "IA", "Uw", "Xw", "ZW5hYmxlZFBsdWdpbg", "d2Jk", "bW9i", "ZHZt", "Y2Nj", "ZXZhbFxzYXRcc2V4ZWN1dGVTY3JpcHQ", "cXVlcnlTZWxlY3Rvcg", "c2VyaWFsaXplVG9TdHJpbmc", "YmdtYQ", "c2lxbg", "Y2NzVA", "UEk", "dmNodHM", "aW1tdg", "aXNUeXBlU3VwcG9ydGVk", "dmN3", "dmMz", "cGxwaA", "dnNsYQ", "V2ViS2l0TWVkaWFTb3VyY2U", "amNhYg", "dmNx", "dmNxdHM", "cmZybA", "ZWNwYw", "cHJvY2Vzcw", "dGtsYw", "Y29reXM", "ZWpxcA", "b3FncQ", "WE1MRG9jdW1lbnQ", "bWltZVR5cGVz", "dHlwZQ", "ZGl2", "c3R5bGU", "dHVybg", "c2V0UHJvcGVydHk", "aGVpZ2h0", "Y3NzUw", "Y3NzMA", "dWNkdg", "ZXN0aW1hdGU", "Z" + v(50) + v(86) + "0T3duUHJvcGVydHlOYW1lcw", "d2dsbw", "cHJzbw", "V2ViU29ja2V0U3RyZWFt", "cHNu", "UGVybWlzc2lvblN0YXR1cw", "ZWRw", "QXV" + v(z(367, 474)) + "aW9EYXRh", "TmF2aWdhdG9yVUFEYXRh", "SW50bA", "Y29udGFjdHM", "Q29udGFjdHNNYW5hZ2Vy", v(85) + "1ZHR" + v(71) + "lzY2FyZEVsZW1lbnQ", "dnBicQ", "YWViag", "Y2hiZw", "Zg", "ZGZmbHM", "YWN3dHM", "YWNtcA", "YXVkaW8vb2dnOyBjb2RlY3M9InZvcmJpcyI", "YXVkaW8vYWFjOw", "c3ZiZw", "YWNv", "cmRzbw", "YWNtcDN0cw", "YWNmdHM", "YnVmaA", "YWNtcHU", "cmFyYw", "bnJ1Yw", "YWNxdHRz", "Y29hcnNl", "dmFmZQ", "bWF0Y2hNZWRpYQ", "Og", "X19kcml2ZXJfZXZhbHVhdGU", "X193ZWJkcml2ZXJfdW53cmFwcGVk", "X19meGRyaXZlcl91bndyYXBwZWQ", "X19sY" + v(88) + "N0V" + v(50) + "F0aXJDb25maXJt", "d2ViZHJpdmVyLWV2YWx1YXRl", "c2xhdA", "d2luZG93", v(87) + "1xkXHddezh9" + v(76) + "VtcZFx3X" + v(88) + "s0fS1bXGRcd117NH0tW1xk" + v(88) + "Hdd" + v(101) + "zR9LVtcZFx3XXs" + v(120) + "Mn0", "cmVtb3ZlRXZlbnRMaXN0ZW5lcg", "Y2xlYXJJbnRlcnZhbA", "cmZucw", "YnJhdmU", "bGFuZ3VhZ2U", "dXNlckxhbmd1YWdl", "bWQ", "cGx0b2Q", "SWRsZURldGVjdG9y", "YXdl", "Y2FsbFBoYW50b20", "Z2Vi", "YnJfdw", "ZGV2aWNlUGl4ZWxSYXRpbw", v(98) + "3JpZW50YXRpb24", "c28", "bmlldA", "bmlk", "Kg", "IG9iamVjdCBjb3VsZCBub3QgYmUgY2xvbmVkLg", "a2xubw", "d2RpZnJt", "aXdnbA", "ZGV2aWNlTWVtb3J5", "TWltZVR5cGVBcnJheQ", "TWltZVR5cGU", "LXdlYmtpdC10b3VjaC1jYWxsb3V0", "LW1vei1vc3gtZm9udC1zbW9vdGhpbmc", "d2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1l", "Y2hyb21lLndlYnN0b3Jl", "U1ZHUGF0aFNlZ0xpc3Q", "VmlzdWFsVmlld3BvcnQucHJvdG90eXBlLnNlZ21lbnRz", "RGVwcmVjYXRpb25SZXBvcnRCb2R5", "U1ZHVGV4dFBvc2l0aW9uaW5nRWxlbWVudA", "WE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldA", "b25sb2FkZW5k", "U3R5bGVTaGVldA", "Ul" + v(82) + "DRH" + v(c(82, 110)) + "sc1RyYW5zcG9ydA", "U3RhdGljUmFuZ2U", "VmlkZW9TdHJlYW1UcmFjaw", "T2ZmbGluZVJlc291cmNlTGlzdA", "Q1NTMlByb3BlcnRpZXMucHJvdG90eXBlLk1vek9zeEZvbnRTbW9vdGhpbmc", "UHVzaFN1YnNjcmlwdGlvbk9wdGlvbnM", "UlRDVHJhY2tFdmVudA", "U1" + v(90) + "HR" + v(107) + "VEcm9wU2hhZ" + v(71) + "93RWxlbWVudA", "V29ya2VyTWVzc2FnZUV2ZW50", "Q1NTMlByb3BlcnRpZXMucHJvdG90eXBlLk1vek9TWEZvbnRTbW9vdGhpbmc", "Tm90aWZpY2F0aW9uLnByb3RvdHlwZS5pbWFnZQ", "Y29uc29sZS5jcmVhdGVUYXNr", "U2hhcmVkQXJyYXlCdWZmZXI", "UlRDUnRwVHJhbnNjZWl2ZXIucHJvdG90eXBlLnN0b3A", "RXZlbnRDb3VudHM", "Rm9udEZhY2VTZXQ", "TWVkaWFTb3VyY2VIYW5kbGU", "SFRNTFNsb3RFbGVtZW50", "VG9nZ2xlRXZlbnQ", "MzgyOWFlOTY0MmRmMGQ3OTFlNDFkMjE1OWRhMjhiZDE4ZDA1NmFmYWRmMWJkNzBmYzkyMjJhNDczZWFmNThlODYwZmY5NTBlN2JmMzViNjZlNGFhOTBiMTU2YzgwYzk2OTEzZGJkOWMyM2M3MjYyZTRhZGJjM2RkZDc3ZmYyNjM", "ZW10", "ZW1pdA", "b3V0ZXJXaWR0aA", "b3V0ZXJIZWlnaHQ", "RmlyZWJ1Zw", "aXNm", "X19wd0luaXRTY3JpcHRz", "X19wd1dlYlNvY2tldERpc3BhdGNo", "X19wbGF5d3JpZ2h0X19iaW5kaW5nX19jb250cm9sbGVyX18", "LS1hcmMtcGFsZXR0ZS10aXRsZQ", "X18", "Y3VoYg", "ZnBo", "TQ", "Y2RjX2Fkb1Fwb2FzbmZhNzZwZmNaTG1jZmxfQXJyYXk", "aWZyYW1l", "RmlyZWZveFwvKFxkKyk", "ZXhlYw", "VkVORE9S", "UkVOREVSRVI", "Z2V0RXh0ZW5zaW9u", "VU5NQVNLRURfVkVORE9SX1dFQkdM", "VU5NQVNLRURfUkVOREVSRVJfV0VCR0w", "Z2V0UGFyYW1ldGVy", "RGF0ZVRpbWVGb3JtYXQ", "ZHd3", "aGFzaA", "bG9nMg", "bXVyZw"];

var results = {};
var errors = {};

for (var idx = 0; idx < b.length; idx++) {
  try {
    var decoded = Buffer.from(b[idx], "base64").toString("utf8");
    results[idx] = decoded;
  } catch (e) {
    errors[idx] = { encoded: b[idx], error: e.message };
  }
}

var fs = require('fs');
fs.writeFileSync(
  __dirname + '/step1_o_values.json',
  JSON.stringify(results, null, 2)
);
console.log("\nJSON saved to scripts/step1_o_values.json");
