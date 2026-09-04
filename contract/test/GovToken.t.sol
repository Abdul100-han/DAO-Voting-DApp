// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GovToken} from "../src/GovToken.sol";

contract GovTokenTest is Test {
    GovToken public token;

    address public alice;
    address public bob;

    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether;
    uint256 public constant ALICE_ALLOCATION = 100_000 ether;
    uint256 public constant BOB_ALLOCATION = 50_000 ether;

    function setUp() public {
        alice = makeAddr("alice");
        bob = makeAddr("bob");

        token = new GovToken(INITIAL_SUPPLY);

        token.transfer(alice, ALICE_ALLOCATION);
        token.transfer(bob, BOB_ALLOCATION);
    }

    function test_InitialSupplyAndBalances() public view {
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(alice), ALICE_ALLOCATION);
        assertEq(token.balanceOf(bob), BOB_ALLOCATION);
        assertEq(token.balanceOf(address(this)), INITIAL_SUPPLY - ALICE_ALLOCATION - BOB_ALLOCATION);
    }

    function test_DelegationUpdatesVotingPower() public {
        assertEq(token.getVotes(alice), 0);

        vm.prank(alice);
        token.delegate(alice);

        assertEq(token.getVotes(alice), token.balanceOf(alice));
        assertEq(token.getVotes(alice), ALICE_ALLOCATION);
        assertEq(token.delegates(alice), alice);
    }

    function test_PastVotesSnapshot() public {
        vm.prank(alice);
        token.delegate(alice);

        uint256 votesBeforeTransfer = token.getVotes(alice);
        assertEq(votesBeforeTransfer, ALICE_ALLOCATION);

        uint256 pastBlock = block.number;
        vm.roll(block.number + 1);

        uint256 transferAmount = 25_000 ether;
        vm.prank(alice);
        token.transfer(bob, transferAmount);

        assertEq(token.getPastVotes(alice, pastBlock), votesBeforeTransfer);
        assertEq(token.getPastVotes(alice, pastBlock), ALICE_ALLOCATION);
        assertEq(token.getVotes(alice), ALICE_ALLOCATION - transferAmount);
        assertEq(token.balanceOf(alice), ALICE_ALLOCATION - transferAmount);
    }

    function test_DelegateToThirdParty() public {
        uint256 aliceBalance = token.balanceOf(alice);
        uint256 bobBalance = token.balanceOf(bob);
        uint256 bobVotesBefore = token.getVotes(bob);

        assertEq(bobVotesBefore, 0);

        vm.prank(alice);
        token.delegate(bob);

        assertEq(token.balanceOf(alice), aliceBalance);
        assertEq(token.balanceOf(bob), bobBalance);
        assertEq(token.getVotes(bob), bobVotesBefore + aliceBalance);
        assertEq(token.getVotes(bob), ALICE_ALLOCATION);
        assertEq(token.getVotes(alice), 0);
        assertEq(token.delegates(alice), bob);
    }
}
