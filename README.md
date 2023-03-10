## EIP712 ERC20 Token Example

## Overview

A simple example of how to use EIP712 to sign a transaction for emergency ERC20 token transfer.

## Usage
One can register a backup address in the token contract using the `registerBackupAddress` function. This address will be used to sign transactions in case the primary address is lost. 
The backup address can be changed at any time using the `changeBackupAddress` function, but only if original address is not yet blacklisted.

When time comes to transfer tokens, original account can sign EIP712 message and send it to some another party. 
This party can then use the `transferFromWithSignature` function to transfer tokens from the original account to the backup address.

Signed message should contain:
1. `account` - original account that asks for emergency withdrawal
2. `backupAddress` - backup address that will receive tokens
3. `tokenAmount` - amount of tokens to transfer

## Setting up the project:
- Run `npm install` to install all dependencies.
- Run `npm run compile` to compile the contracts.

## Running the tests:
- Run `npm run test` to run the tests.

## Running the linter:
- Run `npm run prettier` to run the linter.


## Deployment
First, create a `.env` file in the root directory of the project and add the following variables:
```
GOERLI_PRIVATE_KEY=0x...
GOERLI_NODE_URL=https://goerli.infura.io/v3/...
```
OR 

```
MAINNET_PRIVATE_KEY=0x...
MAINNET_NODE_URL=https://mainnet.infura.io/v3/...
```

Then, run:

- Run `npm run deploy-goerli` to deploy to Goerli testnet or
- Run `npm run deploy-mainnet` to deploy to Mainnet.

to deploy to Mainnet.