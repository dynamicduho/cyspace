export const GET_DIARY_ENTRIES = `
  query GetDiaryEntries($walletAddress: String!) {
    diaryEntries(
      where: { author: $walletAddress }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      text
      timestamp
      author
    }
  }
`;
