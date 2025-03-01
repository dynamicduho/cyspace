import {
  AdminAdded as AdminAddedEvent,
  AdminRemoved as AdminRemovedEvent,
  DiaryCreated as DiaryCreatedEvent,
  FriendAdded as FriendAddedEvent,
  FriendRemoved as FriendRemovedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  PhotoCreated as PhotoCreatedEvent
} from "../generated/CySpaceNetwork/CySpaceNetwork"
import {
  AdminAdded,
  AdminRemoved,
  DiaryCreated,
  FriendAdded,
  FriendRemoved,
  OwnershipTransferred,
  PhotoCreated
} from "../generated/schema"

export function handleAdminAdded(event: AdminAddedEvent): void {
  let entity = new AdminAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.admin = event.params.admin

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAdminRemoved(event: AdminRemovedEvent): void {
  let entity = new AdminRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.admin = event.params.admin

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDiaryCreated(event: DiaryCreatedEvent): void {
  let entity = new DiaryCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.author = event.params.author
  entity.text = event.params.text
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFriendAdded(event: FriendAddedEvent): void {
  let entity = new FriendAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.friend = event.params.friend

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFriendRemoved(event: FriendRemovedEvent): void {
  let entity = new FriendRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.friend = event.params.friend

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePhotoCreated(event: PhotoCreatedEvent): void {
  let entity = new PhotoCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.author = event.params.author
  entity.caption = event.params.caption
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
