'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../../styles/Home.module.css';
import { connectAuroWallet } from '../../utils/wallet';
import { useWallet } from '../../contexts/WalletContext';

export default function CreateTask() {
  const { wallet, setWallet } = useWallet();
  const [taskData, setTaskData] = useState({
    title: '',
    difficulty: '中等',
    description: '',
    reward: '',
    target: '',
    deadline: 7,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTaskData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConnectWallet = async () => {
    const account = await connectAuroWallet();
    if (account) {
      setWallet(account);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) {
      setError('请先连接 Auro 钱包');
      await connectAuroWallet();
      return;
    }

    setLoading(true);
    try {
      const { Mina, PublicKey, Field, Poseidon, UInt64 } = await import('o1js');
      const { SecretHeist } = await import('../../lib/contracts');

      await SecretHeist.compile();

      const network = Mina.Network({
        mina: 'https://api.minascan.io/node/devnet/v1/graphql/',
        archive: 'https://api.minascan.io/archive/devnet/v1/graphql/'
      });
      Mina.setActiveInstance(network);

      const zkAppAddress = 'B62qrGmRN4S8cDAuxm416bgrxwJWW5d5AmMYzRWKmB3MTa7TeSHzjWm';
      const zkApp = new SecretHeist(PublicKey.fromBase58(zkAppAddress));

      const tx = await Mina.transaction(
        PublicKey.fromBase58(wallet),
        async () => {
          const targetHash = Poseidon.hash([Field(taskData.target)]);
          const rewardInMina = parseFloat(taskData.reward.replace(' MINA', ''));
          const rewardAmount = Field(rewardInMina);
          const deadlineTimestamp = UInt64.from(Date.now() + (taskData.deadline * 24 * 60 * 60 * 1000));

          await zkApp.createTask(
            targetHash,
            rewardAmount,
            deadlineTimestamp
          );
        }
      );

   

      console.log('Generating proof...');
      await tx.prove();
      
      console.log('Sending transaction...');
      const { hash } = await (window as any).mina.sendTransaction({
        transaction: tx.toJSON(),
        feePayer: {
          fee:0.3,
          memo: 'Create Secret Heist Task',
        },
      });

      alert('任务创建成功！交易哈希: ' + hash);
      // 可以在这里添加重定向到主页的逻辑
    } catch (error: any) {
      setError(error.message || '创建任务失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>创建新任务 - 秘密盗宝</title>
        <meta name="description" content="创建新的寻宝任务" />
      </Head>

      <main className={styles.main}>
        <div className={styles.gameContainer}>
          <div className={styles.walletSection}>
            <button onClick={handleConnectWallet} className={styles.walletButton}>
              {wallet ? (
                <>
                  <span>👛</span>
                  <span>{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
                </>
              ) : (
                <>
                  <span>🔌</span>
                  连接 Auro 钱包
                </>
              )}
            </button>
          </div>

          <h1 className={styles.titleGlow}>创建新任务</h1>

          <form onSubmit={handleSubmit} className={styles.createTaskForm}>
            <div className={styles.formGroup}>
              <label>任务标题</label>
              <input
                type="text"
                name="title"
                value={taskData.title}
                onChange={handleInputChange}
                required
                className={styles.gameInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label>难度等级</label>
              <select
                name="difficulty"
                value={taskData.difficulty}
                onChange={handleInputChange}
                className={styles.gameInput}
              >
                <option value="简单">简单</option>
                <option value="中等">中等</option>
                <option value="困难">困难</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>任务描述</label>
              <textarea
                name="description"
                value={taskData.description}
                onChange={handleInputChange}
                required
                className={styles.gameInput}
                rows={5}
              />
            </div>

            <div className={styles.formGroup}>
              <label>奖励 (MINA)</label>
              <input
                type="text"
                name="reward"
                value={taskData.reward}
                onChange={handleInputChange}
                required
                className={styles.gameInput}
                placeholder="例如: 1 MINA"
              />
            </div>

            <div className={styles.formGroup}>
              <label>目标答案</label>
              <input
                type="text"
                name="target"
                value={taskData.target}
                onChange={handleInputChange}
                required
                className={styles.gameInput}
                placeholder="设置任务的答案"
              />
            </div>

            <div className={styles.formGroup}>
              <label>截止天数</label>
              <input
                type="number"
                name="deadline"
                value={taskData.deadline}
                onChange={handleInputChange}
                required
                className={styles.gameInput}
                min="1"
                max="30"
              />
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className={`${styles.actionButton} ${loading ? styles.loading : ''}`}
            >
              {loading ? '创建中...' : '创建任务'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
} 