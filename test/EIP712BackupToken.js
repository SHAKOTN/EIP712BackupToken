const { expect } = require("chai");
const { ethers } = require("hardhat");
const { utils } = require("ethers");

async function signTypedData(account, backupAccount, chainId, token) {
  const domain = {
    name: "Backup Token",
    version: "1",
    chainId: chainId,
    verifyingContract: token.address,
  };
  const types = {
    EmergencyTransfer: [
      { name: "account", type: "address" },
      { name: "backupAddress", type: "address" },
    ],
  };
  const message = {
    account: account.address,
    backupAddress: backupAccount.address,
  };
  const signature = await account._signTypedData(domain, types, message);
  return utils.splitSignature(signature);
}

describe("BackupToken", function () {
  let bonnie;
  let owner;
  let clyde;
  let daisy;
  let bonnieBackup;
  let token;

  beforeEach(async function () {
    [owner, bonnie, clyde, daisy, bonnieBackup] = await ethers.getSigners();
    const initAmount = 10000000000000;
    const Token = await ethers.getContractFactory("EIP712BackupToken");
    token = await Token.deploy(initAmount);
  });

  describe("Register Backup Address", function () {
    it("should register backup address", async function () {
      await token.connect(bonnie).registerBackupAddress(clyde.address);
      expect(await token.backupAddressOf(bonnie.address)).to.equal(
        clyde.address
      );
    });
    it("should change backup address", async function () {
      await token.connect(bonnie).registerBackupAddress(clyde.address);
      expect(await token.backupAddressOf(bonnie.address)).to.equal(
        clyde.address
      );
      await token.connect(bonnie).registerBackupAddress(daisy.address);
      expect(await token.backupAddressOf(bonnie.address)).to.equal(
        daisy.address
      );
    });
  });
  describe("Transfer Tokens via Signature", function () {
    it("should transfer tokens via signature", async function () {
      const initialAmnt = 1000;
      const chainId = await bonnie.getChainId();
      // Give some tokens from owner to bonnie first:
      await token.connect(owner).transfer(bonnie.address, 1000);
      expect(await token.balanceOf(bonnie.address)).to.equal(1000);

      await token.connect(bonnie).registerBackupAddress(bonnieBackup.address);
      expect(await token.backupAddressOf(bonnie.address)).to.equal(
        bonnieBackup.address
      );

      // Generate signature
      const sig = await signTypedData(bonnie, bonnieBackup, chainId, token);
      // Do emergency transfer
      await token
        .connect(clyde)
        .transferViaSignature(
          bonnie.address,
          bonnieBackup.address,
          sig.v,
          sig.r,
          sig.s
        );
      // Make sure bonnie balance is 0 and bonnieBackup balance is initialAmnt
      expect(await token.balanceOf(bonnie.address)).to.equal(0);
      expect(await token.balanceOf(bonnieBackup.address)).to.equal(initialAmnt);
    });
    it("should fail after tokens were transferred", async function () {
      const initialAmnt = 1000;
      const chainId = await bonnie.getChainId();
      // Give some tokens from owner to bonnie first:
      await token.connect(owner).transfer(bonnie.address, 1000);
      expect(await token.balanceOf(bonnie.address)).to.equal(1000);

      await token.connect(bonnie).registerBackupAddress(bonnieBackup.address);
      expect(await token.backupAddressOf(bonnie.address)).to.equal(
        bonnieBackup.address
      );

      // Generate signature
      const sig = await signTypedData(bonnie, bonnieBackup, chainId, token);
      // Do emergency transfer
      await token
        .connect(clyde)
        .transferViaSignature(
          bonnie.address,
          bonnieBackup.address,
          sig.v,
          sig.r,
          sig.s
        );
      // Make sure bonnie balance is 0 and bonnieBackup balance is initialAmnt
      expect(await token.balanceOf(bonnie.address)).to.equal(0);
      expect(await token.balanceOf(bonnieBackup.address)).to.equal(initialAmnt);
      // Make sure it fails after tokens were transferred
      await expect(
        token
          .connect(clyde)
          .transferViaSignature(
            bonnie.address,
            bonnieBackup.address,
            sig.v,
            sig.r,
            sig.s
          )
      ).to.be.revertedWith("Recipient is blacklisted");
    });
    it("should fail if backup address is not registered", async function () {
      const chainId = await bonnie.getChainId();
      // Give some tokens from owner to bonnie first:
      await token.connect(owner).transfer(bonnie.address, 1000);
      expect(await token.balanceOf(bonnie.address)).to.equal(1000);

      // Generate signature
      const sig = await signTypedData(bonnie, bonnieBackup, chainId, token);
      // Do emergency transfer
      await expect(
        token
          .connect(clyde)
          .transferViaSignature(
            bonnie.address,
            bonnieBackup.address,
            sig.v,
            sig.r,
            sig.s
          )
      ).to.be.revertedWith("Invalid backup address");
    });
    it("should fail if backup address is not the same as the one in the signature", async function () {
      const chainId = await bonnie.getChainId();
      // Give some tokens from owner to bonnie first:
      await token.connect(owner).transfer(bonnie.address, 1000);
      expect(await token.balanceOf(bonnie.address)).to.equal(1000);

      await token.connect(bonnie).registerBackupAddress(bonnieBackup.address);
      expect(await token.backupAddressOf(bonnie.address)).to.equal(
        bonnieBackup.address
      );

      // Generate signature with a different backup address
      const sig = await signTypedData(bonnie, clyde, chainId, token);
      // Do emergency transfer
      await expect(
        token
          .connect(clyde)
          .transferViaSignature(
            bonnie.address,
            bonnieBackup.address,
            sig.v,
            sig.r,
            sig.s
          )
      ).to.be.revertedWith("Invalid signature");
    });
    it("should fail if signature is invalid", async function () {
      const chainId = await bonnie.getChainId();
      // Give some tokens from owner to bonnie first:
      await token.connect(owner).transfer(bonnie.address, 1000);

      await token.connect(bonnie).registerBackupAddress(bonnieBackup.address);
      expect(await token.backupAddressOf(bonnie.address)).to.equal(
        bonnieBackup.address
      );

      // Generate signature with another chainid
      const sig = await signTypedData(bonnie, bonnieBackup, 123, token);
      // Do emergency transfer
      await expect(
        token
          .connect(clyde)
          .transferViaSignature(
            bonnie.address,
            bonnieBackup.address,
            sig.v,
            sig.r,
            sig.s
          )
      ).to.be.revertedWith("Invalid signature");
    });
  });
});
