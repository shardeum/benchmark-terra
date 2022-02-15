#!/usr/bin/env node
import fs from 'fs'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'
import { LCDClient, MnemonicKey, isTxError, MsgSend } from '@terra-money/terra.js';


/**
 * Connection to the network
 */
let terra: LCDClient


/**
 * Establish a connection to the cluster
 */
export async function establishConnection(port = 1317): Promise<void> {
  // connect to bombay testnet
  // const terra = new LCDClient({
  //   URL: 'https://bombay-lcd.terra.dev',
  //   chainID: 'bombay-12',
  // });

  // To use LocalTerra
  terra = new LCDClient({
    URL: `http://localhost:${port}`,
    chainID: 'chain-XanaQL'
  });

  // const marketParams = await terra.market.parameters();
  // const exchangeRates = await terra.oracle.exchangeRates();
  // console.log(marketParams.base_pool);
  // console.log(exchangeRates.get('uusd'));

  const blockInfo = await terra.tendermint.blockInfo();
  // console.log('blockInfo: ', blockInfo);

  const validatorSet = await terra.tendermint.validatorSet();
  // console.log('validatorSet: ', validatorSet);

  // const mk = new MnemonicKey({
  //   mnemonic: 'notice oak worry limit wrap speak medal online prefer cluster roof addict wrist behave treat actual wasp year salad speed social layer crew genius'
  // });
  // const mk = new MnemonicKey();
  // console.log(mk.mnemonic)

  // const wallet = terra.wallet(mk);

  // console.log("Checking address consistency", wallet.key.accAddress);

  // const msg = new MsgSend(
  //   wallet.key.accAddress,
  //   'terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp',
  //   { uluna: 100 }
  // )

  // const tx = await wallet.createAndSignTx({
  //   msgs: [msg],
  //   memo: "Here take this pity luna coin for your loss"
  // });

  // const txHash = await terra.tx.hash(tx);
  // console.log('txHash: ', txHash);

  // // Broadcast transaction
  // const txResult: any = await terra.tx.broadcast(tx);
  // console.log('logs: ', txResult.logs);

  // if (isTxError(txResult)) {
  //   throw new Error(`encountered an error while running the transaction: ${txResult.code} ${txResult.codespace}`);
  // }

  // // Check for events from the first message
  // const blockInfo2 = await terra.tendermint.blockInfo();
  // console.log('blockInfo: ', blockInfo2.block.data.txs);

  // const accountInfo = await terra.auth.accountInfo('terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp');
  // console.log('accountInfo: ', accountInfo);

  // get the current swap rate from 1 TerraUSD to TerraKRW
  // const offerCoin = new Coin('uusd', '1000000');
  // terra.market.swapRate(offerCoin, 'ukrw').then(c => {
  //   console.log(`${offerCoin.toString()} can be swapped for ${c.toString()}`);
  // });
}

interface spamOptions {
  duration: number
  rate: number,
  start: number,
  end: number,
  port: number
}

yargs(hideBin(process.argv))
  .command(
    'spam',
    'spam nodes for [duration] seconds at [rate] tps',
    () => { },
    async (argv: spamOptions) => {
      await establishConnection(argv.port)
      spam(argv)
    }
  )
  .option('duration', {
    alias: 'd',
    type: 'number',
    description: 'The duration (in seconds) to spam the network',
  })
  .option('start', {
    alias: 's',
    type: 'number',
    description: 'the start index to use from the accounts',
  })
  .option('end', {
    alias: 'e',
    type: 'number',
    description: 'the end index to use from the accounts',
  })
  .option('port', {
    alias: 'p',
    type: 'number',
    description: 'the end index to use from the accounts',
  })
  .option('rate', {
    alias: 'r',
    type: 'number',
    description: 'The rate (in tps) to spam the network at',
  }).argv

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, ms)
  })
}


interface accountsOptions {
  number: number
}

