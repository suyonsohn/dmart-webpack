var EStore = artifacts.require("./EStore.sol");

module.exports = function (deployer) {
    deployer.deploy(EStore, web3.eth.accounts[9]);
};
