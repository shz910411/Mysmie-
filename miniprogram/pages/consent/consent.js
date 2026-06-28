const { request } = require('../../utils/request');
const { CONSENT_VERSION } = require('../../config');

Page({
  data: { privacy: false, health: false },

  onPrivacyChange(e) {
    this.setData({ privacy: e.detail.value.length > 0 });
  },

  onHealthChange(e) {
    this.setData({ health: e.detail.value.length > 0 });
  },

  onAgree() {
    if (!this.data.privacy) {
      wx.showToast({ title: '请先同意隐私政策', icon: 'none' });
      return;
    }
    request({
      url: '/me/consents',
      method: 'POST',
      data: { type: 'privacy', version: CONSENT_VERSION.privacy },
    })
      .then(() => {
        if (!this.data.health) return null;
        return request({
          url: '/me/consents',
          method: 'POST',
          data: { type: 'health_data', version: CONSENT_VERSION.health_data },
        });
      })
      .then(() => wx.redirectTo({ url: '/pages/profile-setup/profile-setup' }))
      .catch(() => wx.showToast({ title: '提交失败', icon: 'none' }));
  },
});
