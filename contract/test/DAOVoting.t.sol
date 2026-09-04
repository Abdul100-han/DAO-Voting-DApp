// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {GovToken} from "../src/GovToken.sol";
import {DAOVoting} from "../src/DAOVoting.sol";

contract DAOVotingTest is Test {
    GovToken public govToken;
    DAOVoting public governor;

    address public alice;
    address public bob;

    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether;
    uint256 public constant ALICE_ALLOCATION = 100_000 ether;
    uint256 public constant BOB_ALLOCATION = 50_000 ether;

    uint8 public constant VOTE_AGAINST = 0;
    uint8 public constant VOTE_FOR = 1;

    function setUp() public {
        alice = makeAddr("alice");
        bob = makeAddr("bob");

        govToken = new GovToken(INITIAL_SUPPLY);
        governor = new DAOVoting(govToken);

        assertTrue(govToken.transfer(alice, ALICE_ALLOCATION));
        assertTrue(govToken.transfer(bob, BOB_ALLOCATION));

        vm.prank(alice);
        govToken.delegate(alice);

        vm.prank(bob);
        govToken.delegate(bob);

        vm.roll(block.number + 1);
    }

    function _standardProposal()
        internal
        view
        returns (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description
        )
    {
        targets = new address[](1);
        targets[0] = address(govToken);

        values = new uint256[](1);
        values[0] = 0;

        calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", bob, 100);

        description = "Proposal #1: Transfer tokens to Bob";
    }

    function _proposeAsAlice() internal returns (uint256 proposalId) {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _standardProposal();

        vm.prank(alice);
        proposalId = governor.propose(targets, values, calldatas, description);
    }

    function test_ProposalLifecycle_Succeeds() public {
        uint256 proposalId = _proposeAsAlice();

        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Pending));
        assertEq(uint256(governor.state(proposalId)), 0);

        vm.roll(block.number + governor.votingDelay() + 1);
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Active));
        assertEq(uint256(governor.state(proposalId)), 1);

        vm.prank(alice);
        governor.castVote(proposalId, VOTE_FOR);

        vm.roll(block.number + governor.votingPeriod() + 1);
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Succeeded));
        assertEq(uint256(governor.state(proposalId)), 4);
    }

    function test_ProposalLifecycle_Defeated() public {
        uint256 proposalId = _proposeAsAlice();

        vm.roll(block.number + governor.votingDelay() + 1);
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Active));

        vm.prank(alice);
        governor.castVote(proposalId, VOTE_AGAINST);

        vm.prank(bob);
        governor.castVote(proposalId, VOTE_FOR);

        vm.roll(block.number + governor.votingPeriod() + 1);
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Defeated));
        assertEq(uint256(governor.state(proposalId)), 3);
    }

    function test_QuorumNotMet_Fails() public {
        address tinyVoter = makeAddr("tinyVoter");
        uint256 tinyBalance = 10 ether;

        assertTrue(govToken.transfer(tinyVoter, tinyBalance));
        vm.prank(tinyVoter);
        govToken.delegate(tinyVoter);
        vm.roll(block.number + 1);

        uint256 proposalId = _proposeAsAlice();

        vm.roll(block.number + governor.votingDelay() + 1);
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Active));

        vm.prank(tinyVoter);
        governor.castVote(proposalId, VOTE_FOR);

        assertLt(tinyBalance, governor.quorum(governor.proposalSnapshot(proposalId)));

        vm.roll(block.number + governor.votingPeriod() + 1);
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Defeated));
        assertEq(uint256(governor.state(proposalId)), 3);
    }
}
