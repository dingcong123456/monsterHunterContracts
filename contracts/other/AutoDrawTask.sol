// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Chainlink contracts
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// interfaces

import "./AutoTask.sol";

contract AutoDrawTask is AutoTask, KeeperCompatibleInterface {
    using SafeMath for uint256;

    // add a little more quote fee 0.000001
    uint256 public QUOTE_FEE_ADD = 1000000000000;

    /***
     * @param _keeperRegAddr The address of the keeper registry contract
     * @param _executor The LucksExecutor contract
     * @param _bridge The LucksBridge contract
     */
    constructor(address _keeperRegAddr, IExecutor _executor)
        AutoTask(_keeperRegAddr, _executor)
    {
        DST_GAS_AMOUNT = 550000;
    }

    //  ============ internal  functions  ============

    function invokeTasks(uint256[] memory _taskIds) internal override {
        for (uint256 i = 0; i < _taskIds.length; i++) {
            uint256 taskId = _taskIds[i];
            _removeTask(taskId);
            try EXECUTOR.pickWinner(taskId) {} catch (
                bytes memory reason
            ) {
                emit RevertInvoke(taskId, _getRevertMsg(reason));
            }
        }
    }

    //  ============ Keeper  functions  ============

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        whenNotPaused
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256[] memory ids = getQueueTasks();
        upkeepNeeded = ids.length > 0;
        performData = abi.encode(ids);
        return (upkeepNeeded, performData);
    }

    function performUpkeep(bytes calldata performData)
        external
        override
        whenNotPaused
        onlyKeeper
    {
        uint256[] memory ids = abi.decode(performData, (uint256[]));
        invokeTasks(ids);
    }

    //  ============ onlyOwner  functions  ============

    function setQuoteFeeAdd(uint256 amount) external onlyOwner {
        QUOTE_FEE_ADD = amount;
    }
}
