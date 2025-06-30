"use client";

import { createContext, useState, useContext } from "react";
import { RegisteredBidder } from "src/entities/models/Bidder";

type BidderPullOutModalContextType = {
  selectedItems: RegisteredBidder["auction_inventories"];
  setSelectedItems: (a: RegisteredBidder["auction_inventories"]) => void;
  registeredBidder: RegisteredBidder | undefined;
  setRegisteredBidder: (b: any) => void;
  serviceChargeAmount: number;
  registrationFeeAmount: number;
  totalItemPrice: number;
  grandTotal: number;
};

const BidderPullOutModalContext = createContext<
  BidderPullOutModalContextType | undefined
>(undefined);

export const BidderPullOutModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedItems, setSelectedItems] = useState<
    RegisteredBidder["auction_inventories"]
  >([]);
  const [registeredBidder, setRegisteredBidder] = useState<
    RegisteredBidder | undefined
  >();

  const totalItemPrice = selectedItems.reduce(
    (acc, item) => (acc += item.price),
    0
  );

  let serviceChargeAmount = 0;
  let registrationFeeAmount = 0;
  let grandTotal = 0;
  if (registeredBidder) {
    const { service_charge, already_consumed, registration_fee } =
      registeredBidder;
    serviceChargeAmount = (totalItemPrice * service_charge) / 100;
    registrationFeeAmount = already_consumed ? 0 : registration_fee;
    grandTotal = totalItemPrice + serviceChargeAmount - registrationFeeAmount;
  }

  return (
    <BidderPullOutModalContext.Provider
      value={{
        serviceChargeAmount,
        registrationFeeAmount,
        totalItemPrice,
        grandTotal,
        selectedItems,
        setSelectedItems,
        registeredBidder,
        setRegisteredBidder,
      }}
    >
      {children}
    </BidderPullOutModalContext.Provider>
  );
};

export const useBidderPullOutModalContext = () => {
  const context = useContext(BidderPullOutModalContext);
  if (!context)
    throw new Error(
      "useBidderPullOutModalContext must be used within BidderPullOutModalProvider"
    );
  return context;
};
