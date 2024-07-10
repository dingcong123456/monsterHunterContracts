// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Openluck interfaces
import {IExecutor, TaskItem, TaskStatus, Ticket} from "./IExecutor.sol";
import {IHelper} from "./IHelper.sol";

interface IRewards {        

    event RewardCreateTask(address seller, uint256 taskId);
    event RewardJoinTask(address user, uint256 taskId, address acceptToken, uint256 amount);
    event RewardTaskSucess(uint256 taskId);
    event RewardTaskFail(uint256 taskId);   

    function getInviter(address invitee) view external returns (address);
    function invite(address invitee, address inviter) external;

    function rewardCreateTask(address seller, uint256 taskId) external;
    function rewardJoinTask(address user, uint256 taskId, address acceptToken, uint256 amount) external;
    function rewardTaskSucess(uint256 taskId) external;
    function rewardTaskFail(uint256 taskId) external;   

}