const { request } = require('../../utils/request');

// 14 展示维度（顺序照蓝本 §3.4）。合规：不做"好/注意"价值判断，仅在指标下展示客观公开参考区间。
const METRICS = [
  { key: 'weightKg', name: '体重', unit: 'kg', d: 1 },
  { key: 'healthScore', name: '健康评分', unit: '', d: 0 },
  { key: 'bmi', name: 'BMI', unit: '', d: 1 },
  { key: 'bodyFatPct', name: '体脂率', unit: '%', d: 1 },
  { key: 'fatKg', name: '脂肪', unit: 'kg', d: 1 },
  { key: 'subcutFatPct', name: '皮下脂肪率', unit: '%', d: 1 },
  { key: 'visceralFatLevel', name: '内脏脂肪等级', unit: '', d: 0 },
  { key: 'waterPct', name: '水分', unit: '%', d: 1 },
  { key: 'skeletalMuscleKg', name: '骨骼肌', unit: 'kg', d: 1 },
  { key: 'muscleKg', name: '肌肉量', unit: 'kg', d: 1 },
  { key: 'boneKg', name: '骨量', unit: 'kg', d: 1 },
  { key: 'bmrKcal', name: '基础代谢', unit: 'kcal', d: 0 },
  { key: 'proteinPct', name: '蛋白质', unit: '%', d: 1 },
  { key: 'bodyAge', name: '体年龄', unit: '', d: 0 },
];

const QUOTES = [
  '阻挡你前进的从来不是高山大海，而是鞋底那粒小小的沙——今天也把它倒掉了。',
  '慢慢来，比较快。今天的坚持，是明天的底气。',
  '把每一次记录，都当作对自己的一次温柔确认。',
];

function fmt(v, d) {
  return v == null ? '—' : Number(v).toFixed(d);
}
function chgText(dv, d) {
  if (dv == null || dv === 0) return '—';
  return (dv < 0 ? '↓' : '↑') + Math.abs(dv).toFixed(d);
}
function daysBetween(a, b) {
  const diff = Math.round((new Date(b) - new Date(a)) / 86400000);
  return diff < 0 ? 0 : diff;
}
function dateLabel(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} 晨`;
}

// 客观公开参考区间（纯陈述、无判断色）。仅覆盖有公认公开标准的指标，其余留空。
function buildRefs(gender) {
  const bodyFat =
    gender === 'male' ? '男性参考 <20%'
      : gender === 'female' ? '女性参考 <25%'
        : '女性参考 <25% · 男性 <20%';
  return {
    bmi: '参考 18.5–23.9',
    bodyFatPct: bodyFat,
    visceralFatLevel: '参考 <10',
  };
}

Page({
  data: {
    loading: true,
    hasCompare: false,
    days: 0,
    wChg: '',
    fChg: '',
    quote: '',
    fromDate: '',
    toDate: '',
    rows: [],
    praise: [],
    analysis: '',
  },

  onLoad() {
    this.load();
  },

  load() {
    request({ url: '/me/weight-compare' })
      .then((res) => {
        if (!res || !res.from || !res.to) {
          this.setData({ loading: false, hasCompare: false });
          return null;
        }
        // 取性别以决定体脂率参考区间；失败则用中性合并区间
        return request({ url: '/me/profile' })
          .catch(() => null)
          .then((profile) => this.build(res, profile && profile.gender));
      })
      .catch(() => this.setData({ loading: false, hasCompare: false }));
  },

  build(res, gender) {
    const { from, to, deltas } = res;
    const refs = buildRefs(gender);
    const rows = METRICS.map((m) => ({
      name: m.name,
      ref: refs[m.key] || '',
      unit: m.unit,
      fromVal: fmt(from[m.key], m.d),
      toVal: fmt(to[m.key], m.d),
      chg: chgText(deltas[m.key], m.d),
      chgZero: deltas[m.key] === 0 || deltas[m.key] == null,
    }));
    this.setData({
      loading: false,
      hasCompare: true,
      days: daysBetween(from.measuredAt, to.measuredAt),
      wChg: chgText(deltas.weightKg, 1),
      fChg: chgText(deltas.fatKg, 1),
      quote: QUOTES[Math.floor(Math.random() * QUOTES.length)],
      fromDate: dateLabel(from.measuredAt),
      toDate: dateLabel(to.measuredAt),
      rows,
      praise: this.buildPraise(deltas),
      analysis:
        `本次较上次：体重 ${chgText(deltas.weightKg, 1)} kg、体脂率 ${chgText(deltas.bodyFatPct, 1)} %。` +
        '以上为体脂秤测量参考值，仅作个人记录。',
    });
  },

  buildPraise(d) {
    const p = [];
    if (d.weightKg != null && d.weightKg < 0) p.push('体重较上次有所下降');
    if (d.bodyFatPct != null && d.bodyFatPct < 0) p.push('体脂率较上次下降');
    if (d.healthScore != null && d.healthScore > 0) p.push('健康评分较上次提升');
    if (!p.length) p.push('坚持记录本身，就值得表扬');
    return p;
  },

  onShare() {
    wx.switchTab({ url: '/pages/summary/summary' });
  },
  onHome() {
    wx.switchTab({ url: '/pages/weigh/weigh' });
  },
  onBack() {
    wx.navigateBack({ delta: 1 });
  },
});
