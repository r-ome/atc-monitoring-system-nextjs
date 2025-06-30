"use client";

import { createContext, useState, useContext } from "react";
import { AuctionsInventory } from "src/entities/models/Auction";

type AuctionItemContextType = {
  auctionInventory: AuctionsInventory | null;
  auctionBidderId: string;
  setAuctionInventory: (a: AuctionsInventory) => void;
  setAuctionBidderId: (a: string) => void;
};

const AuctionItemContext = createContext<AuctionItemContextType | undefined>(
  undefined
);

export const AuctionItemProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [auctionInventory, setAuctionInventory] =
    useState<AuctionsInventory | null>(null);
  const [auctionBidderId, setAuctionBidderId] = useState<string>("");

  return (
    <AuctionItemContext.Provider
      value={{
        auctionInventory,
        auctionBidderId,
        setAuctionInventory,
        setAuctionBidderId,
      }}
    >
      {children}
    </AuctionItemContext.Provider>
  );
};

export const useAuctionItemContext = () => {
  const context = useContext(AuctionItemContext);
  if (!context)
    throw new Error(
      "useAuctionItemContext must be used within AuctionItemProvider"
    );
  return context;
};
