export const connectAuroWallet = async (): Promise<string | null> => {
  try {
    // 检查是否安装了Auro钱包
    if (typeof (window as any).mina === 'undefined') {
      alert('请先安装Auro钱包插件');
      return null;
    }

    // 请求连接钱包
    const accounts = await (window as any).mina.requestAccounts();
    
    if (accounts && accounts.length > 0) {
      console.log('Connected wallet address:', accounts[0]);
      return accounts[0];
    }
    return null;
  } catch (error) {
    console.error('连接钱包失败:', error);
    return null;
  }
}; 