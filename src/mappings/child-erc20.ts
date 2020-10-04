
import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { Transfer } from '../../generated/ChildERC20/ChildERC20'
import { StateReceiver } from '../../generated/ChildERC20/StateReceiver'
import { User, LastStateSync } from '../../generated/schema'

let ZERO = BigInt.fromI32(0)
let SPRINT = BigInt.fromI32(64)
let ZERO_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000")
let STATE_RECEIVER_ADDRESS = Address.fromString("0x0000000000000000000000000000000000001001")

export function handleTransfer(event: Transfer): void {
  if (event.params.to != ZERO_ADDRESS) {
    let userToID = event.params.to.toHex()
    let userTo = User.load(userToID)
    if (userTo == null) {
      userTo = new User(userToID)
      userTo.amount = BigInt.fromI32(0)
    }
    userTo.amount = userTo.amount.plus(event.params.value)
    userTo.save()
  }

  if (event.params.from != ZERO_ADDRESS) {
    let userFromID = event.params.from.toHex()
    let userFrom = User.load(userFromID)
    if (userFrom == null) {
      userFrom = new User(userFromID)
      userFrom.amount = BigInt.fromI32(0)
    }
    userFrom.amount = userFrom.amount.minus(event.params.value)
    userFrom.save()
  }
}

export function handleBlock(block: ethereum.Block): void {
  if (block.number.mod(SPRINT) == ZERO && block.number.minus(SPRINT) > ZERO) {
    let number = block.number.toI32()

    // fetch target block
    let targetBlock = block.number.minus(SPRINT)

    log.info("Target block {}", [targetBlock.toString()])

    // bind state receiver contract
    let stateReceiverContract = StateReceiver.bind(STATE_RECEIVER_ADDRESS)
    let lastStateId = stateReceiverContract.lastStateId()

    // save last state
    let lastStateSync = LastStateSync.load("last-state")
    if (lastStateSync == null) {
      lastStateSync = new LastStateSync("last-state")
    }
    lastStateSync.stateId = lastStateId
    lastStateSync.save()
  }
}