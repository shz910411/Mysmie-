const { request } = require('../../utils/request');

Page({
  data: {
    todayDate: '',
    hasToday: false,
    weight: '',
    spark: [],
  },

  onShow() {
    this.setData({ todayDate: this.formatToday() });
    this.loadLatest();
    this.loadSpark();
  },

  formatToday() {
    const d = new Date();
    const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${wk}`;
  },

  // 今晨体重（真实）：今日有称显数值，否则「今天还没称」
  loadLatest() {
    request({ url: '/me/weight/latest' })
      .then((res) => {
        if (res && res.record && res.isToday) {
          this.setData({ hasToday: true, weight: res.record.weightKg });
        } else {
          this.setData({ hasToday: false });
        }
      })
      .catch(() => this.setData({ hasToday: false })); // 未同意健康数据(403)优雅降级
  },

  // 近七天 spark（真实晨起记录，按体重归一化柱高）
  loadSpark() {
    request({ url: '/weights?range=7d' })
      .then((list) => {
        if (!Array.isArray(list) || list.length === 0) {
          this.setData({ spark: [] });
          return;
        }
        const ws = list.map((r) => r.weightKg).filter((w) => typeof w === 'number');
        const min = Math.min(...ws);
        const max = Math.max(...ws);
        const span = max - min || 1;
        const spark = list.map((r, i) => ({
          h: Math.round(20 + ((r.weightKg - min) / span) * 34),
          hl: i === list.length - 1,
        }));
        this.setData({ spark });
      })
      .catch(() => this.setData({ spark: [] }));
  },

  onStartWeigh() {
    wx.navigateTo({ url: '/pages/weighing/weighing' });
  },
  onManual() {
    wx.navigateTo({ url: '/pages/weighing/weighing?mode=manual' });
  },
  onCamera() {
    wx.switchTab({ url: '/pages/meal/meal' });
  },
  onSummary() {
    wx.switchTab({ url: '/pages/summary/summary' });
  },
  onService() {
    wx.showToast({ title: '共享功能将于后续开放', icon: 'none' });
  },
  onNotices() {
    wx.showToast({ title: '通知中心将于后续开放', icon: 'none' });
  },
});
