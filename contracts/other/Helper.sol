// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// OpenZeppelin contracts
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

//  interfaces
import {IExecutor, TaskItem, TaskExt, TaskStatus} from "../interfaces/IExecutor.sol";
import {IHelper} from "../interfaces/IHelper.sol";
import {IVRF} from "../interfaces/IVRF.sol";
import {IAuto} from "../interfaces/IAuto.sol";

import {IProxyNFTStation} from "../interfaces/IProxyNFTStation.sol";

/** @title  Helper.
 * @notice It is the contract for protocol settings
 */
contract Helper is IHelper, Ownable {
    using SafeMath for uint256;
    // ============  interfaces ============

    IExecutor public EXECUTOR;
    IVRF public VRF;

    IAuto public AUTO_CLOSE;  
    IAuto public AUTO_DRAW;  
    
    IProxyNFTStation public PROXY_PUNKS; 

    address public feeRecipient;    // protocol fee recipient

    uint256 public protocolInviteFee;
    address public inviteFeeRecipient;

    uint32 public MAX_PER_JOIN_NUM = 10000;    // limit user per jointask num (default 10000), to avoid block fail and huge gas fee
    uint32 public DRAW_DELAY_SEC = 120;    // picker winner need a delay time from task close. (default 120sec)
    uint256 public protocolFee = 500;     // acceptToken (500 = 5%, 1,000 = 10%)

    mapping(address => bool) public operators;     // protocol income balance (address => bool)
    mapping(address => bool) public acceptTokens;   // accept payment tokens (Chain Token equals to zero address)     
    mapping(address => uint256) public minTargetAmount;  // when seller create task, check the min targetAmount limit (token address => min amount)

    constructor(
        address[] memory _acceptTokens,
        address _recipient,
        uint256 _fee,
        address _inviteRecipient,
        uint256 _inviteFee,
        IExecutor  _executor,
        IVRF _vrf,
        IAuto _auto_close,
        IAuto _auto_draw        
    ) {
        feeRecipient = _recipient;
        protocolFee = _fee;
        inviteFeeRecipient = _inviteRecipient;
        protocolInviteFee = _inviteFee;
        EXECUTOR = _executor;
        VRF = _vrf;        
        AUTO_CLOSE = _auto_close;
        AUTO_DRAW = _auto_draw;
        setAcceptTokens(_acceptTokens, true);
    }

    modifier onlyOperator() {
        require(msg.sender == owner() || operators[msg.sender], "onlyOperator");
        _;
    }

    function getMinTargetLimit(address token) external view override returns (uint256) {
        return minTargetAmount[token];
    }

    function checkPerJoinLimit(uint32 num) public view override returns (bool) {
        return MAX_PER_JOIN_NUM < 1 || num <= MAX_PER_JOIN_NUM;
    }

    /**
    @notice check acceptToken support
    @param acceptToken token address, blockchain token is address(0)
    @return bool
    */
    function checkAcceptToken(address acceptToken)
        public
        view
        override
        returns (bool)
    {
        return acceptTokens[acceptToken];
    }

    /**
     * @notice check nft contract, support erc721 & erc1155
     */
    function checkNFTContract(address addr) public view override returns (bool) {
        require(addr != address(0) && Address.isContract(addr), "nft");
        require(            
            IERC165(addr).supportsInterface(0x80ac58cd) ||  // ERC721 interfaceID
            IERC165(addr).supportsInterface(0xd9b67a26), // ERC1155 interfaceID
            "Invalid contract"
        );
        return true;
    }


    /**
     * @notice check the new task inputs
     */
    function checkNewTask(address user, TaskItem memory item) public view override returns(bool) { 

        require(item.seller != address(0) && item.seller == user, "seller");          
        require(item.tokenIds.length > 0, "tokenIds");
        require(block.timestamp < item.endTime, "endTime");
         require(item.endTime - block.timestamp > 84600 && item.endTime - block.timestamp < 2678400, "duration"); // at least 23.5 hour, 31 days limit
        require(item.price > 0 && item.price < item.targetAmount && item.targetAmount.mod(item.price) == 0,"price or targetAmount");

        uint num = item.targetAmount.div(item.price);
        require(num > 0 && num <= 100000 && num.mod(10) == 0, "num");

        require(item.amountCollected == 0, "collect");    
       
        // check nftContract
        require(checkNFTContract(item.nftContract), "nft");
        (bool checkState, string memory checkMsg) = checkTokenListing(item.nftContract, item.seller, item.tokenIds, item.tokenAmounts);
        require(checkState, checkMsg);

        return true;
    }

    function checkNewTaskExt(TaskExt memory ext) public pure override returns(bool) {
        require(bytes(ext.title).length >=0 && bytes(ext.title).length <= 256, "title");
        require(bytes(ext.note).length <= 256, "note");
        return true;
    }

    function checkNewTaskRemote(TaskItem memory item) public view override returns (bool) 
    {            
        require(checkAcceptToken(item.acceptToken), "Unsupported acceptToken");
        uint256 minTarget = minTargetAmount[item.acceptToken];
        require(minTarget == 0 || item.targetAmount >= minTarget, "target");
        return true;
    }

    function checkJoinTask(address user, uint256 taskId, uint32 num, string memory note) public view override returns(bool) {

        require(bytes(note).length <= 256, "Note too large");
        require(checkPerJoinLimit(num), "Over join limit");                
        require(num > 0, "num");

        TaskItem memory item = EXECUTOR.getTask(taskId);

        require(item.seller != user, "Not allow owner");
        require(block.timestamp >= item.startTime && block.timestamp <= item.endTime, "endTime");
        require(item.status == TaskStatus.Pending || item.status == TaskStatus.Open, "status");

        // Calculate number of TOKEN to this contract
        uint256 amount = item.price.mul(num);
        require(amount > 0, "amount");

        return true;
    }

    /**
     * @notice checking seller listing NFTs ownership and balance
     * @param addr NFT contract address
     * @param tokenIds tokenId array
     * @param amounts tokenId amount array (ERC721 can be null)
     */
    function checkTokenListing(address addr, address seller, uint256[] memory tokenIds, uint256[] memory amounts) public view override returns (bool, string memory)
    {
       
        if (IERC165(addr).supportsInterface(0x80ac58cd)) {         // ERC721 interfaceID
            for (uint256 i = 0; i < tokenIds.length; i++) {
                if (IERC721(addr).ownerOf(tokenIds[i]) != seller) {
                    return (false, "Token listed or not owner");
                }               
            }
        } else if (IERC165(addr).supportsInterface(0xd9b67a26)) {  // ERC1155 interfaceID
            require(tokenIds.length == amounts.length, "Invalid ids len");
            for (uint256 i = 0; i < tokenIds.length; i++) {
                if (!(IERC1155(addr).balanceOf(seller, tokenIds[i]) >= amounts[i] && amounts[i] > 0)) {
                    return (false, "amount or balance");
                }
            }
        }
        return (true ,"");
    }

    function checkExclusive(address account, address token, uint256 amount) override public view returns (bool){
        if (amount > 0 && Address.isContract(token)) {
            if (IERC165(token).supportsInterface(0x80ac58cd)) {
                return IERC721(token).balanceOf(account) >= amount;
            }
            return IERC20(token).balanceOf(account) >= amount;
        }

        return true;
    }

    function getProtocolFeeRecipient()
        external
        view
        override
        returns (address)
    {
        return feeRecipient;
    }

    /**
    @notice get protocol fee for eache success TaskItem payment, default is 2%
    @return fee (200 = 25%, 1,000 = 10%)
    */
    function getProtocolInviteFee() external view override returns (uint256) {
        return protocolInviteFee;
    }

    function getProtocolInviteFeeRecipient()
        external
        view
        override
        returns (address)
    {
        return inviteFeeRecipient;
    }

    /**
    @notice get protocol fee for eache success TaskItem payment, default is 2%
    @return fee (200 = 25%, 1,000 = 10%)
    */
    function getProtocolFee() external view override returns (uint256) {
        return protocolFee;
    }

    /**
    @notice get Draw Delay second for security
     */
    function getDrawDelay() external view override returns (uint32) {
        return DRAW_DELAY_SEC;
    }

    /**
    @notice get IVRF instance  
    */
    function getVRF() public view override returns (IVRF) {
        return VRF;
    }

   

    function getAutoClose() external view override returns (IAuto) {
        return AUTO_CLOSE;
    }

    function getAutoDraw() external view override returns (IAuto) {
        return AUTO_DRAW;
    }


    //  ============ onlyOwner  functions  ============

    /**
    @notice set operator
     */
    function setOperator(address addr, bool enable) external onlyOwner {
        operators[addr] = enable;
    }

    /**
    @notice set the ProtocolFeeRecipient
     */
    function setProtocolFeeRecipient(address addr) external onlyOwner {
        feeRecipient = addr;
    }

    /**
    @notice set protocol fee for eache success TaskItem payment, default is 5%
    @param fee fee (500 = 5%, 1,000 = 10%)
    */
    function setProtocolInviteFee(uint256 fee) external onlyOwner {
        protocolInviteFee = fee;
    }

       /**
    @notice set the ProtocolFeeRecipient
     */
    function setProtocolInviteFeeRecipient(address addr) external onlyOwner {
        inviteFeeRecipient = addr;
    }

    /**
    @notice set protocol fee for eache success TaskItem payment, default is 5%
    @param fee fee (500 = 5%, 1,000 = 10%)
    */
    function setProtocolFee(uint256 fee) external onlyOwner {
        protocolFee = fee;
    }

    //  ============ onlyOwner & onlyOperator functions  ============

    /**
    @notice set the set MAX_PER_JOIN_NUM
     */
    function setJoinLimitNum(uint32 num) external onlyOperator {
        MAX_PER_JOIN_NUM = num;
    }

    /**
    @notice set Draw Delay for security
     */
    function setDrawDelay(uint32 second) external onlyOperator {
        DRAW_DELAY_SEC = second;
    }

    /**
    @notice set the acceptTokens
     */
    function setAcceptTokens(address[] memory tokens, bool enable)
        public
        onlyOperator
    {
        for (uint256 i = 0; i < tokens.length; i++) {
            acceptTokens[tokens[i]] = enable;
        }
    }


    function setMinTargetAmount(address[] memory tokens, uint256[] memory amounts)
        public
        onlyOperator
    {
        for (uint256 i = 0; i < tokens.length; i++) {
            minTargetAmount[tokens[i]] = amounts[i];
        }
    }

    /**
    @notice set operator
     */
    function setExecutor(IExecutor _executor) external onlyOwner {
        EXECUTOR = _executor;
    }

    /**
    @notice set the VRF
     */
    function setVRF(IVRF addr) external onlyOperator {
        VRF = addr;
    }



    function setAuto(IAuto _auto_close, IAuto _auto_draw) external onlyOperator {
        AUTO_CLOSE = _auto_close;
        AUTO_DRAW = _auto_draw;
    }
}
