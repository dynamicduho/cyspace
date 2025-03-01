import { supabase } from './components/supabaseClient';

export async function getWalletOrUsername(input) {
  try {
    let query;
    
    // Check if input looks like a wallet address (0x followed by hex characters)
    const isWalletAddress = /^0x[a-fA-F0-9]{40}$/.test(input);
    
    if (isWalletAddress) {
      // Get username for wallet address
      query = await supabase
        .from('users')
        .select('username')
        .eq('wallet_address', input)
        .single();
    } else {
      // Get wallet address for username
      query = await supabase
        .from('users')
        .select('wallet_address')
        .eq('username', input)
        .single();
    }

    if (query.error) throw query.error;
    
    // Return the corresponding value
    return isWalletAddress ? query.data?.username : query.data?.wallet_address;
    
  } catch (error) {
    console.error('Error in getWalletOrUsername:', error);
    return null;
  }
}
