// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {GovToken} from "../src/GovToken.sol";
import {DAOVoting} from "../src/DAOVoting.sol";

contract DeployDAO is Script {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        GovToken token = new GovToken(INITIAL_SUPPLY);
        DAOVoting governor = new DAOVoting(IVotes(address(token)));

        vm.stopBroadcast();

        console.log("GovToken deployed to:", address(token));
        console.log("DAOVoting deployed to:", address(governor));
    }
}
