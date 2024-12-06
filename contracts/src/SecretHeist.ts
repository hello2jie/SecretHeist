import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  Struct,
  Poseidon,
  Bool,
  UInt64,
} from 'o1js';

// 任务结构体
export class HeistTask extends Struct({
  id: Field,        // 任务ID
  target: Field,    // 目标哈希（可以是密码哈希或位置哈希）
  reward: Field,    // 奖励数量
  deadline: UInt64,  // 截止时间
}) {
  // 验证任务解决方案
  verifyTaskSolution(solution: Field): Bool {
    // 验证提交的解决方案哈希是否匹配目标哈希
    return Poseidon.hash([solution]).equals(this.target);
  }
}

export class SecretHeist extends SmartContract {
  // 状态变量
  @state(Field) taskCounter = State<Field>();
  
  // 任务映射 (使用 Field 来模拟)
  @state(HeistTask) tasks = State<HeistTask>();

  // Add events
  events = {
    'task-created': Field,
    'solution-submitted': Field,
  };

  // 初始化合约
  init() {
    super.init();
    this.taskCounter.set(Field(0));
  }

  // 创建新任务
  @method async createTask(target: Field, reward: Field, deadline: UInt64) {
    
    const currentCounter = this.taskCounter.get();
    this.taskCounter.requireEquals(this.taskCounter.get());
    const newTask = new HeistTask({
      id: currentCounter,
      target,
      reward,
      deadline,
    });
    
    // 更新状态
    this.tasks.set(newTask);
    this.taskCounter.set(currentCounter.add(1));
    
    // Emit task created event
    this.emitEvent('task-created', currentCounter);
  }

  // 提交任务解决方案
  @method async submitSolution(taskId: Field, solution: Field) {
    const task = this.tasks.get();
    this.tasks.requireEquals(this.tasks.get());
    // 确保任务存在且未完成
    task.id.assertEquals(taskId);
    
    // 验证当前时间是否在截止时间之前
    this.network.globalSlotSinceGenesis.requireEquals(this.network.globalSlotSinceGenesis.get());
    this.network.timestamp.get().lessThan(task.deadline).assertTrue();
    
    // 验证解决方案
    const isCorrect = task.verifyTaskSolution(solution);
    isCorrect.assertTrue();
    
    // 更新任务状态为已完成
    const completedTask = new HeistTask({
      ...task,
    });
    this.tasks.set(completedTask);
    
    // Emit solution submitted event before the method ends
    this.emitEvent('solution-submitted', taskId);
    
    // 这里可以添加奖励发放逻辑
  }
}
