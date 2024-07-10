// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Arrays.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import {IExecutor, TaskItem, TaskExt, TaskStatus, Ticket, TaskInfo, UserState, TaskInvite} from "./interfaces/IExecutor.sol";
import {IProxyNFTStation, DepositNFT} from "./interfaces/IProxyNFTStation.sol";
import {IProxyTokenStation} from "./interfaces/IProxyTokenStation.sol";
import {IHelper} from "./interfaces/IHelper.sol";
import {Validator} from "./libraries/Validator.sol";

contract Executor is IExecutor, ReentrancyGuardUpgradeable, OwnableUpgradeable {
    using SafeMath for uint256;
    using Arrays for uint256[];
    using Counters for Counters.Counter;
    Counters.Counter private ids;

    // ============ interfaces ============
    IHelper public HELPER;
    IProxyNFTStation public NFT;
    IProxyTokenStation public TOKEN;

    bool public isAllowTask;

    // ============ Public Mutable Storage ============

    mapping(uint256 => TaskItem) public tasks; // store tasks info by taskId
    mapping(uint256 => TaskInfo) public infos; // store task updated info (taskId=>TaskInfo)
    mapping(uint256 => mapping(uint256 => Ticket)) public tickets; // store tickets (taskId => ticketId => ticket)
    mapping(uint256 => uint256[]) public ticketIds; // store ticket ids (taskId => lastTicketIds)
    mapping(address => mapping(uint256 => UserState)) public userState; // Keep track of user ticket ids for a given taskId (user => taskId => userstate)
    mapping(address => uint256) public userCount; // Number of user joins

    mapping(uint256 => TaskInvite) private invites; // store task invite info (taskId=>TaskInvite)

    // ======== Constructor =========

    /**
     * @notice Constructor / initialize
     * @param _allowTask allow running task
     */
    function initialize(bool _allowTask) external initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        isAllowTask = _allowTask;
    }

    //  ============ Modifiers  ============

    modifier isExists(uint256 taskId) {
        require(exists(taskId), "not exists");
        _;
    }

    // ============ Public functions ============

    function count() public view override returns (uint256) {
        return ids.current();
    }

    function exists(uint256 taskId) public view override returns (bool) {
        return taskId > 0 && taskId <= ids.current();
    }

    function getTask(uint256 taskId)
        public
        view
        override
        returns (TaskItem memory)
    {
        return tasks[taskId];
    }

    function getInfo(uint256 taskId)
        public
        view
        override
        returns (TaskInfo memory)
    {
        return infos[taskId];
    }

    function isFail(uint256 taskId) public view override returns (bool) {
        return
            tasks[taskId].status == TaskStatus.Fail ||
            (tasks[taskId].amountCollected < tasks[taskId].targetAmount &&
                block.timestamp > tasks[taskId].endTime);
    }

    function getUserState(uint256 taskId, address user)
        external
        view
        override
        returns (UserState memory)
    {
        return userState[user][taskId];
    }

    function getUserCount(address user)
        external
        view
        override
        returns (uint256)
    {
        return userCount[user];
    }

    function createTask(TaskItem memory item, TaskExt memory ext)
        external
        payable
        override
        nonReentrant
    {
        require(address(NFT) != address(0), "ProxyNFT");

        // inputs validation
        Validator.checkNewTask(msg.sender, item);
        Validator.checkNewTaskNFTs(
            msg.sender,
            item.nftContract,
            item.tokenIds,
            item.tokenAmounts,
            HELPER
        );
        Validator.checkNewTaskExt(ext);

        // Transfer nfts to proxy station (NFTChain)
        // in case of dst chain transection fail, enable user redeem nft back, after endTime
        item.depositId = NFT.deposit(
            msg.sender,
            item.nftContract,
            item.tokenIds,
            item.tokenAmounts,
            item.endTime
        );

        // Create Task Item
        _createTask(item, ext);
    }

    /**
    @notice Use the original NFTs to reCreateTask
    Only if the task fails or can be cancelled
    and the NFTs has not been claimed
     */
    function reCreateTask(
        uint256 taskId,
        TaskItem memory item,
        TaskExt memory ext
    ) external payable override nonReentrant {
        Validator.checkReCreateTask(tasks, userState, taskId, item, ext);

        // update originTask claim info
        userState[tasks[taskId].seller][taskId].claimed = true;

        // update task status
        if (tasks[taskId].amountCollected > 0) {
            tasks[taskId].status = TaskStatus.Fail;
            emit CloseTask(taskId, msg.sender, tasks[taskId].status);
        } else {
            tasks[taskId].status = TaskStatus.Cancel;
            emit CancelTask(taskId, msg.sender);
        }

        // create new task
        _createTask(item, ext);
    }

    /**
    @notice buyer join a task
    num: how many ticket
    */
    function joinTask(
        address InvitePerson,
        uint256 taskId,
        uint32 num,
        string memory note
    ) external payable override isExists(taskId) nonReentrant {
        // check inputs and task
        Validator.checkJoinTask(tasks[taskId], msg.sender, num, note, HELPER);

        // Calculate number of TOKEN to this contract
        uint256 amount = tasks[taskId].price.mul(num);
        
        if( invites[taskId].balance[InvitePerson] == 0 ){
            invites[taskId].balanceKeys.push(InvitePerson);
        }
        invites[taskId].balance[InvitePerson] += num;

        // deposit payment to token station.
        TOKEN.deposit(
            msg.sender,
            tasks[taskId].acceptToken,
            amount
        );

        // create tickets
        uint256 lastTID = _createTickets(taskId, num, msg.sender);

        // update task item info
        if (tasks[taskId].status == TaskStatus.Pending) {
            tasks[taskId].status = TaskStatus.Open;
        }
        tasks[taskId].amountCollected = tasks[taskId].amountCollected.add(
            amount
        );

        //if reach target amount, trigger to close task
        if (tasks[taskId].amountCollected >= tasks[taskId].targetAmount) {
            if (address(HELPER.getAutoClose()) != address(0)) {
                HELPER.getAutoClose().addTask(taskId, tasks[taskId].endTime);
            }
        }

        emit JoinTask(taskId, msg.sender, amount, num, lastTID, note);
    }

    /**
    @notice seller cancel the task, only when task status equal to 'Pending' or no funds amount
    */
    function cancelTask(uint256 taskId)
        external
        payable
        override
        isExists(taskId)
        nonReentrant
    {
        require(
            (tasks[taskId].status == TaskStatus.Pending ||
                tasks[taskId].status == TaskStatus.Open) &&
                infos[taskId].lastTID <= 0,
            "Opening or canceled"
        );
        require(tasks[taskId].seller == msg.sender, "Owner"); // only seller can cancel

        // update status
        tasks[taskId].status = TaskStatus.Close;

        _withdrawNFTs(taskId, payable(tasks[taskId].seller));

        emit CancelTask(taskId, msg.sender);
    }

    /**
    @notice finish a Task, 
    case 1: reach target crowd amount, status success, and start to pick a winner
    case 2: time out and not reach the target amount, status close, and returns funds to claimable pool
    */
    function closeTask(uint256 taskId)
        external
        payable
        override
        isExists(taskId)
        nonReentrant
    {
        require(tasks[taskId].status == TaskStatus.Open, "Not Open");
        require(
            tasks[taskId].amountCollected >= tasks[taskId].targetAmount ||
                block.timestamp > tasks[taskId].endTime,
            "Not reach target or not expired"
        );

        // mark operation time
        infos[taskId].closeTime = block.timestamp;

        if (tasks[taskId].amountCollected >= tasks[taskId].targetAmount) {
            // Reached task target
            // update task, Task Close & start to draw
            tasks[taskId].status = TaskStatus.Close;

            // Request a random number from the generator based on a seed(max ticket number)
            HELPER.getVRF().reqRandomNumber(taskId, infos[taskId].lastTID);

            // add to auto draw Queue
            if (address(HELPER.getAutoDraw()) != address(0)) {
                HELPER.getAutoDraw().addTask(
                    taskId,
                    block.timestamp + HELPER.getDrawDelay()
                );
            }

            // cancel the auto close queue if seller open directly
            if (
                msg.sender == tasks[taskId].seller &&
                address(HELPER.getAutoClose()) != address(0)
            ) {
                HELPER.getAutoClose().removeTask(taskId);
            }
        } else {
            // Task Fail & Expired
            // update task
            tasks[taskId].status = TaskStatus.Fail;

            // NFTs back to seller
            _withdrawNFTs(taskId, payable(tasks[taskId].seller));
        }

        emit CloseTask(taskId, msg.sender, tasks[taskId].status);
    }

    /**
    @notice start to picker a winner via chainlink VRF
    */
    function pickWinner(uint256 taskId)
        external
        payable
        override
        isExists(taskId)
        nonReentrant
    {
        require(tasks[taskId].status == TaskStatus.Close, "Not Close");

        // get drawn number from Chainlink VRF
        uint32 finalNo = HELPER.getVRF().viewRandomResult(taskId);
        require(finalNo > 0, "Not Drawn");
        require(finalNo <= infos[taskId].lastTID, "finalNo");

        // find winner by drawn number
        Ticket memory ticket = _findWinner(taskId, finalNo);
        require(ticket.number > 0, "Lost winner");

        // update store item
        tasks[taskId].status = TaskStatus.Success;
        infos[taskId].finalNo = ticket.number;

        // withdraw NFTs to winner
        _withdrawNFTs(taskId, payable(ticket.owner));

        // dispatch Payment
        _payment(taskId, ticket.owner);

        emit PickWinner(taskId, ticket.owner, finalNo);
    }

     /**
    @notice when taskItem Fail, user can claim tokens back 
    */
    function claimTokens(uint256[] memory taskIds) override external nonReentrant
    {
        for (uint256 i = 0; i < taskIds.length; i++) {
            _claimToken(taskIds[i]);
        }
    }

    /**
    @notice when taskItem Fail, user can claim NFTs back (cross-chain case)
    */
    function claimNFTs(uint256[] memory taskIds) override external payable nonReentrant
    {  
        for (uint256 i = 0; i < taskIds.length; i++) {
            _claimNFTs(taskIds[i]);
        }
    }

    // ============ Internal functions ============

    function _createTask(TaskItem memory item, TaskExt memory ext) internal {
        require(isAllowTask, "Not allow");
        Validator.checkNewTaskRemote(item, HELPER);

        //create TaskId
        ids.increment();
        uint256 taskId = ids.current();

        // start now
        if (item.status == TaskStatus.Open) {
            item.startTime = item.startTime < block.timestamp
                ? item.startTime
                : block.timestamp;
        } else {
            require(
                block.timestamp <= item.startTime &&
                    item.startTime < item.endTime,
                "endTime"
            );
            // start in future
            item.status = TaskStatus.Pending;
        }

        //store taskItem
        tasks[taskId] = item;
        emit CreateTask(taskId, item, ext);
    }

    function _createTickets(
        uint256 taskId,
        uint32 num,
        address buyer
    ) internal returns (uint256) {
        uint256 start = infos[taskId].lastTID.add(1);
        uint256 lastTID = start.add(num).sub(1);

        tickets[taskId][lastTID] = Ticket(lastTID, num, buyer);
        ticketIds[taskId].push(lastTID);

        userState[buyer][taskId].num += num;
        infos[taskId].lastTID = lastTID;

        emit CreateTickets(taskId, buyer, num, start, lastTID);
        return lastTID;
    }

    function _withdrawNFTs(uint256 taskId, address payable user) internal {
        _doWithdrawNFTs(tasks[taskId].depositId, user);
    }

    function _doWithdrawNFTs(uint256 depositId, address user) internal {
        NFT.withdraw(depositId, user);
    }

    function _findWinner(uint256 taskId, uint32 number)
        internal
        view
        returns (Ticket memory)
    {
        // find by ticketId
        Ticket memory ticket = tickets[taskId][number];

        if (ticket.number == 0) {
            uint256 idx = ticketIds[taskId].findUpperBound(number);
            uint256 lastTID = ticketIds[taskId][idx];
            ticket = tickets[taskId][lastTID];
        }

        return ticket;
    }


    /**
     * @notice transfer protocol fee and funds
     * @param taskId taskId
     * @param winner winner address
     * paymentStrategy for winner share is up to 50% (500 = 5%, 5,000 = 50%)
     */
    function _payment(uint256 taskId, address winner) internal
    {
        // inner variables
        address acceptToken = tasks[taskId].acceptToken;

        // Calculate amount to seller
        uint256 collected = tasks[taskId].amountCollected;
        uint256 price = tasks[taskId].price;
        uint256 sellerAmount = collected;

        // 1. Calculate protocol fee
        uint256 fee = (collected.mul(HELPER.getProtocolFee())).div(10000);
        address feeRecipient = HELPER.getProtocolFeeRecipient();
        require(fee >= 0, "fee");
        sellerAmount = sellerAmount.sub(fee);

        // 3. transfer funds

        // transfer protocol fee
        _transferOut(acceptToken, feeRecipient, fee);
        emit TransferFee(taskId, feeRecipient, acceptToken, fee);     

       uint256 inviteFee = _share(taskId,collected,price,acceptToken);
         sellerAmount = sellerAmount.sub(inviteFee);
          

        // transfer funds to seller
        _transferOut(acceptToken, tasks[taskId].seller, sellerAmount);  

        emit TransferPayment(taskId, tasks[taskId].seller, acceptToken, sellerAmount);                    
    }

    function _share(  uint256 taskId,uint256 collected, uint256 price,address acceptToken) internal returns(uint256 inviteFee){
    // transfer share
        uint256 inviteFee =(collected.mul(HELPER.getProtocolInviteFee())).div(10000); 
      
        uint256 inviteFeeRate = HELPER.getProtocolInviteFee();
        address inviteFeeRecipient = HELPER.getProtocolInviteFeeRecipient();
        uint256 count = 0;
        TaskInvite storage invitesBytaskId = invites[taskId];
         for (uint i=0; i < invitesBytaskId.balanceKeys.length; i++) {   
                address splitAddr = invitesBytaskId.balanceKeys[i];
                uint256 splitAmount;
                {
                    splitAmount = price.mul(invitesBytaskId.balance[splitAddr]);
                }
                {
                     splitAmount = splitAmount.mul(inviteFeeRate).div(10000);
                }
                count += splitAmount;
                _transferOut(acceptToken, splitAddr, splitAmount);
                emit TransferShareAmount(taskId, splitAddr, acceptToken, splitAmount); 
            
         }

         uint256 residueInviteFee = inviteFee.sub(count);
         if(residueInviteFee > 0){
            _transferOut(acceptToken, inviteFeeRecipient, residueInviteFee);
            emit TransferShareAmount(taskId, inviteFeeRecipient, acceptToken, residueInviteFee); 
         }
         return inviteFee;
    }


    function _transferOut(address token, address to, uint256 amount) internal {        
        TOKEN.withdraw(to, token, amount);
    }  

        function _claimToken(uint256 taskId) internal isExists(taskId)
    {
        TaskItem storage item = tasks[taskId];
        require(isFail(taskId), "Not Fail");
        require(userState[msg.sender][taskId].claimed == false, "Claimed");

        // Calculate the funds buyer payed
        uint256 amount = item.price.mul(userState[msg.sender][taskId].num);
        
        // update claim info
        userState[msg.sender][taskId].claimed = true;
        
        // Transfer
        _transferOut(item.acceptToken, msg.sender, amount);

        emit ClaimToken(taskId, msg.sender, amount, item.acceptToken);
    }


    function _claimNFTs(uint256 taskId) internal isExists(taskId)
    {
        address seller = tasks[taskId].seller;
        require(isFail(taskId), "Not Fail");
        require(userState[seller][taskId].claimed == false, "Claimed");
        
        // update claim info
        userState[seller][taskId].claimed = true;
        
        // withdraw NFTs to winner (maybe cross chain)     
        _withdrawNFTs(taskId, payable(seller));

        emit ClaimNFT(taskId, seller, tasks[taskId].nftContract, tasks[taskId].tokenIds);
    }

        //  ============ onlyOwner  functions  ============

    function setAllowTask(bool enable) external onlyOwner {
        isAllowTask = enable;
    }

    function setHelper(IHelper addr) external onlyOwner {
        HELPER = addr;
    }

    function setProxy(IProxyTokenStation _token, IProxyNFTStation _nft) external onlyOwner {
        if (isAllowTask) {
            require(address(_token) != address(0x0), "TOKEN");
        }
        require(address(_nft) != address(0x0), "NFT");
        TOKEN = _token;
        NFT = _nft;
    }

        // ============ Remote(destination) functions ============
    
    function onLzReceive(uint8 functionType, bytes memory _payload) override external onlyOwner {
     
        if (functionType == 1) { //TYPE_CREATE_TASK
            (, TaskItem memory item, TaskExt memory ext) = abi.decode(_payload, (uint256, TaskItem, TaskExt));             

            _createTask(item, ext);
                    
        } else if (functionType == 2) { //TYPE_WITHDRAW_NFT
            (, address user, uint256 depositId) = abi.decode(_payload, (uint8, address, uint256));                        
            _doWithdrawNFTs(depositId, user);
        }
    } 
}


