import { gql } from "@apollo/client";

export const GET_ALL_PHOTO_ALBUMS = gql`
  query GetAlbums {
    photoAlbums(orderBy: timestamp, orderDirection: desc) {
      id
      author
      caption
      fileDirectory
      transactionHash
      timestamp
    }
  }
`;
