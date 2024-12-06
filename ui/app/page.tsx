'use client';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import { connectAuroWallet } from '../lib/wallet';

export default function Home() {
  const [taskId, setTaskId] = useState<string>('');
  const [solution, setSolution] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [taskList, setTaskList] = useState([
    {
      id: "1",
      difficulty: "中等",
      title: "数字锁破解",
      description: "一个安全数字锁使用4位数字密码，要求：\n• 数字之和等于15\n• 数字之积等于24\n• 所有数字都不相同\n请证明你找到了正确密码，但不要透露具体数字。",
      reward: "1 MINA",
      status: "进行中"
    }
  ]);
  const [error, setError] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { Mina, PublicKey } = await import('o1js');
      const { SecretHeist } = await import('../lib/contracts');

      // Update with your deployed contract address
      const zkAppAddress = 'B62qrGmRN4S8cDAuxm416bgrxwJWW5d5AmMYzRWKmB3MTa7TeSHzjWm';
      if (!zkAppAddress) {
        console.error('Please update zkAppAddress with your deployed SecretHeist contract address');
      }
      
      const zkApp = new SecretHeist(PublicKey.fromBase58(zkAppAddress));
    })();
  }, []);

  const handleTaskSelect = (task: any) => {
    setSelectedTask(task);
    setTaskId(task.id);
    setError('');  // Clear any previous errors
  };

  const handleSubmitSolution = async () => {
    setError('');
    
    if (!wallet) {
      setError('请先连接 Auro 钱包');
      await connectAuroWallet();
      return;
    }

    if (!taskId || !solution) {
      setError('请填写完整的任务编号和解决方案');
      return;
    }
    
    setLoading(true);
    try {
      const { Mina, PublicKey, Field } = await import('o1js');
      const { SecretHeist } = await import('../../contracts/build/src/');

      const network = Mina.Network({
        mina:'https://api.minascan.io/node/devnet/v1/graphql/',
        archive: 'https://api.minascan.io/archive/devnet/v1/graphql/'
      });
      Mina.setActiveInstance(network);
      const sender = PublicKey.fromBase58(wallet);

      const zkAppAddress = 'B62qrGmRN4S8cDAuxm416bgrxwJWW5d5AmMYzRWKmB3MTa7TeSHzjWm';
      const zkApp = new SecretHeist(PublicKey.fromBase58(zkAppAddress));

      const tx = await Mina.transaction(sender, async () => {
        await zkApp.submitSolution(Field(taskId), Field(solution));
      });

      await tx.prove();
      const jsonTx = tx.toJSON();
      const { hash } = await (window as any).mina.sendTransaction({
        transaction: jsonTx,
        feePayer: {
          fee: 0.3,
          memo: '',
        },
      });

      if (hash) {
        console.log('Transaction sent successfully:', hash);
        setError('');
        alert('证明提交成功！交易哈希: ' + hash);
      }

    } catch (error: any) {
      setError(error.message || '提交解决方案时发生错误，请重试');
      console.error('Error submitting solution:', error);
    }
    setLoading(false);
  };

  const handleWalletConnect = async () => {
    const address = await connectAuroWallet();
    if (address) {
      setWallet(address);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>秘密盗宝 - 零知识寻宝游戏</title>
        <meta name="description" content="一个基于零知识证明的寻宝游戏" />
        <link rel="icon" href="/assets/favicon.ico" />
      </Head>
      
      <main className={styles.main}>
        <div className={styles.gameContainer}>
          <div className={styles.walletSection}>
            <button 
              onClick={handleWalletConnect}
              className={styles.walletButton}
            >
              {wallet ? (
                <>
                  <span className={styles.walletIcon}>👛</span>
                  <span className={styles.walletAddress}>
                    {wallet.slice(0, 6)}...{wallet.slice(-4)}
                  </span>
                </>
              ) : (
                <>
                  <span className={styles.walletIcon}>🔌</span>
                  连接 Auro 钱包
                </>
              )}
            </button>
          </div>
          
          <div className={styles.header}>
            <h1 className={styles.titleGlow}>
              <span className={styles.titleGlow}>秘密盗宝</span>
            </h1>
            <p className={styles.subtitle}>
              精英盗贼网络：展示技巧，保守秘密
            </p>
          </div>

          <div className={styles.gameBoard}>
            <div className={styles.taskPanel}>
              <div className={styles.panelHeader}>
                <h2>可用任务</h2>
                <span className={styles.statusIndicator}>实时</span>
              </div>
              <div className={styles.taskList}>
                {taskList.map((task) => (
                  <div 
                    key={task.id} 
                    className={`${styles.taskCard} ${selectedTask?.id === task.id ? styles.selected : ''}`}
                    onClick={() => handleTaskSelect(task)}
                  >
                    <div className={styles.taskCardContent}>
                      <div className={styles.taskHeader}>
                        <span className={styles.taskId}>{task.id}</span>
                        <span className={`${styles.difficulty} ${styles[task.difficulty.toLowerCase()]}`}>
                          {task.difficulty}
                        </span>
                      </div>
                      
                      <h3 className={styles.taskTitle}>
                        <span className={styles.titleIcon}>🔒</span>
                        {task.title}
                      </h3>
                      
                      <div className={styles.taskDescription}>
                        <p style={{ whiteSpace: 'pre-line' }}>{task.description}</p>
                      </div>

                      <div className={styles.taskFooter}>
                        <div className={styles.rewardBadge}>
                          <span className={styles.rewardIcon}>💎</span>
                          <span className={styles.reward}>{task.reward}</span>
                        </div>
                        <span className={`${styles.statusBadge} ${styles[task.status.toLowerCase()]}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                    <div className={styles.cardGlow}></div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actionPanel}>
              <div className={styles.panelHeader}>
                <h2>行动指挥中心</h2>
                {selectedTask && (
                  <span className={styles.selectedTask}>当前任务: {selectedTask.title}</span>
                )}
              </div>
              <div className={styles.solutionForm}>
                <div className={styles.formGroup}>
                  <label>目标编号</label>
                  <input
                    type="text"
                    placeholder="点击左侧任务卡片自动填充"
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                    className={styles.gameInput}
                    disabled={loading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>解决方案哈希</label>
                  <input
                    type="text"
                    placeholder="输入你的解决方案证明"
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    className={styles.gameInput}
                    disabled={loading}
                  />
                  {error && <span className={styles.errorMessage}>{error}</span>}
                </div>
                <button 
                  onClick={handleSubmitSolution}
                  disabled={loading || !taskId || !solution}
                  className={`${styles.actionButton} ${loading ? styles.loading : ''}`}
                >
                  {loading ? (
                    <>
                      <span className={styles.loadingSpinner}></span>
                      正在执行任务...
                    </>
                  ) : '提交证明'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
