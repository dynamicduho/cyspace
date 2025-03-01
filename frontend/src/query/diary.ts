import { gql } from "@apollo/client";

export const GET_ALL_DIARY_ENTRY = gql`
  query GetDiaries {
    diaryEntries {
      id
      author
      text
      transactionHash
      timestamp
    }
  }
`;
