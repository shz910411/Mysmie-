const { request } = require('../../utils/request');

function uuid() {
  return 'w-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
}

Page({
  data: {
    stage: 'connecting', // connecting | ok | manual
    weight: '',
    bodyFatPct: '',
    manualWeight: '',
    saving: false,
  },

  onLoad(q) {
    this._timers = [];
    this._comp = null;
    this.fetchPrev();
    if (q && q.mode === 'manual') {
      this.setData({ stage: 'manual' });
    } else {
      this.startBle();
    }
  },

  onUnload() {
    this.clearTimers();
  },

  clearTimers() {
    (this._timers || []).forEach((t) => clearTimeout(t));
    this._timers = [];
  },

  // 取上次体重作手动默认值
  fetchPrev() {
    request({ url: '/me/weight/latest' })
      .then((res) => {
        if (res && res.record) {
          this.setData({ manualWeight: String(res.record.weightKg) });
        }
      })
      .catch(() => {});
  },

  // 态A：蓝牙模拟连接（约 2s 读数成功；15s 超时切手动）
  startBle() {
    this.setData({ stage: 'connecting' });
    const ok = setTimeout(() => this.bleSuccess(), 2000);
    const timeout = setTimeout(() => {
      if (this.data.stage === 'connecting') this.showManual();
    }, 15000);
    this._timers.push(ok, timeout);
  },

  bleSuccess() {
    this.clearTimers();
    const w = Math.round((57 + Math.random() * 4) * 10) / 10;
    this._comp = this.simulateComp();
    this.setData({ stage: 'ok', weight: w, bodyFatPct: this._comp.bodyFatPct });
  },

  // 模拟体脂秤 13 项体成分（数值仅本地模拟，真 vtble 插件 P1 后续）
  simulateComp() {
    const r = (min, max, d) => {
      const p = Math.pow(10, d);
      return Math.round((min + Math.random() * (max - min)) * p) / p;
    };
    return {
      bmi: r(20, 24, 1),
      bodyFatPct: r(28, 34, 1),
      fatKg: r(16, 20, 1),
      subcutFatPct: r(22, 28, 1),
      visceralFatLevel: r(4, 9, 0),
      waterPct: r(48, 56, 1),
      skeletalMuscleKg: r(20, 24, 1),
      muscleKg: r(38, 44, 1),
      boneKg: r(2.2, 2.8, 1),
      bmrKcal: r(1250, 1400, 0),
      proteinPct: r(16, 20, 1),
      bodyAge: r(28, 36, 0),
      healthScore: r(78, 90, 0),
    };
  },

  bleFail() {
    this.clearTimers();
    this.showManual();
  },
  showManual() {
    this.setData({ stage: 'manual' });
  },
  onManualInput(e) {
    this.setData({ manualWeight: e.detail.value });
  },

  saveBle() {
    this.save(this.data.weight, 'ble', this._comp);
  },
  saveManual() {
    const w = Number(this.data.manualWeight);
    if (!w) {
      wx.showToast({ title: '请输入体重', icon: 'none' });
      return;
    }
    this.save(w, 'manual', null);
  },
  savePhoto() {
    const w = Number(this.data.manualWeight);
    if (!w) {
      wx.showToast({ title: '请输入体重', icon: 'none' });
      return;
    }
    this.save(w, 'photo', null);
  },

  save(weightKg, source, comp) {
    if (this.data.saving) return;
    this.setData({ saving: true });
    const body = { weightKg, source, isMorning: true, clientUuid: uuid() };
    if (comp) Object.assign(body, comp);
    request({ url: '/weights', method: 'POST', data: body })
      .then((res) => {
        wx.redirectTo({ url: '/pages/compare/compare?to=' + res.id });
      })
      .catch((err) => {
        this.setData({ saving: false });
        const msg =
          err && err.statusCode === 403
            ? '需先同意健康数据授权'
            : '保存失败，请重试';
        wx.showToast({ title: msg, icon: 'none' });
      });
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  },
});
