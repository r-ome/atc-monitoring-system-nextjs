"use client";

import { Loader2Icon, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { SetStateAction } from "react";
import { useAuctionItemContext } from "../context/AuctionItemContext";
import { Button } from "@/app/components/ui/button";
import {
  updateAuctionInventory,
  getInventoriesWithNoAuctionsInventories,
} from "@/app/(protected)/inventories/actions";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { Auction } from "src/entities/models/Auction";
import {
  getAuction,
  getRegisteredBidders,
} from "@/app/(protected)/auctions/actions";
import { RegisteredBidder } from "src/entities/models/Bidder";
import { SelectWithSearch } from "@/app/components/ui/SelectWithSearch";

interface UpdateItemModalProps {
  open: boolean;
  onOpenChange: React.Dispatch<SetStateAction<boolean>>;
}

type UpdateItemForm = {
  barcode?: string;
  control?: string;
  description?: string;
  price?: number;
  qty?: string;
  bidder_number?: string;
  manifest_number?: string;
};

export const UpdateItemModal: React.FC<UpdateItemModalProps> = ({
  open,
  onOpenChange,
}) => {
  const router = useRouter();
  const { auctionInventory } = useAuctionItemContext();
  const { auction_date }: { auction_date: string } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const [registeredBidders, setRegisteredBidders] = useState<
    Omit<RegisteredBidder, "auction_inventories">[]
  >([]);
  const [selectedBidder, setSelectedBidder] = useState<{
    label: string;
    value: string;
  }>();
  const [auctionId, setAuctionId] = useState<string>("");
  const [newAuctionInventory, setNewAuctionInventory] =
    useState<UpdateItemForm>({});
  const [inventories, setInventories] = useState<
    {
      inventory_id: string;
      barcode: string;
      control: string;
      created_at: string;
    }[]
  >([]);
  const [selectedInventory, setSelectedInventory] = useState<{
    label: string;
    value: string;
  }>();

  useEffect(() => {
    setNewAuctionInventory({
      barcode: auctionInventory?.inventory.barcode,
      control: auctionInventory?.inventory.control || "NC",
      description: auctionInventory?.description,
      price: auctionInventory?.price,
      qty: auctionInventory?.qty,
      bidder_number: auctionInventory?.bidder.bidder_number,
      manifest_number: auctionInventory?.manifest_number,
    });
  }, [auctionInventory]);

  useEffect(() => {
    const fetchAuctionData = async () => {
      const auction_res = await getAuction(auction_date);
      const inventories_res = await getInventoriesWithNoAuctionsInventories();
      if (!inventories_res.ok) return;
      if (!auction_res.ok) return;
      if (!auctionInventory) return;

      const auction = auction_res.value;
      const registered_bidders_res = await getRegisteredBidders(
        auction.auction_id
      );
      if (!registered_bidders_res.ok) return;

      setAuctionId(auction.auction_id);
      setInventories(inventories_res.value);

      const registered_bidders = registered_bidders_res.value;
      setRegisteredBidders(registered_bidders);
      const selectedBidder = registered_bidders.find(
        (registeredBidder) =>
          registeredBidder.bidder.bidder_number ===
          auctionInventory?.bidder.bidder_number
      );

      if (selectedBidder) {
        setSelectedBidder({
          label: selectedBidder?.bidder.bidder_number,
          value: selectedBidder?.bidder.bidder_number,
        });
      }
    };

    fetchAuctionData();
  }, [auction_date, auctionInventory]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    if (!auctionInventory || !auctionId) return;
    formData.append("auction_id", auctionId);
    formData.append(
      "auction_inventory_id",
      auctionInventory.auction_inventory_id
    );
    formData.append("inventory_id", auctionInventory.inventory_id);
    if (selectedInventory) {
      formData.set("inventory_id", selectedInventory.value);
    }
    if (selectedBidder) {
      formData.append("bidder_number", selectedBidder.value);
    }

    const res = await updateAuctionInventory(formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully updated item!");
        router.refresh();
        onOpenChange(false);
      }

      if (!res.ok) {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
        if (res.error.message === "Invalid Data!") {
          setErrors(res.error.cause as Record<string, string[]>);
        }
      }
    }
  };

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = e.target.name;

    setNewAuctionInventory((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit} className="space-y-2">
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex mx-auto gap-2">
                <Info className="h-7 w-7" />
                UPDATE ITEM
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update this item. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Label htmlFor="barcode" className="w-30">
                Barcode:
              </Label>
              <Input
                value={newAuctionInventory.barcode}
                name="barcode"
                onChange={handleUpdateChange}
                error={errors}
                required
              />
            </div>
            <div className="flex gap-2">
              <Label htmlFor="control" className="w-30">
                Control:
              </Label>
              <Input
                value={newAuctionInventory.control}
                name="control"
                onChange={handleUpdateChange}
                error={errors}
                required
              />
            </div>
            <div className="flex gap-2">
              <Label htmlFor="description" className="w-30">
                Description:
              </Label>
              <Input
                value={newAuctionInventory.description}
                name="description"
                onChange={handleUpdateChange}
                error={errors}
                required
              />
            </div>
            <div className="flex gap-2">
              <Label htmlFor="price" className="w-30">
                Price:
              </Label>
              <div className="w-full">
                <InputNumber
                  value={newAuctionInventory.price}
                  name="price"
                  onChange={handleUpdateChange}
                  error={errors}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Label htmlFor="description" className="w-30">
                QTY:
              </Label>
              <Input
                value={newAuctionInventory.qty}
                name="qty"
                onChange={handleUpdateChange}
                error={errors}
                required
              />
            </div>
            <div className="flex gap-2">
              <Label className="w-30">Bidder:</Label>
              <div className="w-full">
                <SelectWithSearch
                  defaultValue={selectedBidder}
                  placeholder="Select a bidder"
                  setSelected={(selected) =>
                    setSelectedBidder(
                      selected as { label: string; value: string }
                    )
                  }
                  options={registeredBidders
                    .filter((item) => item.bidder.bidder_number !== "5013")
                    .map((item) => ({
                      label: item.bidder.bidder_number,
                      value: item.bidder.bidder_number,
                    }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Label className="w-30">Inventory:</Label>
              <div className="w-full">
                <SelectWithSearch
                  defaultValue={selectedBidder}
                  placeholder="Select a inventory"
                  setSelected={(selected) =>
                    setSelectedInventory(
                      selected as { label: string; value: string }
                    )
                  }
                  options={inventories.map((item) => ({
                    label: `${item.barcode} (${item.control}) (${item.created_at})`,
                    value: item.inventory_id,
                  }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Label htmlFor="manifest_number" className="w-30">
                Manifest Number:
              </Label>
              <Input
                value={newAuctionInventory.manifest_number}
                name="manifest_number"
                onChange={handleUpdateChange}
                error={errors}
                required
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setErrors(undefined);
                onOpenChange(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2Icon className="animate-spin" />}
                Submit
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
