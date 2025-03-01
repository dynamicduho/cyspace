import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  AdminAdded,
  AdminRemoved,
  DiaryCreated,
  FriendAdded,
  FriendRemoved,
  OwnershipTransferred,
  PhotoCreated
} from "../generated/CySpaceNetwork/CySpaceNetwork"

export function createAdminAddedEvent(admin: Address): AdminAdded {
  let adminAddedEvent = changetype<AdminAdded>(newMockEvent())

  adminAddedEvent.parameters = new Array()

  adminAddedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )

  return adminAddedEvent
}

export function createAdminRemovedEvent(admin: Address): AdminRemoved {
  let adminRemovedEvent = changetype<AdminRemoved>(newMockEvent())

  adminRemovedEvent.parameters = new Array()

  adminRemovedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )

  return adminRemovedEvent
}

export function createDiaryCreatedEvent(
  author: Address,
  text: string,
  timestamp: BigInt
): DiaryCreated {
  let diaryCreatedEvent = changetype<DiaryCreated>(newMockEvent())

  diaryCreatedEvent.parameters = new Array()

  diaryCreatedEvent.parameters.push(
    new ethereum.EventParam("author", ethereum.Value.fromAddress(author))
  )
  diaryCreatedEvent.parameters.push(
    new ethereum.EventParam("text", ethereum.Value.fromString(text))
  )
  diaryCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return diaryCreatedEvent
}

export function createFriendAddedEvent(
  user: Address,
  friend: Address
): FriendAdded {
  let friendAddedEvent = changetype<FriendAdded>(newMockEvent())

  friendAddedEvent.parameters = new Array()

  friendAddedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  friendAddedEvent.parameters.push(
    new ethereum.EventParam("friend", ethereum.Value.fromAddress(friend))
  )

  return friendAddedEvent
}

export function createFriendRemovedEvent(
  user: Address,
  friend: Address
): FriendRemoved {
  let friendRemovedEvent = changetype<FriendRemoved>(newMockEvent())

  friendRemovedEvent.parameters = new Array()

  friendRemovedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  friendRemovedEvent.parameters.push(
    new ethereum.EventParam("friend", ethereum.Value.fromAddress(friend))
  )

  return friendRemovedEvent
}

export function createOwnershipTransferredEvent(
  user: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPhotoCreatedEvent(
  author: Address,
  caption: string,
  timestamp: BigInt
): PhotoCreated {
  let photoCreatedEvent = changetype<PhotoCreated>(newMockEvent())

  photoCreatedEvent.parameters = new Array()

  photoCreatedEvent.parameters.push(
    new ethereum.EventParam("author", ethereum.Value.fromAddress(author))
  )
  photoCreatedEvent.parameters.push(
    new ethereum.EventParam("caption", ethereum.Value.fromString(caption))
  )
  photoCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return photoCreatedEvent
}
