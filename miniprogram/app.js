App({
  onLaunch() {
    // 未登录 → 跳登录页（S1→S2→S3 建档完成后 reLaunch 回首页）
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },
});
