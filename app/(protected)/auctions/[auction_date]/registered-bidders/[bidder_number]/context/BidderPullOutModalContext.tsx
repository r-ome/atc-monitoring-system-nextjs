"use client";

import { createContext, useState, useContext } from "react";
import { RegisteredBidder } from "src/entities/models/Bidder";
import { getItemPriceWithServiceChargeAmount } from "@/app/lib/utils";

export type PaymentEntry = {
  payment_method: string;
  amount_paid: number;
};

type BidderPullOutModalContextType = {
  serviceCharge: number;
  selectedItems: RegisteredBidder["auction_inventories"];
  setSelectedItems: (a: RegisteredBidder["auction_inventories"]) => void;
  registeredBidder: RegisteredBidder | undefined;
  setRegisteredBidder: (b: RegisteredBidder) => void;
  serviceChargeAmount: number;
  registrationFeeAmount: number;
  totalItemPrice: number;
  grandTotal: number;
  payments: PaymentEntry[];
  setPayments: React.Dispatch<React.SetStateAction<PaymentEntry[]>>;
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
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { payment_method: "", amount_paid: 0 },
  ]);

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
    serviceChargeAmount =
      getItemPriceWithServiceChargeAmount(totalItemPrice, service_charge) -
      totalItemPrice;
    registrationFeeAmount = already_consumed ? 0 : registration_fee;
    grandTotal = totalItemPrice + serviceChargeAmount - registrationFeeAmount;
  }

  return (
    <BidderPullOutModalContext.Provider
      value={{
        serviceCharge: registeredBidder?.service_charge ?? 0,
        serviceChargeAmount,
        registrationFeeAmount,
        totalItemPrice,
        grandTotal,
        selectedItems,
        setSelectedItems,
        registeredBidder,
        setRegisteredBidder,
        payments,
        setPayments,
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
