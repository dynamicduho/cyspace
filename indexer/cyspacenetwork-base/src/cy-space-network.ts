import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  CySpaceNetwork as CySpaceNetworkContract,
  DiaryCreated as DiaryCreatedEvent,
  FriendAdded as FriendAddedEvent,
  FriendRemoved as FriendRemovedEvent,
  PhotoCreated as PhotoCreatedEvent
} from "../generated/CySpaceNetwork/CySpaceNetwork"
import {
  DiaryEntry,
  FriendAdded,
  FriendRemoved,
  PhotoAlbum
} from "../generated/schema"

export function handleDiaryCreated(event: DiaryCreatedEvent): void {
  let entity = new DiaryEntry(
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

export function handlePhotoCreated(event: PhotoCreatedEvent): void {
  let cyNetwork = CySpaceNetworkContract.bind(event.address);
  let index = BigInt.fromI32(0);
  let contentAddress = new Address(0);
  while (true) {
    let result = cyNetwork.try_photos(event.params.author, index);
    if (result.reverted) {
      break;
    }
    let photo = result.value;
    let possibleTimestamp = photo.getTimestamp();
    if (possibleTimestamp.equals(event.block.timestamp)) {
      // found a match: store it and stop iterating
      contentAddress = photo.getContentAddress();
      break;
    }
    index = index.plus(BigInt.fromI32(1));
  }

  if (contentAddress !== new Address(0)) {
    let entity = new PhotoAlbum(
      event.transaction.hash
    );
    entity.author = event.params.author;
    entity.caption = event.params.caption;
    entity.timestamp = event.params.timestamp;
    entity.fileDirectory = contentAddress;

    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();
  }
}
