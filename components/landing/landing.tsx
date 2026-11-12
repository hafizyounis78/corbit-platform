// @ts-nocheck
"use client";
/* eslint-disable */
// GENERATED from the approved landing design (project/WhatsBit.dc.html): this is the design's own
// script (scene flow, demos, hero canvas, assistant), kept as written. Live-site differences are
// applied by the generator: plan buttons go to signup, and the contact widget opens Corbit's real
// browser-call page / WhatsApp instead of the design's simulated call and chat.
import { Component } from "react";
import { LandingView } from "./landing-view";
import "./landing.css";

var CALL_URL = "https://ai.corbit.sa/call";
var WA_URL = "https://wa.me/966920006900";

var W2N = 12;
/* hero conversation (customer's phone view) */
var W2_HM = [
  { k: 'me', t: 'السلام عليكم، أبي أطلب من التشكيلة الجديدة', tm: '10:40', d: 1300 },
  { k: 'typ', d: 1100 },
  { k: 'bz', t: 'أهلاً بك! جهّزنا طلبك، وهذا رابط الدفع:', tm: '10:40', d: 650 },
  { k: 'pay', d: 2100 },
  { k: 'me', t: 'تم الدفع، شكراً', tm: '10:41', d: 1100 },
  { k: 'typ', d: 1000 },
  { k: 'ord', d: 1100 },
  { k: 'sys', t: 'تأكيد تلقائي من متجرك', d: 4800 }
];
var W2_ORD = 6;
var W2_BD = { me: 950, typ: 1050, bz: 850, menu: 1500, ord: 1300, book: 1300, sys: 1200 };
var W2_AQ = [
  { chip: 'متى يوصل طلبي؟', q: 'السلام عليكم، متى يوصل طلبي؟', keys: ['متى', 'يوصل', 'طلبي'], intent: 'تتبّع طلب', act: 'رد فوري برابط التتبع', a: 'وعليكم السلام! طلبك في الطريق ويصلك اليوم، وأرسلت لك رابط التتبع.', sys: '' },
  { chip: 'أبي أكلم موظف', q: 'أبي أكلم موظف بخصوص الفاتورة', keys: ['أكلم', 'موظف', 'الفاتورة'], intent: 'طلب موظف · الفواتير', act: 'تحويل لموظف مع ملخص', a: 'أبشر، حوّلتك لقسم الفواتير مع ملخص طلبك.', sys: 'حُوّلت المحادثة إلى قسم الفواتير · مع الملخص' },
  { chip: 'التوصيل لينبع', q: 'هل التوصيل متاح لمدينة ينبع؟', keys: ['التوصيل', 'ينبع'], intent: 'استفسار عن التوصيل', act: 'رد فوري من بيانات شركتك', a: 'نعم، نوصل لينبع خلال يومين عمل.', sys: '' }
];
var W2_AD = [800, 1400, 1200, 1100, 900];
var W2_LV = [{ v: '250', l: 'حساب جديد', h: 16 }, { v: '2,000', l: 'المستوى 1', h: 34 }, { v: '10,000', l: 'المستوى 2', h: 52 }, { v: '100,000', l: 'المستوى 3', h: 74 }, { v: 'غير محدود', l: 'المستوى 4', h: 96 }];
var W2_COL = ['#28A745', '#FF8A1C', '#FF2D8F'];
/* small phones around the hero phone, offsets in design px from its centre (scaled with the phone) */
var W2_OFF = [[-236, -256], [-272, -118], [-290, 18], [-268, 152], [-222, 282], [-120, -340], [-128, 350], [228, -250], [262, -110], [276, 30], [252, 168], [206, 296], [124, -346], [118, 356], [-396, -196], [-410, -48], [-402, 104], [-372, 252], [372, -182], [392, -32], [384, 118]];

