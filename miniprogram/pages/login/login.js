const { request } = require('../../utils/request');
const { DEV } = require('../../config');

Page({
  data: { dev: DEV },

  // 微信正式登录（真机）
  onWxLogin() {
    wx.login({
      success: (r) => {
        request({ url: '/auth/login', method: 'POST', data: { code: r.code } })
          .then((res) => {
            wx.setStorageSync('token', res.token);
            wx.redirectTo({ url: '/pages/consent/consent' });
          })
          .catch(() => wx.showToast({ title: '登录失败，请重试', icon: 'none' }));
      },
    });
  },

  // 开发登录旁路（仅本地）
  onDevLogin() {
    request({ url: '/auth/dev-login', method: 'POST', data: {} })
      .then((res) => {
        wx.setStorageSync('token', res.token);
        wx.redirectTo({ url: '/pages/consent/consent' });
      })
      .catch(() => wx.showToast({ title: '开发登录失败', icon: 'none' }));
  },

  // 手机号授权（真机）
  onGetPhone(e) {
    if (!e.detail.code) {
      wx.showToast({ title: '已取消', icon: 'none' });
      return;
    }
    request({ url: '/auth/phone', method: 'POST', data: { code: e.detail.code } })
      .then(() => wx.showToast({ title: '手机号已绑定' }))
      .catch(() => wx.showToast({ title: '绑定失败', icon: 'none' }));
  },
});
