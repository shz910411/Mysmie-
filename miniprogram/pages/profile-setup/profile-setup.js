const { request } = require('../../utils/request');

Page({
  data: { gender: '', age: '', height: '' },

  onGender(e) {
    this.setData({ gender: e.detail.value });
  },
  onAge(e) {
    this.setData({ age: e.detail.value });
  },
  onHeight(e) {
    this.setData({ height: e.detail.value });
  },

  onSubmit() {
    const age = Number(this.data.age);
    const height = Number(this.data.height);
    if (!this.data.gender) {
      wx.showToast({ title: '请选择性别', icon: 'none' });
      return;
    }
    if (!age || !height) {
      wx.showToast({ title: '请填写年龄和身高', icon: 'none' });
      return;
    }
    request({
      url: '/me/profile',
      method: 'PUT',
      data: { gender: this.data.gender, age, heightCm: height },
    })
      .then(() => wx.reLaunch({ url: '/pages/weigh/weigh' }))
      .catch(() => wx.showToast({ title: '保存失败', icon: 'none' }));
  },
});