yargs(hideBin(process.argv))
  .command(
    'accounts',
    'generate accounts --number [number]',
    () => { },
    async (argv: accountsOptions) => {
      // await establishConnection()
      console.log('Creating accounts!!!')
      let privateAddresses = []
      let balanceAddresses = []
      let authAddresses = []
      for (let i = 0; i < argv.number; i++) {
        try {
          const mk = new MnemonicKey()
          const address = mk.accAddress

          const keys = {
            privateKey: mk.mnemonic,
            publicKey: address
          }
          privateAddresses.push(keys)
          const fundAccount = {
            "address": address,
            "coins": [
              {
                "denom": "node0token",
                "amount": "1000000000"
              },
              {
                "denom": "uluna",
                "amount": "500000000"
              }
            ]
          }
          balanceAddresses.push(fundAccount)
          const authAccount = {
            "@type": "/cosmos.auth.v1beta1.BaseAccount",
            "address": address,
            "pub_key": null,
            "account_number": "0",
            "sequence": "0"
          }
          authAddresses.push(authAccount)
        } catch (e) {
          console.log(e);
        }
      }
      try {
        fs.writeFileSync('balanceAddresses.json', JSON.stringify(balanceAddresses, null, 2))
        console.log(
          `Wrote ${argv.number} accounts in balanceAddresses.json`
        )
        fs.writeFileSync('authAddresses.json', JSON.stringify(authAddresses, null, 2))
        console.log(
          `Wrote ${argv.number} accounts in authAddresses.json`
        )
        fs.writeFileSync('privateAddresses.json', JSON.stringify(privateAddresses, null, 2))
        console.log(
          `Wrote ${argv.number} accounts in privateAddresses.json`
        )
      } catch (error) {
        console.log(`Couldn't write accounts to file: ${error.message}`)
      }

    }
  )
  .option('number', {
    alias: 'n',
    type: 'number',
    description: 'number of accounts',
  }).argv

function shuffle(array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}


const getRandomNumber = (maxNumber) => {
  return Math.floor(Math.random() * maxNumber);
}

function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}


const spam = async (argv: spamOptions) => {
  let tps = argv.rate
  let duration = argv.duration
  let txCount = tps * duration
  let start = argv.start ? argv.start : 0
  let accounts
  try {
    accounts = JSON.parse(fs.readFileSync('privateAddresses.json', 'utf8'))
    console.log(
      `Loaded ${accounts.length} account${accounts.length > 1 ? 's' : ''
      } from accounts.json`
    )
  } catch (error) {
    console.log(`Couldn't load accounts from file: ${error.message}`)
    return
  }
  let end = argv.end ? argv.end : accounts.length
  console.log(start, end)
  // Shuffling the accounts array not to run into issue when another client is also spamming at the same time
  // shuffle(accounts)


  let signedTxs = []
  for (let i = start; i < txCount + start; i++) {
    try {
      // console.log('Injected tx:', i + 1)
      const mk = new MnemonicKey({
        mnemonic: accounts[i].privateKey
      });

      const wallet = terra.wallet(mk);

      // const accountInfo = await terra.auth.accountInfo(accounts[i].publicKey);
      // console.log('accountInfo: ', accountInfo);

      const receiver = accounts[getRandomArbitrary(start, end)].publicKey
      // const newMK = new MnemonicKey()
      // const receiver = newMK.accAddress
      // console.log(receiver)
      const msg = new MsgSend(
        wallet.key.accAddress,
        receiver,
        { uluna: 100 }
      )

      const tx = await wallet.createAndSignTx({
        msgs: [msg],
        memo: "luna transfer"
      });

      signedTxs.push(tx)
    } catch (e) {
      console.log(e)
      // break
    }
  }
  const waitTime = (1 / tps) * 1000
  let lastTime = Date.now()
  let currentTime
  let sleepTime
  let elapsed
  let spamStartTime = Math.floor(Date.now() / 1000)
  let LatestBlockBeforeSpamming = await terra.tendermint.blockInfo();
  console.log('LatestBlockBeforeSpamming', LatestBlockBeforeSpamming.block.header.height)
  for (let i = 0; i < txCount; i++) {
    try {
      // console.log('Injected tx:', i + 1)

      // const txHash = await terra.tx.hash(tx);
      // // console.log('txHash: ', txHash);

      // Broadcast transaction
      // const txResult: any = await terra.tx.broadcastAsync(signedTxs[i]);
      // console.log('logs: ', txResult);

      // if (isTxError(txResult)) {
      //   throw new Error(`encountered an error while running the transaction: ${txResult.code} ${txResult.codespace}`);
      // }

      terra.tx.broadcastAsync(signedTxs[i]);

    } catch (e) {
      console.log(e)
    }

    currentTime = Date.now()
    elapsed = currentTime - lastTime
    sleepTime = waitTime - elapsed
    if (sleepTime < 0) sleepTime = 0
    if (sleepTime > 0) await sleep(sleepTime)
    lastTime = Date.now()
  }
  let spamEndTime = Math.floor(Date.now() / 1000)
  var timeDiff = spamEndTime - spamStartTime; //in ms
  // strip the ms
  // timeDiff /= 1000;
  // get seconds 
  var seconds = Math.round(timeDiff);

  let LatestBlockAfterSpamming = await terra.tendermint.blockInfo();
  console.log('LatestBlockAfterSpamming', LatestBlockAfterSpamming.block.header.height)
  console.log('totalSpammingTime', seconds)
}

