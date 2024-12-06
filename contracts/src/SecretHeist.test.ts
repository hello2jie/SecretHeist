import { SecretHeist } from './SecretHeist';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Poseidon,
  UInt64,
} from 'o1js';

describe('SecretHeist', () => {
  let deployerAccount: Mina.TestPublicKey,
      deployerKey: PrivateKey,
      senderAccount: Mina.TestPublicKey,
      senderKey: PrivateKey,
      zkApp: SecretHeist,
      zkAppPrivateKey: PrivateKey,
      zkAppAddress: PublicKey;

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);
    
    [deployerAccount, senderAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;
    
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new SecretHeist(zkAppAddress);
    const txn = await Mina.transaction({
        sender: deployerAccount,
      }, async () => {
        AccountUpdate.fundNewAccount(deployerAccount);
        await zkApp.deploy();
      });
      await txn.prove();
      await txn.sign([deployerKey, zkAppPrivateKey]).send();
  });

  it('should initialize with correct values', async () => {
    const taskCounter = zkApp.taskCounter.get();
    
    expect(taskCounter).toEqual(Field(0));
  });

  it('should create a new task', async () => {
    const secret = Field(123);
    const target = Poseidon.hash([secret]);
    const reward = Field(1000);
    const deadline = UInt64.from(Date.now() + 3600000); // 1 hour from now

    const txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.createTask(target, reward, deadline);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const taskCounter = await zkApp.taskCounter.get();
    const task = await zkApp.tasks.get();
    
    expect(taskCounter).toEqual(Field(1));
    expect(task.target).toEqual(target);
    expect(task.reward).toEqual(reward);
    expect(task.deadline).toEqual(deadline);
  });

  it('should successfully submit correct solution', async () => {
    // First create a task
    const secret = Field(123);
    const target = Poseidon.hash([secret]);
    const reward = Field(1000);
    const deadline = UInt64.from(Date.now() + 3600000);

    await (await Mina.transaction(deployerAccount, async () => {
      zkApp.createTask(target, reward, deadline);
    })).prove().then(tx => tx.sign([deployerKey, zkAppPrivateKey]).send());

    // Submit solution
    const txn = await Mina.transaction(senderAccount, async () => {
      zkApp.submitSolution(Field(0), secret);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // Verify task state
    const task = await zkApp.tasks.get();
    expect(task.id).toEqual(Field(0));
  });

  it('should fail when submitting wrong solution', async () => {
    const secret = Field(123);
    const target = Poseidon.hash([secret]);
    const reward = Field(1000);
    const deadline = UInt64.from(Date.now() + 3600000);

    await (await Mina.transaction(deployerAccount, async () => {
      zkApp.createTask(target, reward, deadline);
    })).prove().then(tx => tx.sign([deployerKey, zkAppPrivateKey]).send());

    const wrongSolution = Field(456);
    
    await expect(async () => {
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.submitSolution(Field(0), wrongSolution);
      });
      await txn.prove();
      await txn.sign([senderKey, zkAppPrivateKey]).send();
    }).rejects.toThrow();
  });
});
