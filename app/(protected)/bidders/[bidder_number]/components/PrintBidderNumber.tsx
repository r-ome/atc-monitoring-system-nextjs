"use client";

import { pdf } from "@react-pdf/renderer";
import BidderNumberDocument from "@/app/(protected)/bidders/[bidder_number]/components/BidderNumberDocument";
import { Button } from "@/app/components/ui/button";

interface PrintBidderNumberProps {
  bidder: {
    first_name: string;
    last_name: string;
    bidder_number: string;
    branch: { name: string };
  };
}

export const PrintBidderNumber: React.FC<PrintBidderNumberProps> = ({
  bidder,
}) => {
  async function printPdf() {
    if (!bidder || !bidder.branch.name) return;

    const blob = await pdf(
      <BidderNumberDocument
        bidder_number={bidder.bidder_number}
        branch_name={bidder.branch.name}
        full_name={`${bidder.last_name}, ${bidder.first_name}`}
      />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "100%";
    iframe.style.bottom = "100%";
    iframe.src = url;

    iframe.onload = () => {
      iframe.contentWindow?.print();
    };

    document.body.appendChild(iframe);
  }
  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        await printPdf();
      }}
    >
      Print Bidder Number
    </Button>
  );
};
