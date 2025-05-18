import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { formatEther } from 'viem';

export default function ProposalVoting({ 
  proposal, 
  governorAddress, 
  governorABI, 
  networkInfo,
  onVoteCast
}) {
  const [pendingVote, setPendingVote] = useState(null);
  const [voteResult, setVoteResult] = useState({ status: '', message: '' });
  
  const { writeContract } = useWriteContract();
  
  // Calculate percentage for vote visualization
  const calculatePercentage = (value, total) => {
    if (!value || !total || total === BigInt(0)) return 0;
    if (typeof value === 'bigint' && typeof total === 'bigint') {
      return Number((value * BigInt(100)) / total);
    }
    return 0;
  };
  
  // Cast a vote on the proposal
  const castVote = async (support) => {
    try {
      setPendingVote(support);
      setVoteResult({ status: 'pending', message: 'Submitting vote...' });
      
      // 0 = Against, 1 = For, 2 = Abstain
      const hash = await writeContract({
        address: governorAddress,
        abi: governorABI,
        functionName: 'castVote',
        args: [proposal.id, support]
      });
      
      const voteTypeText = support === 0 ? 'against' : support === 1 ? 'for' : 'abstain';
      
      setVoteResult({ 
        status: 'success', 
        message: `Vote cast successfully! You voted ${voteTypeText} the proposal.`,
        hash
      });
      
      // Notify parent component to refresh data
      if (onVoteCast) {
        setTimeout(() => onVoteCast(), 2000);
      }
    } catch (error) {
      console.error("Vote error:", error);
      setVoteResult({ 
        status: 'error', 
        message: error.message || 'Failed to cast vote. Try again later.'
      });
    } finally {
      setPendingVote(null);
    }
  };
  
  // Format numbers for display
  const formatNumber = (value) => {
    if (typeof value === 'bigint') {
      return Number(formatEther(value)).toLocaleString();
    }
    return Number(value).toLocaleString();
  };
  
  return (
    <div className="proposal-votes">
      <div className="votes-header">
        <span>Votes</span>
        <span>
          {formatNumber(
            (BigInt(proposal.forVotes || 0) +
            BigInt(proposal.againstVotes || 0) +
            BigInt(proposal.abstainVotes || 0))
          )} SIL total
        </span>
      </div>
      
      <div className="vote-bars">
        <div className="vote-bar-container">
          <div className="vote-bar-label">
            <span>For</span>
            <span>{formatNumber(proposal.forVotes)} SIL</span>
          </div>
          <div className="vote-bar-wrap">
            <div 
              className="vote-bar for" 
              style={{ 
                width: `${calculatePercentage(
                  BigInt(proposal.forVotes || 0), 
                  BigInt(proposal.forVotes || 0) + BigInt(proposal.againstVotes || 0) + BigInt(proposal.abstainVotes || 0)
                )}%` 
              }}
            ></div>
          </div>
        </div>
        
        <div className="vote-bar-container">
          <div className="vote-bar-label">
            <span>Against</span>
            <span>{formatNumber(proposal.againstVotes)} SIL</span>
          </div>
          <div className="vote-bar-wrap">
            <div 
              className="vote-bar against" 
              style={{ 
                width: `${calculatePercentage(
                  BigInt(proposal.againstVotes || 0), 
                  BigInt(proposal.forVotes || 0) + BigInt(proposal.againstVotes || 0) + BigInt(proposal.abstainVotes || 0)
                )}%` 
              }}
            ></div>
          </div>
        </div>
        
        <div className="vote-bar-container">
          <div className="vote-bar-label">
            <span>Abstain</span>
            <span>{formatNumber(proposal.abstainVotes)} SIL</span>
          </div>
          <div className="vote-bar-wrap">
            <div 
              className="vote-bar abstain" 
              style={{ 
                width: `${calculatePercentage(
                  BigInt(proposal.abstainVotes || 0), 
                  BigInt(proposal.forVotes || 0) + BigInt(proposal.againstVotes || 0) + BigInt(proposal.abstainVotes || 0)
                )}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
      
      {voteResult.status && (
        <div className={`vote-result ${voteResult.status}`}>
          <p>{voteResult.message}</p>
          {voteResult.hash && (
            <a 
              href={`https://${networkInfo.network === 'mainnet' ? '' : networkInfo.network + '.'}etherscan.io/tx/${voteResult.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              View transaction
            </a>
          )}
        </div>
      )}
      
      {proposal.status === 'Active' && (
        <div className="vote-actions">
          <button 
            className="vote-button for"
            onClick={() => castVote(1)}
            disabled={pendingVote !== null}
          >
            {pendingVote === 1 ? 'Voting...' : 'Vote For'}
          </button>
          <button 
            className="vote-button against"
            onClick={() => castVote(0)}
            disabled={pendingVote !== null}
          >
            {pendingVote === 0 ? 'Voting...' : 'Vote Against'}
          </button>
          <button 
            className="vote-button abstain"
            onClick={() => castVote(2)}
            disabled={pendingVote !== null}
          >
            {pendingVote === 2 ? 'Voting...' : 'Abstain'}
          </button>
        </div>
      )}
      
      {proposal.status === 'Queued' && (
        <div className="proposal-actions">
          <button className="action-button primary">Execute</button>
        </div>
      )}
      
      <style jsx>{`
        .proposal-votes {
          border-top: 1px solid var(--border-color);
          padding-top: 1.5rem;
        }
        
        .votes-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        
        .vote-bars {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .vote-bar-container {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        
        .vote-bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        
        .vote-bar-wrap {
          height: 8px;
          background-color: var(--bg-secondary);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .vote-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .vote-bar.for {
          background-color: #10b981;
        }
        
        .vote-bar.against {
          background-color: #ef4444;
        }
        
        .vote-bar.abstain {
          background-color: #6b7280;
        }
        
        .vote-result {
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          font-size: 0.9rem;
        }
        
        .vote-result.success {
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
        }
        
        .vote-result.error {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        
        .vote-result.pending {
          background-color: rgba(234, 179, 8, 0.1);
          border: 1px solid rgba(234, 179, 8, 0.3);
          color: #eab308;
        }
        
        .tx-link {
          display: inline-block;
          margin-top: 0.5rem;
          color: var(--accent-color);
          text-decoration: underline;
        }
        
        .vote-actions, .proposal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .vote-button {
          flex: 1;
          padding: 0.6rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .vote-button.for {
          background-color: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .vote-button.for:hover {
          background-color: rgba(16, 185, 129, 0.2);
        }
        
        .vote-button.against {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .vote-button.against:hover {
          background-color: rgba(239, 68, 68, 0.2);
        }
        
        .vote-button.abstain {
          background-color: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.3);
        }
        
        .vote-button.abstain:hover {
          background-color: rgba(107, 114, 128, 0.2);
        }
        
        .vote-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .action-button {
          flex: 1;
          padding: 0.8rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-button.primary {
          background-color: var(--accent-color);
          color: white;
          border: none;
        }
        
        .action-button.primary:hover {
          background-color: var(--accent-hover);
        }
        
        @media (max-width: 768px) {
          .vote-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
} 