function w2Item(m, vis, pick) {
  var k = m.k, cls = 'm ';
  if (k === 'me' || k === 'bz') cls += 'b ' + k; else if (k === 'sys') cls += 'sys'; else if (k === 'typ') cls += 'typ'; else cls += 'card';
  if (vis) cls += ' on';
  var mb = [];
  if (k === 'menu') mb = ['طلب جديد', 'حجز موعد', 'تتبّع طلب'].map(function (t, j) { return { t: t, cls: 'mb' + (pick === j ? ' pk' : '') }; });
  return { cls: cls, txt: k === 'me' || k === 'bz' || k === 'sys', t: m.t || '', tm: m.tm || '', hasTm: !!m.tm, typ: k === 'typ', pay: k === 'pay', ord: k === 'ord', book: k === 'book', menu: k === 'menu', mb: mb };
}
function w2Odo(str, on) {
  var out = [];
  for (var i = 0; i < str.length; i++) {
    var ch = str.charAt(i);
    if (ch >= '0' && ch <= '9') out.push({ dg: true, sp: false, cls: 'strip v' + (on ? ch : '0'), ch: '' });
    else out.push({ dg: false, sp: true, cls: '', ch: ch });
  }
  return out;
}
function w2RR(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
function w2Q(a, b, c, t) { var u = 1 - t; return u * u * a + 2 * u * t * b + t * t * c; }
function w2E(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

export class Landing extends Component<any, any> {
  constructor(props) {
    super(props);
    this.state = { mob: false, sec: null, sw: '', hs: 0, ch: 0, chT: false, ibN: 0, ibHA: -1, ibHit: 0, cv: 0, cvT: false, asg: [1, 0, 2, 1], bMenu: true, bKind: 0, bHand: true, bs: 0, bRun: 0, aq: 0, aqT: false, ap: 0, use: 0, ucHold: false, ucK: 0, vs: 0, vT: false, lv: 0, lvT: false, odo: false, pOdo: false, cs: 0, yr: false, pki: 0, faq: 0, menu: false, cxOpen: false, cxNeed: null, cxOpt: null, cxTy: 0, cxTease: false, cxSeen: false, clOpen: false, clMode: 'call', chStep: 'form', chName: '', chMsg: '', chErr: '', chList: [], chTyping: false, chJoined: false, chDraft: '', clDept: 'support', clPh: '', clErr: '', clSent: false, clCode: '', clOk: false, clCd: 0, clStep: 'form', clT: 0, clMute: false, clCallErr: '', clFrom: '' };
    this.lastMove = 0; this.seen = -1; this.sig = ''; this.swp = 0;
  }
  /* ---------- continuous scroll: the page scrolls freely and the scroll itself drives each scene change ---------- */
  flowInit() {
    var self = this;
    try {
      this.stageEl = document.querySelector('.w2 .stage');
      this.runEl = this.stageEl ? this.stageEl.querySelector('.runway') : null;
      this.progEl = document.querySelector('.w2 .sprog i');
      this.scenes = this.stageEl ? [].slice.call(this.stageEl.querySelectorAll('.scene')) : [];
    } catch (e) { this.scenes = []; }
    if (!this.stageEl || !this.scenes.length) return;
    if (!this._navTo) this._navTo = this.navTo;
    this.navTo = function (n) { self.goTo(n); };
    this.move = function (d) { self.goTo(self.cur() + d); };
    this.flowMeasure();
    var s0 = this.cur();
    if (s0 > 0 && this.F) this.stageEl.scrollTop = this.F.S[s0];
    this.scrubNow();
    this.onFlowRs = function () { if (self.flowDead) return; self.flowMeasure(); self.scrubNow(); };
    try { window.addEventListener('resize', this.onFlowRs); } catch (e) {}
    this.fmT = [300, 1200, 3500].map(function (t) { return setTimeout(function () { if (self.onFlowRs) self.onFlowRs(); }, t); });
  }
  goTo(n) {
    var F = this.F, st = this.stageEl;
    if (!F || !st) { if (this._navTo) this._navTo(n); return; }
    n = Math.max(0, Math.min(this.scenes.length - 1, n));
    try { st.scrollTo({ top: F.S[n], behavior: this.reduce ? 'auto' : 'smooth' }); } catch (e) { st.scrollTop = F.S[n]; }
  }
  flowMeasure() {
    var st = this.stageEl;
    if (!st) return;
    var stacked = false;
    try { stacked = window.matchMedia('(orientation:portrait), (max-width:859px), (max-height:559px) and (max-width:1199px)').matches; } catch (e) {}
    var vh = st.clientHeight || 1, n = this.scenes.length, S = [], y = 0, k;
    if (stacked) {
      // phones: sections are stacked cards; a tall card scrolls until its end, then sticks while the next one slides over it
      for (k = 0; k < n; k++) {
        var sc = this.scenes[k], h = sc.offsetHeight, stk = Math.min(0, vh - h) + 'px';
        S.push(y); y += h;
        if (sc._stk !== stk) { sc._stk = stk; sc.style.setProperty('--stk', stk); }
      }
      this.F = { mob: true, vh: vh, S: S, total: Math.max(1, st.scrollHeight - vh) };
      return;
    }
    for (k = 0; k < n; k++) { S.push(y); if (k < n - 1) y += vh; }
    this.F = { mob: false, vh: vh, T: vh, S: S, total: y };
    var sig = y + '|' + vh;
    if (this.runEl && this.runSig !== sig) { this.runSig = sig; this.runEl.style.height = y + 'px'; }
  }
  flowSoon() {
    var self = this;
    if (this.fsT || !this.stageEl) return;
    this.fsT = setTimeout(function () { self.fsT = 0; if (!self.flowDead) { self.flowMeasure(); self.scrubNow(); } }, 250);
  }
  scrub() {
    var self = this;
    if (this.scrRaf) return;
    this.scrRaf = requestAnimationFrame(function () { self.scrRaf = 0; if (!self.flowDead) self.scrubNow(); });
  }
  scrubNow() {
    var F = this.F, st = this.stageEl;
    if (!F || !st) return;
    var y = st.scrollTop, N = this.scenes.length, k = 0, c0 = this.cur(), act = c0;
    if (F.mob) {
      var tail = Math.max(0, Math.min(1, (y - (F.total - F.vh)) / F.vh)), probe = y + F.vh * (0.45 + 0.54 * tail);
      while (k < N - 1 && probe >= F.S[k + 1]) k++;
      act = k;
      for (var j = 0; j < N; j++) {
        var cov = j < N - 1 ? Math.max(0, Math.min(1, 1 - (F.S[j + 1] - y) / F.vh)) : 0, ok = cov > 0 ? (1 - 0.5 * cov).toFixed(3) : '';
        if (this.scenes[j]._mo !== ok) { this.scenes[j]._mo = ok; this.scenes[j].style.opacity = ok; }
      }
    } else {
      while (k < N - 1 && y >= F.S[k + 1]) k++;
      var fr = k < N - 1 ? Math.max(0, Math.min(1, (y - F.S[k]) / F.T)) : 0;
      if (this.reduce) fr = fr < 0.5 ? 0 : 1;
      for (var i = 0; i < N; i++) {
        var s = this.scenes[i], vis = false, a = 0, b = 0;
        if (i === k) { vis = fr < 1; a = 1; b = fr; }
        else if (i === k + 1 && fr > 0) { vis = true; a = fr; }
        var key = vis ? a.toFixed(4) + '|' + b.toFixed(4) : 'h';
        if (s._fk === key) continue;
        s._fk = key;
        s.style.visibility = vis ? 'visible' : 'hidden';
        if ('stack' === 'stack') {
          // the next section rises over the current one like a card; the current one sinks back and dims
          var inc = i === k + 1 && a < 1;
          s.style.transform = inc ? 'translate3d(0,' + ((1 - a) * 100).toFixed(3) + '%,0)' : (b > 0 ? 'translate3d(0,' + (-b * 8).toFixed(3) + '%,0)' : '');
          s.style.opacity = b > 0 ? (1 - 0.6 * b).toFixed(4) : '';
          s.style.borderRadius = inc ? '28px 28px 0 0' : '';
          s.style.boxShadow = inc ? '0 -24px 60px rgba(13,40,77,.16)' : '';
        } else {
          // the current section fades away completely before the next one fades in, so texts never overlap
          var o = i === k + 1 ? Math.max(0, Math.min(1, (a - 0.5) / 0.4)) : Math.max(0, 1 - b / 0.4);
          s.style.opacity = (i === k + 1 || b > 0) ? o.toFixed(4) : '';
        }
      }
      if ('stack' === 'stack') {
        if (c0 === k) { if (fr > 0.9) act = k + 1; }
        else if (c0 === k + 1) { if (fr < 0.1) act = k; }
        else act = fr > 0.5 ? k + 1 : k;
      } else act = fr >= 0.45 ? k + 1 : k;
    }
    if (act !== c0 && this._navTo) this._navTo(act);
    if (this.progEl) this.progEl.style.transform = 'scaleX(' + (F.total ? Math.min(1, y / F.total) : 0).toFixed(4) + ')';
  }

  componentDidMount() {
    var __fl = this; setTimeout(function () { if (!__fl.flowDead) __fl.flowInit(); }, 0);
    var self = this;
    this.cxT = setTimeout(function () { if (!self.state.cxSeen && !self.state.cxOpen) self.setState({ cxTease: true }); }, 15000);
    this.onRs = function () { var m = false; try { m = window.matchMedia('(orientation:portrait), (max-width:859px), (max-height:559px) and (max-width:1199px)').matches; } catch (e) { m = window.innerWidth <= 1000; } if (m !== self.state.mob) self.setState({ mob: m }); };
    try { window.addEventListener('resize', this.onRs); } catch (e) {}
    this.onRs();
    this.reduce = false;
    try { this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    this.onVis = function () { self.syncLoops(); self.sig = ''; self.sched(); };
    try { document.addEventListener('visibilitychange', this.onVis); } catch (e) {}
    this.enter(); this.syncLoops(); this.sched();
  }
  componentDidUpdate() {
    if (this.flowSoon) this.flowSoon(); this.enter(); this.syncLoops(); this.sched(); this.cxWatch(); }
  componentWillUnmount() {
    this.flowDead = true; if (this.onFlowRs) { try { window.removeEventListener('resize', this.onFlowRs); } catch (e) {} } (this.fmT || []).forEach(function (t) { clearTimeout(t); }); if (this.fsT) clearTimeout(this.fsT); if (this.setT) clearTimeout(this.setT); if (this.scrRaf) cancelAnimationFrame(this.scrRaf);
    this.dead = true;
    if (this.clCdT) clearInterval(this.clCdT); if (this.clTm1) clearTimeout(this.clTm1); if (this.clTm2) clearTimeout(this.clTm2); if (this.clTick) clearInterval(this.clTick);
    if (this.chTm1) clearTimeout(this.chTm1); if (this.chTm2) clearTimeout(this.chTm2); if (this.chTm3) clearTimeout(this.chTm3);
    if (this.cxT) clearTimeout(this.cxT); if (this.cxTT) clearTimeout(this.cxTT);
    if (this.bT) clearTimeout(this.bT); if (this.odoT) clearTimeout(this.odoT); if (this.mvRaf) cancelAnimationFrame(this.mvRaf);
    try { window.removeEventListener('resize', this.onRs); } catch (e) {}
    try { document.removeEventListener('visibilitychange', this.onVis); } catch (e) {}
    this.stopHero();
  }
  render() { return <LandingView vm={this.renderVals()} />; }
  cur() { var s = this.state.sec; if (s === null) s = this.props.startSection || 0; return Math.max(0, Math.min(W2N - 1, s)); }
  navTo(n) {
    n = Math.max(0, Math.min(W2N - 1, n)); var c = this.cur(); if (n === c) return;
    this.lastMove = Date.now(); this.swp = this.swp ^ 1;
    this.setState({ sec: n, sw: (n > c ? 'dn' : 'up') + this.swp });
  }
  move(d) { var now = Date.now(); if (now - this.lastMove < 1150) return; this.navTo(this.cur() + d); }
  cxWatch() {
    var st = this.state;
    if (st.cxSeen || st.cxOpen || st.cxTease) return;
    if (this.cur() === 9) this.setState({ cxTease: true });
  }
  /* scene entry: restart the scene's demo from its first beat */
  enter() {
    var s = this.cur();
    if (s === this.seen) return;
    this.seen = s;
    var st = this.state, up = {}, self = this;
    if (s === 0 && st.hs !== 0) up.hs = 0;
    if (s === 1 && !st.chT && st.ch !== 0) up.ch = 0;
    if (s === 2 && st.ibN !== 0) { up.ibN = 0; up.ibHA = -1; if (!st.cvT) up.cv = 0; }
    if (s === 3 && st.bs !== 0) up.bs = 0;
    if (s === 4 && st.ap !== 0) up.ap = 0;
    if (s === 6 && !st.vT && st.vs !== 0) up.vs = 0;
    if (s === 7 && !st.lvT && st.lv !== 0) up.lv = 0;
    if (s === 8 && st.odo) up.odo = false;
    if (s === 9 && st.pOdo) up.pOdo = false;
    if (s === 11 && st.cs !== 0) up.cs = 0;
    if (s === 5) { up.ucK = (st.ucK || 0) + 1; if (st.ucHold) up.ucHold = false; }
    if (this.odoT) { clearTimeout(this.odoT); this.odoT = null; }
    if (s === 8 || s === 9) this.odoT = setTimeout(function () { self.odoT = null; if (self.dead) return; var c = self.cur(); if (c === 8) self.setState({ odo: true }); if (c === 9) self.setState({ pOdo: true }); }, this.reduce ? 0 : 520);
    if (Object.keys(up).length) this.setState(up);
  }
  botScript() {
    var st = this.state, k = st.bKind, S = [];
    S.push({ k: 'me', t: 'السلام عليكم', tm: '09:30', n: 0 });
    S.push({ k: 'typ', n: 0 });
    S.push({ k: 'bz', t: 'وعليكم السلام، أهلاً بك في متجر النخبة! كيف نقدر نخدمك؟', tm: '09:30', n: 0 });
    if (st.bMenu) { S.push({ k: 'menu', n: 1 }); S.push({ k: 'me', t: k ? 'حجز موعد' : 'طلب جديد', tm: '09:31', n: 1 }); }
    else S.push({ k: 'me', t: k ? 'أبي أحجز موعد' : 'أبي أطلب', tm: '09:31', n: 2 });
    S.push({ k: 'typ', n: 2 });
    S.push({ k: k ? 'book' : 'ord', n: 2 });
    if (st.bHand) {
      S.push({ k: 'me', t: 'أبي أكلم موظف', tm: '09:32', n: 3 });
      S.push({ k: 'typ', n: 3 });
      S.push({ k: 'bz', t: 'أبشر، حوّلتك لموظف مع ملخص المحادثة.', tm: '09:32', n: 3 });
      S.push({ k: 'sys', t: k ? 'انضمت سارة من فريق الدعم · مع الملخص' : 'انضم فهد من فريق المبيعات · مع الملخص', n: 3 });
    }
    return S;
  }
  aiMax() { return W2_AQ[this.state.aq].sys ? 5 : 4; }
  /* one timer drives the active scene's demo, re-armed whenever its beat changes */
  sched() {
    var s = this.cur(), st = this.state, self = this, hid = false;
    try { hid = !!document.hidden; } catch (e) {}
    var sig = [s, st.hs, st.ch, st.chT ? 1 : 0, st.ibN, st.bs, st.bRun, st.ap, st.aq, st.aqT ? 1 : 0, st.use, st.ucHold ? 1 : 0, st.ucK, st.vs, st.vT ? 1 : 0, st.lv, st.lvT ? 1 : 0, st.cs, hid ? 1 : 0].join('|');
    if (sig === this.sig) return;
    this.sig = sig;
    if (this.bT) { clearTimeout(this.bT); this.bT = null; }
    if (this.reduce || hid) return;
    var at = function (ms, fn) { self.bT = setTimeout(function () { self.bT = null; if (!self.dead && self.cur() === s) fn(); }, ms); };
    if (s === 0) {
      var n = W2_HM.length;
      if (st.hs < n) at(st.hs === 0 ? 650 : W2_HM[st.hs - 1].d, function () { self.setState({ hs: self.state.hs + 1 }); });
      else if (st.hs === n) at(W2_HM[n - 1].d, function () { self.setState({ hs: n + 1 }); });
      else at(650, function () { self.setState({ hs: 0 }); });
    }
    if (s === 1 && !st.chT && st.ch === 0) at(2600, function () { self.setState({ ch: 1 }); });
    if (s === 2 && st.ibN < 4) at(st.ibN === 0 ? 700 : 1500, function () {
      var o = [3, 2, 1, 0], k = self.state.ibN, i = o[k], up = { ibN: k + 1, ibHA: self.state.asg[i], ibHit: self.state.ibHit + 1 };
      if (!self.state.cvT) up.cv = i;
      self.setState(up);
    });
    if (s === 3) { var S = this.botScript(); if (st.bs < S.length) at(st.bs === 0 ? 600 : (W2_BD[S[st.bs - 1].k] || 900), function () { self.setState({ bs: self.state.bs + 1 }); }); }
    if (s === 4) { var mx = this.aiMax(); if (st.ap < mx) at(W2_AD[st.ap], function () { self.setState({ ap: self.state.ap + 1 }); }); else if (!st.aqT) at(5600, function () { self.setState({ aq: (self.state.aq + 1) % W2_AQ.length, ap: 0 }); }); }
    if (s === 5 && !st.ucHold) at(6500, function () { self.setState({ use: (self.state.use + 1) % 4, ucK: self.state.ucK + 1 }); });
    if (s === 6 && !st.vT && st.vs < 4) at(st.vs === 0 ? 900 : 1150, function () { self.setState({ vs: self.state.vs + 1 }); });
    if (s === 7 && !st.lvT && st.lv < 4) at(st.lv === 0 ? 700 : 1000, function () { self.setState({ lv: self.state.lv + 1 }); });
    if (s === 11 && st.cs < 4) at(st.cs === 0 ? 900 : 800, function () { self.setState({ cs: self.state.cs + 1 }); });
  }
  syncLoops() {
    var s = this.cur(), hid = false;
    try { hid = !!document.hidden; } catch (e) {}
    if (s === 0 && !hid) this.startHero(); else this.stopHero();
  }
  stopHero() { var E = this.H; if (!E) return; E.run = false; if (E.raf) { cancelAnimationFrame(E.raf); E.raf = 0; } }
  dprFor(cv) {
    var dpr = window.devicePixelRatio || 1;
    try { var stg = cv.closest('.stage'); if (stg && stg.offsetWidth) { var zr = stg.getBoundingClientRect().width / stg.offsetWidth; if (zr > 0.2 && zr < 5) dpr = dpr * zr; } } catch (e) {}
    return Math.min(3, Math.round(dpr * 100) / 100);
  }

  /* ---------- hero canvas: one phone broadcasting bubbles out to many ---------- */
  startHero() {
    var E = this.H || (this.H = {});
    if (E.run) return;
    var cv = null; try { cv = document.querySelector('.w2 canvas.hcv'); } catch (e) {}
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var self = this;
    if (E.cv !== cv) { E.cv = cv; E.ctx = ctx; E.W = 0; E.ph = null; }
    E.parts = []; E.rings = []; E.last = 0; E.prev = 0; E.hs = this.state.hs; E.wave0 = -1;
    E.run = true; E.tb = 0;
    var frame = function (ts) {
      if (!E.run || self.dead) return;
      var ok = self.heroDraw(E, ts);
      if (self.reduce && ok) { E.run = false; E.raf = 0; return; }
      E.raf = requestAnimationFrame(frame);
    };
    E.raf = requestAnimationFrame(frame);
  }
  heroBuild(E, W, H, dpr) {
    var cv = E.cv, mob = !!this.state.mob;
    E.W = W; E.H = H; E.dpr = dpr; E.mob = mob;
    cv.width = Math.max(1, Math.round(W * dpr)); cv.height = Math.max(1, Math.round(H * dpr));
    var cr = cv.getBoundingClientRect(), k = cr.width ? W / cr.width : 1;
    var sc = cv.parentNode, ph = null, tx = null;
    var lg = null, chips = [];
    try { ph = sc.querySelector('.hphone'); tx = sc.querySelector('.htxt'); lg = sc.querySelector('.hleg'); chips = sc.querySelectorAll('.fchip'); } catch (e) {}
    var pr = ph ? ph.getBoundingClientRect() : null, tr = tx ? tx.getBoundingClientRect() : null;
    var P = pr && pr.width ? { x: (pr.left + pr.width / 2 - cr.left) * k, y: (pr.top + pr.height / 2 - cr.top) * k, w: pr.width * k, h: pr.height * k } : { x: W * 0.32, y: H * 0.5, w: 300, h: 620 };
    E.P = P;
    var s = P.w / 300, z = Math.max(0.72, s);
    var minX = mob ? 30 : 176, maxX = W - 14, minY = mob ? 10 : 96, maxY = H - (mob ? 10 : 70);
    if (!mob && tr && tr.width) maxX = (tr.left - cr.left) * k - 26;
    if (mob && tr && tr.height) maxY = Math.min(maxY, (tr.top - cr.top) * k - 40);
    var lr = lg ? lg.getBoundingClientRect() : null;
    if (lr && lr.width) maxY = Math.min(maxY, (lr.top - cr.top) * k - 10);
    var avoid = [];
    for (var c0 = 0; c0 < chips.length; c0++) { var q = chips[c0].getBoundingClientRect(); if (q.width) avoid.push([(q.left - cr.left) * k - 18, (q.top - cr.top) * k - 26, (q.right - cr.left) * k + 18, (q.bottom - cr.top) * k + 26]); }
    E.maxX = maxX; E.sz = z; E.ph = [];
    for (var i = 0; i < W2_OFF.length; i++) {
      var o = W2_OFF[i], x = P.x + o[0] * s, y = P.y + o[1] * s;
      if (x - 12 * z < minX || x + 12 * z > maxX || y - 20 * z < minY || y + 20 * z > maxY) continue;
      if (Math.abs(x - P.x) < P.w / 2 + 24 * z && Math.abs(y - P.y) < P.h / 2 + 26 * z) continue;
      var hitc = false; for (var c1 = 0; c1 < avoid.length; c1++) { var v = avoid[c1]; if (x > v[0] && x < v[2] && y > v[1] && y < v[3]) hitc = true; }
      if (hitc) continue;
      var side = x < P.x ? -1 : 1;
      var sx = P.x + side * (P.w / 2 - 6 * s), sy = Math.max(P.y - P.h / 2 + 90 * s, Math.min(P.y + P.h / 2 - 90 * s, y));
      E.ph.push({ x: x, y: y, sx: sx, sy: sy, cx: (sx + x) / 2, cy: (sy + y) / 2 - 46 * s, hit: 0, bd: 0 });
    }
  }
  heroWave(E, ts) {
    E.rings.push({ t0: ts });
    var P = E.P;
    for (var j = 0; j < E.ph.length; j++) {
      var p = E.ph[j], d = Math.sqrt((p.x - P.x) * (p.x - P.x) + (p.y - P.y) * (p.y - P.y));
      E.parts.push({ i: j, t0: ts + d * 0.9, dur: 900 + (j % 3) * 120, k: j % 3 === 0 ? 2 : 0 });
    }
  }
  heroDraw(E, ts) {
    var cv = E.cv, ctx = E.ctx, W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return false;
    var dpr = this.dprFor(cv);
    E.tb = (E.tb || 0) + 1;
    if (W !== E.W || H !== E.H || dpr !== E.dpr || !!this.state.mob !== E.mob || !E.ph || E.tb === 24 || E.tb === 120) this.heroBuild(E, W, H, dpr);
    var dt = E.prev ? Math.min(64, ts - E.prev) : 16; E.prev = ts;
    var red = this.reduce, P = E.P, ph = E.ph, z = E.sz, i, p;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!ph.length) return true;
    /* guide lines from the big phone out to every customer */
    ctx.lineWidth = 1; ctx.setLineDash([2, 7]); ctx.lineDashOffset = red ? 0 : -ts * 0.03;
    ctx.strokeStyle = 'rgba(13,40,77,.12)';
    ctx.beginPath();
    for (i = 0; i < ph.length; i++) { p = ph[i]; ctx.moveTo(p.sx, p.sy); ctx.quadraticCurveTo(p.cx, p.cy, p.x, p.y); }
    ctx.stroke(); ctx.setLineDash([]);
    if (!red) {
      /* broadcast waves: on start, and every time the order confirmation lands in the chat */
      if (E.wave0 === -1) E.wave0 = ts + 650;
      var hs = this.state.hs;
      if (E.hs !== hs) { if (hs === W2_ORD + 1) this.heroWave(E, ts); E.hs = hs; }
      if (E.wave0 > 0 && ts >= E.wave0) { this.heroWave(E, ts); E.wave0 = 0; }
      if (ts - E.last > (E.mob ? 560 : 320) && E.parts.length < 46) { E.last = ts; E.parts.push({ i: (Math.random() * ph.length) | 0, t0: ts, dur: 1050 + Math.random() * 500, k: Math.random() < 0.55 ? 0 : (Math.random() < 0.5 ? 1 : 2) }); }
      /* rings */
      var rk = [];
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, E.mob ? W : E.maxX + 10, H); ctx.clip();
      for (i = 0; i < E.rings.length; i++) {
        var r = E.rings[i], e = (ts - r.t0) / 1700;
        if (e >= 1) continue; rk.push(r);
        var rad = P.h * 0.52 + w2E(e) * (E.mob ? 90 : 230);
        ctx.strokeStyle = 'rgba(40,167,69,' + (0.32 * (1 - e)).toFixed(3) + ')'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(P.x, P.y, rad, 0, 6.2832); ctx.stroke();
      }
      ctx.restore(); E.rings = rk;
    }
    /* customer phones */
    for (i = 0; i < ph.length; i++) {
      p = ph[i];
      p.hit = Math.max(0, p.hit - dt / 900); p.bd = Math.max(0, p.bd - dt / 2600);
      var w = 20 * z, h = 36 * z, x = p.x - w / 2, y = p.y - h / 2;
      if (p.hit > 0.01) { ctx.globalAlpha = p.hit * 0.55; ctx.fillStyle = 'rgba(40,167,69,.4)'; ctx.beginPath(); ctx.arc(p.x, p.y, 15 * z + (1 - p.hit) * 18 * z, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#0D284D'; w2RR(ctx, x, y, w, h, 5 * z); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; w2RR(ctx, x + 2 * z, y + 3 * z, w - 4 * z, h - 6 * z, 3 * z); ctx.fill();
      ctx.fillStyle = 'rgba(13,40,77,.18)'; ctx.fillRect(x + w - 13 * z, y + 9 * z, 9 * z, 2.4 * z);
      ctx.fillStyle = 'rgba(40,167,69,.5)'; ctx.fillRect(x + 4 * z, y + 15 * z, 9 * z, 2.4 * z);
      if (p.hit > 0.01) { ctx.globalAlpha = p.hit * 0.9; ctx.fillStyle = '#28A745'; w2RR(ctx, x + 2 * z, y + 3 * z, w - 4 * z, h - 6 * z, 3 * z); ctx.fill(); ctx.globalAlpha = 1; }
      if (p.bd > 0.01) { ctx.globalAlpha = Math.min(1, p.bd * 2.2); ctx.fillStyle = '#FF2D8F'; ctx.beginPath(); ctx.arc(x + w - 1 * z, y + 1 * z, 4 * z, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1; }
    }
    if (red) return true;
    /* message bubbles in flight */
    var keep = [];
    ctx.lineCap = 'round';
    for (i = 0; i < E.parts.length; i++) {
      var a = E.parts[i], u = (ts - a.t0) / a.dur;
      if (u < 0) { keep.push(a); continue; }
      p = ph[a.i];
      if (!p) continue;
      if (u >= 1) { p.hit = 1; p.bd = 1; continue; }
      keep.push(a);
      var ee = w2E(u), bx = w2Q(p.sx, p.cx, p.x, ee), by = w2Q(p.sy, p.cy, p.y, ee);
      var e0 = w2E(Math.max(0, u - 0.14)), tx0 = w2Q(p.sx, p.cx, p.x, e0), ty0 = w2Q(p.sy, p.cy, p.y, e0);
      var fade = Math.min(1, u * 6) * Math.min(1, (1 - u) * 6), col = W2_COL[a.k];
      ctx.globalAlpha = 0.4 * fade; ctx.strokeStyle = col; ctx.lineWidth = 2 * z;
      ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.lineTo(bx, by); ctx.stroke();
      ctx.globalAlpha = fade; ctx.fillStyle = col;
      w2RR(ctx, bx - 7.5 * z, by - 5.5 * z, 15 * z, 11 * z, 4 * z); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx - 4.5 * z, by + 4 * z); ctx.lineTo(bx - 7.5 * z, by + 8.5 * z); ctx.lineTo(bx - 0.5 * z, by + 4.5 * z); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(bx - 4.5 * z, by - 1.6 * z, 9 * z, 1.8 * z);
    }
    ctx.globalAlpha = 1; E.parts = keep;
    return true;
  }

  renderVals() {
    var self = this, st = this.state, sec = this.cur(), red = this.reduce, mob = !!st.mob;
    var NAMES = ['البداية', 'التحدي', 'صندوق الوارد', 'الشات بوت', 'الذكاء الاصطناعي', 'الاستخدامات', 'التوثيق', 'حدود الإرسال', 'لماذا WhatsBit', 'الباقات', 'الأسئلة الشائعة', 'ابدأ الآن'];
    var SHORT = ['البداية', 'التحدي', 'صندوق الوارد', 'الشات بوت', 'ذكاء اصطناعي', 'الاستخدامات', 'التوثيق', 'حدود الإرسال', 'لماذا نحن', 'الباقات', 'الأسئلة', 'ابدأ الآن'];
    var go = function (i) { return function () { self.navTo(i); }; };
    var c = {}, h = {};
    for (var i = 0; i < W2N; i++) { c['s' + i] = i === sec ? 'is-active is-cur' : 'is-active'; h['s' + i] = i === sec ? 'false' : 'true'; }
    var rail = NAMES.map(function (n, i) { return { label: n, short: SHORT[i] || n, cls: 'rb' + (i === sec ? ' on' : ''), cur: i === sec ? 'step' : 'false', go: go(i) }; });

    /* hero chat */
    var HN = W2_HM.length, hs = red ? HN : Math.min(st.hs, HN);
    var hItems = W2_HM.map(function (m, i) { return w2Item(m, m.k === 'typ' ? i === hs - 1 : i < hs, -1); });
    var hTyping = hs > 0 && hs <= HN && W2_HM[hs - 1].k === 'typ';
    var hero = { items: hItems, bdCls: 'cbd' + (st.hs > HN && !red ? ' out' : ''), sub: hTyping ? 'يكتب الآن…' : 'حساب أعمال موثّق', subCls: hTyping ? 'ty' : '' };

    /* challenge */
    var sol = st.ch === 1;
    var chTabs = ['اليوم', 'مع WhatsBit'].map(function (n, i) { var on = st.ch === i; return { name: n, cls: 'segbtn' + (on ? ' on' : ''), sel: on ? 'true' : 'false', pick: function () { self.setState({ ch: i, chT: true }); } }; });
    var CB = [[15, 11, 120, -12, '3'], [26, 17, 86, 9, ''], [37, 10, 110, -6, '7'], [47, 15, 78, 11, ''], [14, 85, 130, 8, '5'], [25, 91, 88, -10, ''], [35, 84, 112, 6, '2'], [60, 89, 100, -8, '9'], [69, 83, 122, 12, ''], [78, 84, 90, -6, '4']];
    var chaos = CB.map(function (b, i) { return { st: 'left: ' + b[0] + '%; top: ' + b[1] + '%; width: ' + b[2] + 'px; --r: ' + b[3] + 'deg; --d: ' + (i * 0.05).toFixed(2) + 's; --fl: ' + (4 + (i % 4) * 0.7).toFixed(1) + 's', n: b[4], hasN: !!b[4] }; });

    /* inbox */
    var DEPTS = ['المبيعات', 'الدعم', 'الفواتير'], AG = ['فهد', 'سارة', 'منى'], AGC = ['#28A745', '#0D284D', '#FF8A1C'];
    var CV = [
      { n: 'أحمد العتيبي', ini: 'أ', col: '#28A745', last: 'متى يوصل طلبي رقم 4821؟', tm: '10:42', un: 2, d0: 1, th: [{ o: 0, t: 'السلام عليكم، متى يوصل طلبي رقم 4821؟', tm: '10:41' }, { o: 1, t: 'أهلاً أحمد، طلبك خرج للتوصيل ويصلك اليوم قبل الساعة 6 مساءً.', tm: '10:42' }] },
      { n: 'مؤسسة الريان', ini: 'م', col: '#FF5B5B', last: 'نحتاج عرض سعر لـ 15 مستخدماً', tm: '10:35', un: 1, d0: 0, th: [{ o: 0, t: 'مرحباً، نحتاج عرض سعر لباقة تكفي 15 مستخدماً.', tm: '10:33' }, { o: 1, t: 'أهلاً بكم، باقة الأعمال تناسبكم، وأرسلنا لكم العرض على البريد.', tm: '10:35' }] },
      { n: 'خالد الشهري', ini: 'خ', col: '#FF8A1C', last: 'أرسلت لكم إيصال التحويل', tm: '10:21', un: 0, d0: 2, th: [{ o: 0, t: 'تم التحويل، وأرسلت لكم صورة الإيصال.', tm: '10:19' }, { o: 1, t: 'شكراً خالد، تم تأكيد الدفع وإصدار الفاتورة.', tm: '10:21' }] },
      { n: 'ريم السبيعي', ini: 'ر', col: '#0D284D', last: 'شكراً على سرعة الرد', tm: '09:58', un: 0, d0: 1, th: [{ o: 0, t: 'هل يمكن تغيير عنوان التوصيل؟', tm: '09:55' }, { o: 1, t: 'بالتأكيد، تم تحديث العنوان.', tm: '09:57' }, { o: 0, t: 'شكراً على سرعة الرد', tm: '09:58' }] }
    ];
    var ORD = [3, 2, 1, 0], ibN = red ? 4 : st.ibN;
    var arr = function (i) { return ORD.indexOf(i) < ibN; };
    var cnt = [0, 0, 0];
    CV.forEach(function (v, i) { if (arr(i)) cnt[st.asg[i]] += 1; });
    var agents = AG.map(function (n, j) { return { n: n, d: DEPTS[j], ini: n.charAt(0), st: '--k: ' + AGC[j], c: String(cnt[j]), aria: n + ' · ' + DEPTS[j] + ': ' + cnt[j] + ' محادثات', cls: 'agt' + (cnt[j] ? ' has' : '') + (st.ibHA === j ? ' h' + (st.ibHit % 2) : '') }; });
    var cvs = CV.map(function (v, i) { var on = i === st.cv, a = arr(i); return { n: v.n, ini: v.ini, av: 'background: ' + v.col, last: v.last, tm: v.tm, un: String(v.un), hasUn: !!(v.un && !on), dept: DEPTS[st.asg[i]], dst: 'background: ' + AGC[st.asg[i]], wcls: 'cvw' + (a ? ' arr' : ''), cls: 'cv' + (on ? ' on' : ''), cur: on ? 'true' : 'false', ti: a ? '0' : '-1', pick: function () { self.setState({ cv: i, cvT: true }); } }; });
    var cc = CV[st.cv], cd = st.asg[st.cv], cShow = arr(st.cv);
    var ib = {
      agents: agents, cvs: cvs,
      thName: cShow ? cc.n : 'بانتظار المحادثات…',
      thAsg: cShow ? 'مسندة إلى: ' + DEPTS[cd] + ' · ' + AG[cd] : 'توزيع تلقائي',
      msgs: cShow ? cc.th.map(function (m) { return { cls: 'm b ' + (m.o ? 'me' : 'bz'), t: m.t, tm: m.tm }; }) : [],
      moved: cShow && cd !== cc.d0, moveNote: 'حُوّلت المحادثة إلى ' + DEPTS[cd] + ' · ' + AG[cd],
      depts: DEPTS.map(function (d, j) { var on = cShow && j === cd; return { name: d, cls: 'dchip' + (on ? ' on' : ''), pr: on ? 'true' : 'false', pick: function () { if (!arr(self.state.cv)) return; var a = self.state.asg.slice(); a[self.state.cv] = j; self.setState({ asg: a, ibHA: j, ibHit: self.state.ibHit + 1, cvT: true }); } }; })
    };

    /* bot builder */
    var S = this.botScript(), bs = red ? S.length : Math.min(st.bs, S.length);
    var bPick = -1;
    var bItems = S.map(function (m, i) {
      var vis = m.k === 'typ' ? i === bs - 1 : i < bs;
      return w2Item(m, vis, (m.k === 'menu' && bs > i + 1) ? st.bKind : -1);
    });
    var run = (bs > 0 && bs < S.length) ? S[bs - 1].n : (bs >= S.length ? -2 : -1);
    var bTyping = bs > 0 && bs <= S.length && S[bs - 1].k === 'typ';
    var ndOn = [true, st.bMenu, true, st.bHand];
    var nd = function (i) { return 'node' + (ndOn[i] ? '' : ' off') + (run === i ? ' run' : ''); };
    var wr = function (i) { return 'wire' + (ndOn[i] && ndOn[i + 1] ? ' on' : ''); };
    var restart = function (o) { o.bs = 0; o.bRun = (self.state.bRun || 0) + 1; self.setState(o); };
    var bot = {
      items: bItems, sub: bTyping ? 'يكتب الآن…' : 'يرد تلقائياً', subCls: bTyping ? 'ty' : '',
      n0: nd(0), n1: nd(1), n2: nd(2), n3: nd(3), w0: wr(0), w1: wr(1), w2: wr(2),
      s1: 'sw' + (st.bMenu ? ' on' : ''), a1: st.bMenu ? 'true' : 'false', t1: function () { restart({ bMenu: !self.state.bMenu }); },
      s3: 'sw' + (st.bHand ? ' on' : ''), a3: st.bHand ? 'true' : 'false', t3: function () { restart({ bHand: !self.state.bHand }); },
      k0: st.bKind === 0 ? 'on' : '', ka0: st.bKind === 0 ? 'true' : 'false', pk0: function () { restart({ bKind: 0 }); },
      k1: st.bKind === 1 ? 'on' : '', ka1: st.bKind === 1 ? 'true' : 'false', pk1: function () { restart({ bKind: 1 }); },
      replay: function () { restart({}); }
    };

    /* AI agent */
    var amax = W2_AQ[st.aq].sys ? 5 : 4, ap = red ? amax : Math.min(st.ap, amax), Q = W2_AQ[st.aq];
    var qs = W2_AQ.map(function (q, j) {
      var ki = 0;
      var toks = q.q.split(' ').map(function (w) { var bare = w.replace(/[؟?،,.!]/g, ''), key = q.keys.indexOf(bare) >= 0; var o = { t: w, cls: 'tk' + (key ? ' key' : ''), st: '--i: ' + (key ? ki : 0) }; if (key) ki += 1; return o; });
      return { on: j === st.aq, cls: 'aiq' + (ap >= 1 ? ' lit' : ''), toks: toks };
    });
    var STG = ['فهم السؤال', 'بيانات شركتك', 'الرد أو التحويل'];
    var ai = {
      vcls: 'aiv fit inf u1' + (ap >= 1 && ap < 4 ? ' think' : ''),
      chips: W2_AQ.map(function (q, j) { var on = j === st.aq; return { t: q.chip, cls: 'qc' + (on ? ' on' : ''), on: on ? 'true' : 'false', pick: function () { self.setState({ aq: j, ap: 0, aqT: true }); } }; }),
      qs: qs,
      stg: STG.map(function (t, k) { var done = ap >= 4 || ap > k + 1, cu = !done && ap === k + 1; return { t: t, n: done ? '✓' : String(k + 1), cls: 'stg' + (done ? ' done' : '') + (cu ? ' cur' : '') }; }),
      pst: '--p: ' + Math.max(0, Math.min(1, (ap - 1) / 2)).toFixed(2),
      icls: 'intent' + (ap >= 2 ? ' on' : ''), intent: Q.intent, act: Q.act,
      typing: ap === 3, reply: ap >= 4, a: Q.a, sys: ap >= 5 && !!Q.sys, sysT: Q.sys
    };

    /* use cases */
    var U = [
      { name: 'خدمة العملاء', title: 'ردود أسرع.. من فريق كامل ورقم واحد.', desc: 'استقبل استفسارات عملائك وطلباتهم، ووزّعها على فريقك، ودع البوت يتولى المتكرر منها.', ph: 'ph-agent', alt: 'موظفة خدمة عملاء ترد على المحادثات', cat: 'محادثات خدمة العملاء', fee: 'مجانية من Meta',
        bubs: [{ cls: 'm b me', t: 'هل التوصيل متاح لمدينة ينبع؟', tm: '11:02' }, { cls: 'm b bz', t: 'نعم، نوصل لينبع خلال يومين عمل.', tm: '11:03' }], btns: [] },
      { name: 'الإشعارات', title: 'كل طلب.. يصل عميلك تأكيده.', desc: 'تأكيد الطلبات والمواعيد، وحالة الشحن والفواتير، تلقائياً من نظامك أو متجرك.', ph: 'ph-store', alt: 'صاحب متجر يجهّز طلباً ويتابع جواله', cat: 'رسائل الخدمات', fee: '0.0401 ر.س للرسالة',
        bubs: [{ cls: 'm b bz', t: 'تم شحن طلبك رقم 4821، ويصلك خلال يومين عمل.', tm: '09:12' }], btns: ['تتبّع الشحنة'] },
      { name: 'الحملات', title: 'عروض تصل.. لمن يريدها.', desc: 'حملات موجّهة لعملاء وافقوا على الاستلام، بقوالب معتمدة وأزرار تفاعلية، مع تحليل النتائج.', ph: 'ph-cafe', alt: 'عميلة تقرأ عرضاً على جوالها في مقهى', cat: 'الرسائل التسويقية', fee: '0.2159 ر.س للرسالة',
        bubs: [{ cls: 'm b bz', t: 'عرض نهاية الأسبوع: خصم 20% على التشكيلة الجديدة حتى الأحد.', tm: '18:30' }], btns: ['تسوّق الآن', 'إيقاف العروض'] },
      { name: 'رموز التحقق', title: 'دخول آمن.. خلال ثوانٍ.', desc: 'رموز دخول وتحقق تصل لعملائك فوراً، مع زر لنسخ الرمز بلمسة واحدة.', ph: 'ph-otp', alt: 'مستخدم يدخل رمز التحقق على جواله', cat: 'رسائل التوثيق', fee: '0.0401 ر.س للرسالة',
        bubs: [{ cls: 'm b bz', t: 'رمز التحقق الخاص بك: 482913. لا تشاركه مع أحد.', tm: '14:05' }], btns: ['نسخ الرمز'] }
    ];
    var uses = U.map(function (u, i) { var o = i === st.use; return { name: u.name, title: u.title, desc: u.desc, alt: u.alt, cat: u.cat, fee: u.fee, bubs: u.bubs, btns: u.btns, on: o, sel: o ? 'true' : 'false', ph: o ? 'false' : 'true', cls: 'segbtn' + (o ? ' on' : ''), pcls: 'pic ' + u.ph + (o ? ' on' : ''), pick: function () { if (self.state.use === i) { self.setState({ ucHold: true }); return; } self.setState({ use: i, ucHold: true, ucK: self.state.ucK + 1 }); } }; });

    /* verification */
    var vs = (red && !st.vT) ? 4 : st.vs, vok = vs >= 4;
    var VS = [{ t: 'اكتمال بيانات منشأتك', d: 'يعتمد عليها توثيق الحساب' }, { t: 'توثيق الحساب لدى Meta', d: 'نرافقك في التوثيق وطلب الشارة' }, { t: 'ربط رقمك بالمنصة', d: 'رقم واحد لفريقك كله' }, { t: 'اسمك وشارة التوثيق', d: 'وفق معايير Meta' }];
    var vf = {
      vcls: 'vv fit inf u1' + (vok ? ' ok' : ''), phCls: 'phone' + (vok ? ' ok' : ''), lcls: 'vlist in t4' + (vok ? ' ok' : ''),
      pst: '--p: ' + Math.min(1, vs / 3).toFixed(3),
      aria: vok ? 'محادثة من حساب موثّق يظهر فيه اسم متجر النخبة مع شارة التوثيق' : 'محادثة من رقم غير موثّق يظهر فيها الرقم فقط مع تحذير',
      steps: VS.map(function (s, i) { var done = i < vs, cu = !done && i === vs && !(st.vT && vs === 0); return { t: s.t, d: s.d, n: String(i + 1), cls: 'vst' + (done ? ' done' : '') + (cu ? ' cur' : '') }; }),
      tabs: ['قبل التوثيق', 'بعد التوثيق'].map(function (n, i) { var o = vok ? i === 1 : i === 0; return { name: n, cls: 'segbtn' + (o ? ' on' : ''), sel: o ? 'true' : 'false', pick: function () { self.setState({ vs: i ? 4 : 0, vT: true }); } }; }),
      replay: function () { self.setState({ vs: 0, vT: false }); }
    };

    /* sending limits */
    var lv = (red && !st.lvT) ? 4 : st.lv, SH = mob ? 170 : 270, SX = mob ? 60 : 111;
    var lh = W2_LV.map(function (l) { return Math.round(l.h / 100 * SH); });
    var lm = {
      name: W2_LV[lv].l, aria: W2_LV[lv].l + ': ' + W2_LV[lv].v,
      rst: 'transform: translate3d(0, -' + (lv * 20) + '%, 0)',
      vals: W2_LV.map(function (l, i) { return { v: l.v, cls: i === 4 ? 'gg' : 'en' }; }),
      mk: 'transform: translate3d(-' + (lv * SX) + 'px, -' + (lh[lv] + (mob ? 8 : 12)) + 'px, 0)',
      levels: W2_LV.map(function (l, i) { return { v: l.v, l: l.l, st: 'height: ' + lh[i] + 'px', aria: l.l + ': ' + l.v, cls: 'stp' + (i <= lv ? ' on' : '') + (i === lv ? ' cur' : ''), pr: i === lv ? 'true' : 'false', pick: function () { self.setState({ lv: i, lvT: true }); } }; })
    };

    /* why: odometers */
    var od = red || st.odo || !!st.mob;
    var ws = { a: w2Odo('+20,000', od), b: w2Odo('+10', od), c: w2Odo('98%', od) };

    /* packages */
    var P = [
      { k: 'basic', n: 'الأساسية', en: 'BASIC', aud: 'للشركات الصغيرة والمتاجر الفردية', m: 199, f: ['1,000 محادثة خدمية و2,000 رسالة بث', 'مستخدمان ورقم واتساب', 'قوالب رسائل غير محدودة', 'ردود تلقائية بقواعد ثابتة', 'دعم بالبريد خلال 24 ساعة'], cta: 'اشترك الآن' },
      { k: 'starter', n: 'البداية', en: 'STARTER', aud: 'للشركات النامية وبداية الأتمتة', m: 399, f: ['2,500 محادثة و10,000 رسالة بث', 'شات بوت ذكي (5,000 رسالة)', '5 مستخدمين', 'تكامل سلة وزد وShopify', 'وصول محدود لواجهة الربط'], cta: 'اشترك الآن' },
      { k: 'business', n: 'الأعمال', en: 'BUSINESS', aud: 'للشركات المتوسطة مع ذكاء اصطناعي كامل', m: 867, hot: true, f: ['5,000 محادثة و25,000 رسالة بث', 'بوت غير محدود ووكيل ذكاء اصطناعي', '15 مستخدماً', 'واجهة ربط كاملة مع Webhooks', 'مدير حساب مخصص وجلسة تدريب'], cta: 'اشترك الآن' },
      { n: 'المؤسسات', en: 'ENTERPRISE', aud: 'للمؤسسات الكبرى والجهات', m: 1737, f: ['10,000 محادثة و50,000 رسالة بث', 'وكلاء ذكاء اصطناعي ونماذج لغوية متعددة', 'أكثر من 40 مستخدماً', 'واجهة ربط مفتوحة وحزم تطوير', 'SLA ‏99.9% ودعم على مدار الساعة'], cta: 'تواصل مع المبيعات' }
    ];
    var fmt = function (x) { return Math.round(x).toLocaleString('en-US'); };
    var pOn = red || st.pOdo;
    var pkgs = P.map(function (p) {
      var price = fmt(st.yr ? p.m * 0.8 : p.m);
      return { n: p.n, en: p.en, aud: p.aud, hot: !!p.hot, cls: 'pk glass' + (p.hot ? ' hot' : ''), price: price + ' ر.س شهرياً', dg: w2Odo(price, pOn),
        sub: st.yr ? 'يُدفع سنوياً · بدلاً من ' + fmt(p.m) : 'خصم 20% عند الاشتراك السنوي',
        feats: p.f, cta: p.cta, go: p.k ? function () { window.location.href = '/register'; } : go(W2N - 1), btn: 'btn ' + (p.hot ? 'btn-primary' : 'btn-line') };
    });
    var periods = [{ name: 'شهري', v: false }, { name: 'سنوي', v: true }].map(function (t) { var o = st.yr === t.v; return { name: t.name, hasOff: t.v, cls: 'segbtn' + (o ? ' on' : ''), sel: o ? 'true' : 'false', pick: function () { self.setState({ yr: t.v }); } }; });
    var pkScroll = function (e) {
      var el = e.currentTarget, first = el.querySelector('.pk');
      if (!first) return;
      var w = first.getBoundingClientRect().width + 12, i = Math.round(Math.abs(el.scrollLeft) / w);
      i = Math.max(0, Math.min(3, i));
      if (i !== self.state.pki) self.setState({ pki: i });
    };
    var pkDots = P.map(function (p, i) { var o = i === st.pki; return { label: p.n, cls: 'pkd' + (o ? ' on' : ''), cur: o ? 'true' : 'false', go: function (e) {
      var sc = e.currentTarget.closest('.scene'), list = sc ? sc.querySelectorAll('.pk') : [];
      if (list[i]) list[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    } }; });

    /* start steps as a conversation */
    var cs = red ? 4 : st.cs;
    var CS = [{ t: 'اختيار الباقة', d: 'جلسة قصيرة نفهم فيها احتياجك وحجم فريقك' }, { t: 'التوثيق والربط', d: 'توثيق حسابك لدى Meta وربط رقمك بالمنصة' }, { t: 'الإعداد والتدريب', d: 'القوالب والردود والبوت، وتدريب فريقك' }, { t: 'الانطلاق', d: 'فريقك يرد ويرسل من منصة واحدة' }];
    var cta = CS.map(function (s, i) { return { n: String(i + 1), t: s.t, d: s.d, cls: 'cst' + (i < cs ? ' on' : '') }; });

    var fwd = function () { self.move(1); };
    var last = sec === W2N - 1;
    var guard = function (e, d) {
      var sc = e.currentTarget.querySelector('.scene.is-active');
      if (!sc) return true;
      var oy = 'visible'; try { oy = window.getComputedStyle(sc).overflowY; } catch (x) {}
      if (oy !== 'auto' && oy !== 'scroll') return true;
      var atTop = sc.scrollTop <= 1, atBot = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2;
      return !((d > 0 && !atBot) || (d < 0 && !atTop));
    };

    var CXD = {
      wb: { chip: 'واتساب أعمال WhatsBit', name: 'WhatsBit', q: 'كم موظفاً سيرد على محادثات عملائك؟', qs: 'حجم الفريق', page: 'WhatsBit.dc.html',
        extra: 'الأسعار قبل الضريبة، وخصم 20% للاشتراك السنوي.',
        o: [{ l: 'موظف أو اثنان', t: 'باقة الأساسية', b: 'مستخدمان ورقم واتساب، و1,000 محادثة خدمية و2,000 رسالة بث شهرياً.', p: '199', u: 'ر.س / شهرياً' },
            { l: 'من 3 إلى 5', t: 'باقة البداية', b: '5 مستخدمين مع شات بوت ذكي، وتكامل مع سلة وزد وShopify.', p: '399', u: 'ر.س / شهرياً' },
            { l: 'من 6 إلى 15', t: 'باقة الأعمال', b: 'الأكثر طلباً: 15 مستخدماً، ووكيل ذكاء اصطناعي كامل، وواجهة ربط مع Webhooks.', p: '867', u: 'ر.س / شهرياً' },
            { l: 'أكثر من 15', t: 'باقة المؤسسات', b: 'أكثر من 40 مستخدماً، ووكلاء ذكاء اصطناعي، ودعم على مدار الساعة.', p: '1,737', u: 'ر.س / شهرياً' }] }
    };
    var CXORDER = ['wb'], CXHERE = 'WhatsBit.dc.html', CXPR = 9, CXFIX = 'wb';
    var cxNeedTyping = function (o) { o.cxTy = 1; self.setState(o); if (self.cxTT) clearTimeout(self.cxTT); self.cxTT = setTimeout(function () { self.setState({ cxTy: 0 }); }, 800); };
    var cxP = CXFIX ? CXD[CXFIX] : (st.cxNeed ? CXD[st.cxNeed] : null), cxO = (cxP && st.cxOpt != null) ? cxP.o[st.cxOpt] : null, cxTy = !!st.cxTy;
    var cxMsgs = CXFIX
      ? [{ cls: 'cx-m bot', t: cxP.greet || ('أهلاً بك في ' + cxP.name + '.') }, { cls: 'cx-m bot', t: 'سؤال واحد فقط، وأرشّح لك الباقة المناسبة.' }, { cls: 'cx-m bot', t: cxP.q }]
      : [{ cls: 'cx-m bot', t: 'أهلاً بك في المدار.' }, { cls: 'cx-m bot', t: 'أجب عن سؤالين، وأرشّح لك الحل والباقة المناسبة.' }];
    if (cxP && !CXFIX) { cxMsgs.push({ cls: 'cx-m me', t: cxP.chip }); if (!(cxTy && !cxO)) cxMsgs.push({ cls: 'cx-m bot', t: cxP.q }); }
    if (cxO) { cxMsgs.push({ cls: 'cx-m me', t: cxO.l }); if (!cxTy) cxMsgs.push({ cls: 'cx-m bot', t: 'هذا ما أرشّحه لك:' }); }
    var cxRec = (cxO && !cxTy) ? { title: cxO.t || cxP.rt, body: cxO.b || cxP.rb, price: cxO.p || '', unit: cxO.u || '', hasPrice: !!cxO.p, extra: cxP.extra || '', hasExtra: !!cxP.extra } : null;
    var cxChips = [];
    if (!cxP) cxChips = CXORDER.map(function (k) { return { label: CXD[k].chip, pick: function () { cxNeedTyping({ cxNeed: k, cxOpt: null }); } }; });
    else if (!cxO && !cxTy) cxChips = cxP.o.map(function (o, i) { return { label: o.l, pick: function () { cxNeedTyping({ cxOpt: i }); } }; });
    var cxHereP = cxP && cxP.page === CXHERE, cxExt = cxP && /^https?:/.test(cxP.page);
    var CLD = { support: { n: 'الدعم الفني', d: 'مشكلة أو استفسار' }, sales: { n: 'المبيعات', d: 'أسعار واشتراكات' } };
    var clStep = st.clStep || 'form', chStep = st.chStep || 'form', clCall = (st.clMode || 'call') !== 'chat';
    var clDk = CLD[st.clDept] ? st.clDept : 'support';
    var clClr = function () { if (self.clTm1) { clearTimeout(self.clTm1); self.clTm1 = null; } if (self.clTm2) { clearTimeout(self.clTm2); self.clTm2 = null; } if (self.clTick) { clearInterval(self.clTick); self.clTick = null; } };
    var chClr = function () { ['chTm1', 'chTm2', 'chTm3'].forEach(function (k) { if (self[k]) { clearTimeout(self[k]); self[k] = null; } }); };
    var clFmt = function (s) { var m = Math.floor(s / 60), x = s % 60; return (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; };
    var clValid = function (v) { var d = String(v || '').replace(/[\s\-()]/g, ''); return /^\+\d{8,15}$/.test(d) || /^05\d{8}$/.test(d) || /^5\d{8}$/.test(d); };
    var clCdStart = function () { if (self.clCdT) clearInterval(self.clCdT); self.setState({ clCd: 30 }); self.clCdT = setInterval(function () { var c = (self.state.clCd || 0) - 1; if (c <= 0) { clearInterval(self.clCdT); self.clCdT = null; c = 0; } self.setState({ clCd: c }); }, 1000); };
    var clReset = function () { return { clStep: (self.state.clStep === 'end' ? 'form' : self.state.clStep), chStep: (self.state.chStep === 'end' ? 'form' : self.state.chStep) }; };
    var clOn = clStep === 'dial' || clStep === 'queue' || clStep === 'live', chOn = chStep === 'chat';
    var chList = st.chList || [];
    var chPush = function (item) { var l = (self.state.chList || []).slice(); l.push(item); return l; };
    var chRead = function () { return (self.state.chList || []).map(function (m) { return m.w === 'me' ? { w: m.w, t: m.t, rd: true } : m; }); };
    var cl = {
      wcls: (st.clOpen ? 'clopen' : '') + (clOn || chOn ? ' oncall' : ''),
      tb: (clOn || chOn) ? 'live' : '',
      exp: st.clOpen ? 'true' : 'false', hidden: st.clOpen ? 'false' : 'true',
      btnLabel: clOn ? 'المكالمة جارية — اعرض النافذة' : (chOn ? 'المحادثة جارية — اعرض النافذة' : (st.clOpen ? 'إغلاق نافذة التواصل' : 'تواصل معنا — اتصال أو محادثة مجانية')),
      toggle: function () { var o = !self.state.clOpen; var r = clReset(); r.clOpen = o; r.cxOpen = false; r.cxTease = false; self.setState(r); },
      close: function () { var r = clReset(); r.clOpen = false; self.setState(r); },
      onKey: function (e) { if (e && e.key === 'Escape' && self.state.clOpen) { var r = clReset(); r.clOpen = false; self.setState(r); } },
      showMode: clCall ? clStep === 'form' : chStep === 'form',
      mCall: 'cl-mt' + (clCall ? ' on' : ''), mChat: 'cl-mt' + (clCall ? '' : ' on'), sCall: clCall ? 'true' : 'false', sChat: clCall ? 'false' : 'true',
      toCall: function () { self.setState({ clMode: 'call' }); }, toChat: function () { self.setState({ clMode: 'chat' }); },
      isForm: clCall && clStep === 'form', isCall: clCall && clOn, isEnd: clCall && clStep === 'end',
      chForm: !clCall && chStep === 'form', chChat: !clCall && chOn, chDone: !clCall && chStep === 'end',
      hasFrom: !!st.clFrom, from: st.clFrom || '',
      depts: ['support', 'sales'].map(function (k) { var on = clDk === k; return { cls: 'cl-dp' + (on ? ' on' : ''), on: on ? 'true' : 'false', name: CLD[k].n, desc: CLD[k].d, pick: function () { self.setState({ clDept: k }); } }; }),
      ph: st.clPh || '',
      onPh: function (e) { var v = (e && e.target ? e.target.value : '').replace(/[^\d+\s]/g, '').slice(0, 16); self.setState({ clPh: v, clErr: '', clCallErr: '' }); },
      stPh: false, stCode: false, stOk: false,
      hasErr: !!st.clErr, err: st.clErr || '',
      send: function () { if (!clValid(self.state.clPh)) { self.setState({ clErr: 'اكتب رقم جوال صحيحاً، مثل 0551234567، أو برمز الدولة إن كنت خارج السعودية.' }); return; } self.setState({ clSent: true, clErr: '', clCode: '', clCallErr: '' }); clCdStart(); },
      code: st.clCode || '',
      onCode: function (e) { var v = (e && e.target ? e.target.value : '').replace(/\D/g, '').slice(0, 4); if (v.length === 4) { if (self.clCdT) { clearInterval(self.clCdT); self.clCdT = null; } self.setState({ clCode: v, clOk: true, clSent: false, clCd: 0, clErr: '', clCallErr: '' }); } else { self.setState({ clCode: v, clErr: '' }); } },
      cdOn: (st.clCd || 0) > 0, cdOff: !((st.clCd || 0) > 0), cd: String(st.clCd || 0),
      resend: function () { clCdStart(); },
      change: function () { if (self.clCdT) { clearInterval(self.clCdT); self.clCdT = null; } self.setState({ clSent: false, clOk: false, clCode: '', clCd: 0, clErr: '' }); },
      hasCallErr: !!st.clCallErr, callErr: st.clCallErr || '',
      callCls: 'cl-go',
      call: function () { window.open(CALL_URL, '_blank', 'noopener'); },
      ringCls: clStep === 'live' ? 'live' : 'pulse',
      who: clStep === 'live' ? ('متصل مع فريق ' + CLD[clDk].n) : ('فريق ' + CLD[clDk].n),
      status: clStep === 'dial' ? 'جارٍ الاتصال عبر المتصفح…' : (clStep === 'queue' ? 'أنت الأول في الطابور — لحظات ويرد عليك أحد موظفينا' : (st.clMute ? 'الميكروفون مكتوم' : 'المكالمة جارية')),
      hasTime: clStep === 'live', time: clFmt(st.clT || 0),
      muted: st.clMute ? 'true' : 'false', muteCls: 'cl-mute' + (st.clMute ? ' on' : ''), muteLb: st.clMute ? 'إلغاء الكتم' : 'كتم',
      mute: function () { self.setState({ clMute: !self.state.clMute }); },
      end: function () { clClr(); self.setState({ clStep: 'end' }); },
      again: function () { clClr(); self.setState({ clStep: 'form', clT: 0 }); },
      chName: st.chName || '', chMsg: st.chMsg || '', chDraft: st.chDraft || '',
      hasChErr: !!st.chErr, chErr: st.chErr || '',
      onName: function (e) { self.setState({ chName: (e && e.target ? e.target.value : '').slice(0, 40), chErr: '' }); },
      onMsg: function (e) { self.setState({ chMsg: (e && e.target ? e.target.value : '').slice(0, 600), chErr: '' }); },
      onDraft: function (e) { self.setState({ chDraft: (e && e.target ? e.target.value : '').slice(0, 600) }); },
      chStart: function () {
        var nm = String(self.state.chName || '').trim(), msg = String(self.state.chMsg || '').trim();
        if (nm.length < 2) { self.setState({ chErr: 'اكتب اسمك حتى يعرف الموظف كيف يناديك.' }); return; }
        if (msg.length < 2) { self.setState({ chErr: 'اكتب سؤالك أو استفسارك أولاً.' }); return; }
        var dk = CLD[self.state.clDept] ? self.state.clDept : 'support', from = self.state.clFrom;
        var txt = 'مرحباً فريق ' + CLD[dk].n + ' في كوربت، معكم ' + nm + '.\n' + msg + (from ? '\n(ترشيح المساعد: ' + from + ')' : '');
        window.open(WA_URL + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
        self.setState({ chErr: '' });
      },
      chSend: function () {
        var t = String(self.state.chDraft || '').trim(); if (!t) return;
        self.setState({ chDraft: '', chList: chPush({ w: 'me', t: t }) });
        if (self.state.chJoined) { if (self.chTm3) clearTimeout(self.chTm3); self.chTm3 = setTimeout(function () { self.setState({ chList: chRead() }); }, 1200); }
      },
      draftKey: function (e) { if (e && e.key === 'Enter' && !e.shiftKey) { if (e.preventDefault) e.preventDefault(); cl.chSend(); } },
      chTyping: !!st.chTyping,
      chItems: chList.slice().reverse().map(function (m) { var me = m.w === 'me'; return { cls: 'ch-m ' + (m.w === 'sys' ? 'sys' : (me ? 'me' : 'ag')), t: m.t, hasRc: me, rc: m.rd ? '✓✓ تمت القراءة' : '✓ تم الإرسال' }; }),
      chDot: 'ch-dot' + (st.chJoined ? ' on' : ''),
      chWho: 'فريق ' + CLD[clDk].n,
      chState: st.chJoined ? '· متصل الآن' : '· بانتظار موظف…',
      chToCall: function () { self.setState({ clMode: 'call' }); },
      chEnd: function () { chClr(); self.setState({ chStep: 'end', chTyping: false }); },
      chAgain: function () { chClr(); self.setState({ chStep: 'form', chList: [], chJoined: false, chTyping: false }); }
    };
    var cx = {
      cls: (st.cxOpen ? 'open' : ''), exp: st.cxOpen ? 'true' : 'false', hidden: st.cxOpen ? 'false' : 'true',
      title: CXFIX ? 'مساعد ' + cxP.name : 'مساعد المدار', sub: CXFIX ? 'نرشّح لك الباقة المناسبة في 30 ثانية' : 'نرشّح لك الحل المناسب في 30 ثانية',
      btnLabel: st.cxOpen ? 'إغلاق مساعد الاختيار' : 'ساعدني أختار الحل المناسب',
      teaser: !!(st.cxTease && !st.cxOpen && !st.cxSeen), teaseT: 'أي باقة تناسب فريقك؟', teaseS: 'سؤالان فقط، ونرشّح لك الأنسب.',
      msgs: cxMsgs.slice().reverse(), typing: cxTy, hasRec: !!cxRec,
      rec: cxRec || { title: '', body: '', price: '', unit: '', hasPrice: false, extra: '', hasExtra: false },
      chips: cxChips, hasChips: cxChips.length > 0, hasCta: !!cxRec,
      wa: cxRec ? 'https://wa.me/966920006900?text=' + encodeURIComponent('مرحباً فريق المدار، أنا مهتم بـ ' + cxP.name + ' (' + cxP.qs + ': ' + cxO.l + '). الترشيح: ' + cxRec.title + '. أرجو التواصل معي.') : '#',
      hasMoreLink: !!(cxRec && !cxHereP), moreHref: cxP ? cxP.page : '#', moreTarget: cxExt ? '_blank' : '_self', moreLabel: cxP ? 'تعرّف على ' + cxP.name : '',
      hasMoreGo: !!(cxRec && cxHereP && CXPR >= 0), moreGo: function () { self.setState({ cxOpen: false }); self.navTo(CXPR); },
      toggle: function () { self.setState({ cxOpen: !self.state.cxOpen, cxSeen: true, cxTease: false, clOpen: false }); },
      toSales: function () { self.setState({ cxOpen: false, cxSeen: true, cxTease: false, clOpen: true, clStep: (self.state.clStep === 'end' ? 'form' : self.state.clStep), clDept: 'sales', clFrom: cxRec ? cxRec.title : '' }); },
      toSupport: function () { self.setState({ cxOpen: false, cxSeen: true, cxTease: false, clOpen: true, clStep: (self.state.clStep === 'end' ? 'form' : self.state.clStep), clDept: 'support', clFrom: '' }); },
      open: function () { self.setState({ cxOpen: true, cxSeen: true, cxTease: false, clOpen: false }); },
      close: function () { self.setState({ cxOpen: false }); },
      hideTease: function () { self.setState({ cxTease: false, cxSeen: true }); },
      restart: function () { self.setState({ cxNeed: null, cxOpt: null, cxTy: 0 }); },
      onKey: function (e) { if (e && e.key === 'Escape') { if (self.state.clOpen) self.setState({ clOpen: false, clStep: (self.state.clStep === 'end' ? 'form' : self.state.clStep), chStep: (self.state.chStep === 'end' ? 'form' : self.state.chStep) }); else if (self.state.cxOpen) self.setState({ cxOpen: false }); } }
    };


    return {
      cx: cx, cl: cl,
      fq: (function () { var o = {}; for (var q = 0; q < 6; q++) { (function (q) { o['c' + q] = st.faq === q ? 'on' : ''; o['e' + q] = st.faq === q ? 'true' : 'false'; o['t' + q] = function (e) { if (e && e.preventDefault) e.preventDefault(); self.setState({ faq: self.state.faq === q ? -1 : q }); }; })(q); } return o; })(),
      menuCls: st.menu ? 'on' : '', menuExp: st.menu ? 'true' : 'false', menuHidden: st.menu ? 'false' : 'true',
      openMenu: function () { self.setState({ menu: true }); }, closeMenu: function () { self.setState({ menu: false }); },
      onScrub: (this.scrubH || (this.scrubH = this.scrub.bind(this))), c: c, h: h, rail: rail, chapter: NAMES[sec],
      sweepCls: 'sweep ' + (st.sw || ''),
      goHome: go(0), goContact: go(W2N - 1), goPricing: go(9),
      nextAct: fwd, notLast: !last,
      onWheel: function (e) { if (self.state.menu || self.state.cxOpen || self.state.clOpen || (e.target && e.target.closest && e.target.closest('.cxw'))) return; if (Math.abs(e.deltaY) < 24) return; if (!guard(e, e.deltaY)) return; self.move(e.deltaY > 0 ? 1 : -1); },
      onTouchStart: function (e) { if (e.touches && e.touches[0]) { self.ty = e.touches[0].clientY; self.tx = e.touches[0].clientX; } },
      onTouchEnd: function (e) {
        if (self.state.menu || self.state.cxOpen || self.state.clOpen || (e.target && e.target.closest && e.target.closest('.cxw'))) return;
        if (self.ty == null || !e.changedTouches || !e.changedTouches[0]) return;
        var dy = self.ty - e.changedTouches[0].clientY, dx = (self.tx || 0) - e.changedTouches[0].clientX; self.ty = null;
        if (Math.abs(dx) > Math.abs(dy)) return;
        if (Math.abs(dy) < 60 || !guard(e, dy)) return;
        self.move(dy > 0 ? 1 : -1);
      },
      onMove: function (e) {
        if (self.state.mob) return;
        var el = e.currentTarget; self.mvE = { x: e.clientX, y: e.clientY };
        if (self.mvRaf || !el) return;
        self.mvRaf = requestAnimationFrame(function () {
          self.mvRaf = 0;
          var stg = el.querySelector('.stage'); if (!stg || !self.mvE) return;
          var r = stg.getBoundingClientRect(), z = stg.offsetWidth ? r.width / stg.offsetWidth : 1;
          stg.style.setProperty('--mx', ((self.mvE.x - r.left) / (z || 1)).toFixed(1) + 'px');
          stg.style.setProperty('--my', ((self.mvE.y - r.top) / (z || 1)).toFixed(1) + 'px');
        });
      },
      hero: hero,
      chTabs: chTabs, chCls: sol ? 'sol' : '', chSc: sol ? 'sol' : '', chA: { hp: sol ? 'true' : 'false', hs: sol ? 'false' : 'true' }, chaos: chaos,
      ib: ib, bot: bot, ai: ai,
      uses: uses, ucBar: 'ucbar ' + (st.ucHold ? 'hold' : ('k' + (st.ucK % 2))), ucEdge: 'uedge e' + (st.ucK % 2),
      vf: vf, lm: lm, ws: ws,
      pkgs: pkgs, periods: periods, pkScroll: pkScroll, pkDots: pkDots,
      cta: cta
    };
  }
}
