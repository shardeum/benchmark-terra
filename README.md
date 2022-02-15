## Terra TPS Test for Coin Transfer

##### Hardware: dedicated server at `nocix.net`

- Processor 2x E5-2660 @ 2.2GHz / 3GHz Turbo 16 Cores / 32 thread
- Ram 96 GB DDR3
- Disk 960 GB SSD
- Bandwidth 1Gbit Port: 200TB Transfer
- Operating System Ubuntu 18.04 (Bionic)

##### Network setup

- A network of 5 validators was run.
- All nodes are run with docker instances in different ports.

##### Test setup for native coin transfer

- 60000 accounts were loaded in the genesis block with 1000 LUNA each
- 40000 native coin txs were submitted to the network as fast as possible
  - Each tx moved 1 LUNA between two different randomly chosen accounts
  - The number of accounts was chosen to be equal to the number of total txs so that there would be a low chance of a tx getting rejected due to another transaction from the same account still pending.

##### Test result

- Tests are taken starting from 1000 tps to 4000 tps for 10 seconds. Time between the start of the test and the last block to process txs from the test was measured.
- I find that TPS varies according to the **mempool** size value in the network. To change the value, look into step no.4.
- 5000 is the default mempool value when configuration files are created.

1.  mempool = 5000
    Total txs / rate + spammers = Avg TPS

    ```
     5000 / 500 + 2 = 312
     8000 / 200 + 4 = 158 (6301 txs processed) , 169 (5912)
    10000 / 250 + 4 = 168 (7329 txs processed)
    10000 / 500 + 2 = 182 (5509 txs processed)
    ```

2.  mempool = 10000
    Total txs / rate + spammers = Avg TPS

    ```
    10000 / 250 + 4 = 911 , 600
    10000 / 500 + 2 = 312 , 309
    20000 / 1000 + 2 = 337 (18683 txs processed) , 215
    20000 / 500 + 4 = 321 , 271
    ```

3.  mempool = 20000
    Total txs / rate + spammers = Avg TPS

    ```
    20000 /  500 + 4 = 3683 (It includes all 20000 txs into one block)
    40000 / 1000 + 4 = 395 , 450 , 535
    ```

##### Instructions to recreate this test:

