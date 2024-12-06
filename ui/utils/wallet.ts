export const connectAuroWallet = async (): Promise<string | null> => {
  try {
    if (typeof (window as any).mina === 'undefined') {
      alert('请先安装Auro钱包插件');
      return null;
    }

    const accounts = await (window as any).mina.requestAccounts();
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('连接钱包失败:', error);
    return null;
  }
}; 