interface blockOptions {
  output: string
}

yargs(hideBin(process.argv))
  .command(
    'check_tps',
    'get tps --output file.json',
    () => { },
    async (argv: blockOptions) => {
      await establishConnection()
      getTPS(argv)
    }
  )
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'To save the blocks info into a json file',
  }).argv

const getTPS = async (argv: blockOptions) => {
  let startblock
  let output = argv.output
  let startTime
  let endTime
  let endblock
  let totalTransactions = 0
  let blockInfo
  let latestBlock
  let transactionsSize
  let lastTime = 0
  let timeTaken
  let blockTimestamp
  while (true) {
    try {
      if (latestBlock)
        blockInfo = await terra.tendermint.blockInfo(latestBlock && latestBlock);
      else {
        blockInfo = await terra.tendermint.blockInfo()
        // console.log(blockInfo)
        latestBlock = parseInt(blockInfo.block.header.height)
      }
    } catch (e) {
      break
    }
    transactionsSize = blockInfo.block.data.txs.length
    blockInfo.transactionsSize = transactionsSize
    blockTimestamp = new Date(blockInfo.block.header.time).getTime()
    timeTaken = (lastTime - blockTimestamp) / 1000
    lastTime = blockTimestamp
    // console.log('block ', latestBlock, 'txs', transactionsSize, 'blockTime', timeTaken);
    if (endblock && transactionsSize === 0) {
      startblock = latestBlock
      startTime = blockTimestamp
      // console.log('block ', latestBlock, 'txs', transactionsSize, 'blockTime', timeTaken);
      fs.appendFile(output, JSON.stringify(blockInfo, null, 2), function (err) {
        if (err) throw err;
      });
      break
    }
    if (transactionsSize > 0) {
      totalTransactions = totalTransactions + parseInt(transactionsSize);
      if (!endblock) {
        endblock = latestBlock
        endTime = blockTimestamp
      }
      // console.log('block ', latestBlock, 'txs', transactionsSize, 'blockTime', timeTaken);
      fs.appendFile(output, JSON.stringify(blockInfo, null, 2), function (err) {
        if (err) throw err;
      });
    }
    latestBlock--
  }
  let averageTime = (endTime - startTime) / 1000;
  console.log('startTime', startTime, 'endBlock', endTime)
  console.log('startBlock', startblock, 'endBlock', endblock)
  console.log(`total time`, averageTime)
  console.log(`total txs:`, totalTransactions)
  console.log(`avg tps`, totalTransactions / averageTime)
}