1.  System Requirements in the testing machine.
    1. sudo apt-get install -y build-essential
    2. [Go](https://go.dev/dl/)
    3. Docker
    4. [https://docs.terra.money/docs/full-node/run-a-full-terra-node/build-terra-core.html](https://docs.terra.money/docs/full-node/run-a-full-terra-node/build-terra-core.html)
2.  In order to run 5 nodes network, we must edit some configs in the code.

    1.  First, edit Makefile under Terra [core](https://github.com/terra-money/core) repo.

        1. Search this line _localnet-start: build-linux localnet-stop_ and modify it.
        2. Change it to _localnet-start: build-linux_.
        3. Set _--v 4_ to _--v 5_ in the line that starts with* terramoney/terrad-env testnet*.
        4. Delete the _docker-compose up -d_ code.
        5. The code will look like this.

           ```
           localnet-start: build-linux
              $(if $(shell $(DOCKER) inspect -f '{{ .Id }}' terramoney/terrad-env 2>/dev/null),$(info found image terramoney/terrad-env),$(MAKE) -C contrib/images terrad-env)
              if ! [ -f build/node0/terrad/config/genesis.json ]; then $(DOCKER) run --rm \
                  --user $(shell id -u):$(shell id -g) \
                  -v $(BUILDDIR):/terrad:Z \
                  -v /etc/group:/etc/group:ro \
                  -v /etc/passwd:/etc/passwd:ro \
                  -v /etc/shadow:/etc/shadow:ro \
                  terramoney/terrad-env testnet --v 5 -o . --starting-ip-address 192.168.10.2 --keyring-backend=test ; fi
           ```

    2.  Now edit the docker-compose.yml.

        Configure 1317 port and node no.5 info in it.

        ```
        version: '3'

        services:
         terradnode0:
           container_name: terradnode0
           image: "terramoney/terrad-env"
           ports:
             - "9090:9090"
             - "26656-26657:26656-26657"
             - "1317:1317"
           environment:
             - ID=0
             - LOG=$${LOG:-terrad.log}
           volumes:
             - ./build:/terrad:Z
           networks:
             localnet:
               ipv4_address: 192.168.10.2

         terradnode1:
           container_name: terradnode1
           image: "terramoney/terrad-env"
           ports:
             - "9091:9090"
             - "26659-26660:26656-26657"
             - "1318:1317"
           environment:
             - ID=1
             - LOG=$${LOG:-terrad.log}
           volumes:
             - ./build:/terrad:Z
           networks:
             localnet:
               ipv4_address: 192.168.10.3

         terradnode2:
           container_name: terradnode2
           image: "terramoney/terrad-env"
           environment:
             - ID=2
             - LOG=$${LOG:-terrad.log}
           ports:
             - "9092:9090"
             - "26661-26662:26656-26657"
             - "1319:1317"
           volumes:
             - ./build:/terrad:Z
           networks:
             localnet:
               ipv4_address: 192.168.10.4

         terradnode3:
           container_name: terradnode3
           image: "terramoney/terrad-env"
           environment:
             - ID=3
             - LOG=$${LOG:-terrad.log}
           ports:
             - "9093:9090"
             - "26663-26664:26656-26657"
             - "1320:1317"
           volumes:
             - ./build:/terrad:Z
           networks:
             localnet:
               ipv4_address: 192.168.10.5

         terradnode4:
           container_name: terradnode4
           image: "terramoney/terrad-env"
           environment:
             - ID=4
             - LOG=$${LOG:-terrad.log}
           ports:
             - "9094:9090"
             - "26665-26666:26656-26657"
             - "1321:1317"
           volumes:
             - ./build:/terrad:Z
           networks:
             localnet:
               ipv4_address: 192.168.10.6

        networks:
         localnet:
           driver: bridge
           ipam:
             driver: default
             config:
             -
               subnet: 192.168.10.0/16
        ```

    3.  Make the nodes’ data directory and configuration files. The files will be under the _build_ folder.
        - `make localnet-start`
    4.  Follow step no.3(3) to make accounts for this test.
    5.  After creating the accounts, add these accounts to genesis.json to fund some balances.

        1. The genesis.json file is placed at core/build/node\*/terrad/config/genesis.json.
           You need to edit each node’s genesis file.
           or
           Edit in one of the node’s genesis file and copy it to all nodes. eg.
           `cp build/node1/terrad/config/genesis.json build/node2/terrad/config/genesis.json`

        2. First, add the accounts from authAddresses.json file.

           ```
           "app_state": {
              "auth": {
                "params": {
                  "max_memo_characters": "256",
                  "tx_sig_limit": "7",
                  "tx_size_cost_per_byte": "10",
                  "sig_verify_cost_ed25519": "590",
                  "sig_verify_cost_secp256k1": "1000"
                },
                "accounts": [
                  {
                    "@type": "/cosmos.auth.v1beta1.BaseAccount",
                    "address": "terra164fqwel3q8gxh88kwx28e9j7q8jxwh9uejl4wz",
                    "pub_key": null,
                    "account_number": "0",
                    "sequence": "0"
                  },
                  ...pre-existed validators accounts
                  ...Add the accounts from authAddresses.json
                  {
                    "@type": "/cosmos.auth.v1beta1.BaseAccount",
                    "address": "terra194wzuq2n37d3lkcz04p03nzqhpvayse658mkkl",
                    "pub_key": null,
                    "account_number": "0",
                    "sequence": "0"
                  },
                  ...
           ```

        3. Secondly, add the accounts from balanceAddresses.json.

           ```
           "bank": {
                "params": {
                  "send_enabled": [],
                  "default_send_enabled": true
                },
                "balances": [
                  {
                    "address": "terra164fqwel3q8gxh88kwx28e9j7q8jxwh9uejl4wz",
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
                  },
                  ...pre-existed balances info for validators
                  ...Add the accounts from balancesAddresses.json
                  {
                    "address": "terra1jdfn7ljcqtl9hmlz0xcutymevs8vpq3cp5yacm",
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
                  },
                  ...
           ```

    6.  Copy the build folder as a backup. We need to test by changing **mempool** value with this created accounts and configured files. The current(default) **mempool** value is 5000.

        You can check it out in _build/node\*/terrad/config/config.toml_. Search this line

            _# Maximum number of transactions in the mempool_
            size = 5000

        - cp -r build build_backup

    7.  To start the network.
        - `docker-compose up -d`
    8.  Check the first node status.

        - curl [http://localhost:26657/status](http://localhost:26657/status)
          Save the chainID and add this in spam-client before spamming the network.

          e.g. **_"network": "chain-XanaQL"_**

    9.  To stop the network.
        - `docker-compose down`
    10. To delete the network files. Make sure you delete it before starting another network test.
        - `rm -fr build/node* build/gentxs`

3.  Custom Scripts used for running transactions to the network

    1.  [https://gitlab.com/shardeum/smart-contract-platform-comparison/terra](https://gitlab.com/shardeum/smart-contract-platform-comparison/terra)
    2.  cd spam-client && npm install && npm link
    3.  To generate accounts.
        - `spammer accounts --number [number]`
    4.  This will create

        - authAddresses.json - To add these accounts as step no.2(5)(2).
        - balanceAddresses.json - To add these accounts as step no.2(5)(3).
        - privateAddresses.json - These accounts are used when running the transactions.

    5.  Spam the network with these accounts and check the average TPS in each spam with step (6)

        1.  First edit the chainID variable in src/index with the value from
            curl [http://localhost:26657/status](http://localhost:26657/status)
            e.g. **_"network": "chain-XanaQL"_**

        2.  After editing, run `npm run prepare`
        3.  Command to spam the network.

            - spammer spam --duration [number] --rate [number] --start [accounts_start_index] --end [accounts_end_index] --port [port number]

                  If 2000 accounts are created,

                  e.g 100 transactions per second for 5 seconds to use 1000 accounts from 0 in first node port 1317
                  spammer spam --tps 100 --duration 5 --start 0 --end 1000 --port 1317

                  e.g 100 transactions per second for 5 seconds to use 1000 accounts from 1000 in second node port 1318
                  spammer spam --tps 100 --duration 5 --start 1000 --end 2000 --port 1318

    6.  Check the average TPS of the spam

        - `spammer check_tps --output [json_file_name]`
          e.g. spammer check_tps --output s1280.json

4.  Test by changing **mempool** size value.

    1.  Go to each node’s config.file.

        build_backup/node\*/terrad/config/config.toml.

    2.  Search this line

            # Maximum number of transactions in the mempool
            size = 5000

    3.  Change it to e.g. 10000.
    4.  Make sure you have stopped the network and cleaned the _build_ directory. And copy this modified _build_backup_ into _ build_ folder.
        1. `docker-compose down`
        2. `rm -fr build/node* build/gentxs`
        3. `cp -r build_backup/* build`
    5.  Now you can test again by starting the network.
