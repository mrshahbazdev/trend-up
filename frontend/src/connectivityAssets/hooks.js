
import { waitForTransactionReceipt } from "@wagmi/core";

import tokenAbi from "./tokenAbi.json";
import { tokenAddress } from "./environment";
import { useReadContract, useWriteContract } from "wagmi";
import { DISABLE_WEB3, MOCK_WEB3_DATA } from "@/constants";

export const useTokenReadFunction = (functionName, args, address) => {
    const readContract = useReadContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: functionName,
        args,
        account: address,
        query: {
            enabled: false, // disable the query in onload
        },
    });
    const handleReadContract = async () => {
        try {
            const { data } = await readContract.refetch();
            return data;
        } catch (error) {
            throw new Error(error);
        }
    };

    return { handleReadContract };
};

/// write functions
export const useTokenWriteFunction = () => {
    const { writeContractAsync } = useWriteContract();

    const handleWriteContract = async (functionName, args, address) => {
        // Mock mode - simulate transaction
        if (DISABLE_WEB3) {
            console.log('🔶 [MOCK WEB3] Would call:', functionName, 'with args:', args);
            
            // Simulate transaction delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Return mock receipt
            return {
                transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
                status: 'success',
                blockNumber: Date.now()
            };
        }
        
        // Real blockchain transaction
        try {
            const { hash } = await writeContractAsync({
                abi: tokenAbi,
                address: tokenAddress,
                functionName,
                args,
                account: address,
            });

            const receipt = await waitForTransactionReceipt({ hash });
            return receipt;
        } catch (error) {
            throw new Error(error);
        }
    };

    return { handleWriteContract };
};

// Enhanced hooks for specific contract functions
export const useTokenBalance = (address) => {
    const { data, isLoading, refetch } = useReadContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        enabled: !!address && !DISABLE_WEB3,
        watch: !DISABLE_WEB3,
    });
    
    // Return mock data if Web3 disabled
    if (DISABLE_WEB3) {
        return {
            balance: BigInt(MOCK_WEB3_DATA.tokenBalance),
            isLoading: false,
            refetch: () => {}
        };
    }
    
    return { 
        balance: data || 0n, 
        isLoading, 
        refetch 
    };
};

// Get vote cooldown timestamp for an address
export const useVoteCooldown = (voterAddress) => {
    const { data, refetch } = useReadContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'votersToVoteExpiry',
        args: voterAddress ? [voterAddress] : undefined,
        enabled: !!voterAddress && !DISABLE_WEB3,
        watch: !DISABLE_WEB3,
    });
    
    if (DISABLE_WEB3) {
        return {
            expiryTimestamp: BigInt(MOCK_WEB3_DATA.voteCooldown),
            refetch: () => {}
        };
    }
    
    return { 
        expiryTimestamp: data || 0n, 
        refetch 
    };
};

// Get total number of democratic votes
export const useDemocraticVotesLength = () => {
    const { data, isLoading, refetch } = useReadContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'getDemocraticVotesLength',
        enabled: !DISABLE_WEB3,
        watch: !DISABLE_WEB3,
    });
    
    if (DISABLE_WEB3) {
        return {
            votesCount: BigInt(MOCK_WEB3_DATA.democraticVotesCount),
            isLoading: false,
            refetch: () => {}
        };
    }
    
    return { 
        votesCount: data || 0n, 
        isLoading, 
        refetch 
    };
};

// Get individual democratic vote data
export const useDemocraticVote = (voteId) => {
    const { data, isLoading, refetch } = useReadContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'democraticVotes',
        args: voteId !== undefined && voteId !== null ? [voteId] : undefined,
        enabled: voteId !== undefined && voteId !== null && !DISABLE_WEB3,
        watch: !DISABLE_WEB3,
    });
    
    if (DISABLE_WEB3 && voteId !== undefined && voteId !== null) {
        const mockVote = MOCK_WEB3_DATA.democraticVotes[voteId];
        if (mockVote) {
            return {
                voteData: [
                    mockVote.title,
                    BigInt(mockVote.totalVotes),
                    BigInt(mockVote.votedYes),
                    BigInt(mockVote.expiryTimestamp)
                ],
                isLoading: false,
                refetch: () => {}
            };
        }
    }
    
    return { 
        voteData: data, 
        isLoading, 
        refetch 
    };
};

// Get democratic vote results
export const useDemocraticVoteResult = (voteId) => {
    const { data, isLoading, refetch } = useReadContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'getDemocraticVoteResult',
        args: voteId !== undefined && voteId !== null ? [voteId] : undefined,
        enabled: voteId !== undefined && voteId !== null && !DISABLE_WEB3,
    });
    
    if (DISABLE_WEB3 && voteId !== undefined && voteId !== null) {
        const mockVote = MOCK_WEB3_DATA.democraticVotes[voteId];
        if (mockVote) {
            const yesPercent = Math.round((mockVote.votedYes / mockVote.totalVotes) * 100);
            const noPercent = 100 - yesPercent;
            return {
                result: [
                    mockVote.votedYes > mockVote.votedNo ? 'Proposal Passing' : 'Proposal Failing',
                    BigInt(yesPercent),
                    BigInt(noPercent),
                    BigInt(mockVote.totalVotes)
                ],
                isLoading: false,
                refetch: () => {}
            };
        }
    }
    
    return { 
        result: data, 
        isLoading, 
        refetch 
    };
};

// Get HODL activation timestamp
export const useHodlActivationTimestamp = () => {
    const { data, refetch } = useReadContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'hodlActivationTimestamp',
        enabled: !DISABLE_WEB3,
        watch: !DISABLE_WEB3,
    });
    
    if (DISABLE_WEB3) {
        return {
            hodlTimestamp: BigInt(MOCK_WEB3_DATA.hodlActivationTimestamp),
            refetch: () => {}
        };
    }
    
    return { 
        hodlTimestamp: data || 0n, 
        refetch 
    };
};

// Get sale restriction status
export const useIsSaleRestricted = () => {
    const { data, refetch } = useReadContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'isSaleRestricted',
        enabled: !DISABLE_WEB3,
        watch: !DISABLE_WEB3,
    });
    
    if (DISABLE_WEB3) {
        return {
            isSaleRestricted: MOCK_WEB3_DATA.isSaleRestricted,
            refetch: () => {}
        };
    }
    
    return { 
        isSaleRestricted: !!data, 
        refetch 
    };
};