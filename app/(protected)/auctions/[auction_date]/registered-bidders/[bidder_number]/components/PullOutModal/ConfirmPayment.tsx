"use client";

import { useEffect, useState } from "react";
import { CircleX } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { InputNumber } from "@/app/components/ui/InputNumber";
import {
  Tabs,
  TabsTrigger,
  TabsList,
  TabsContent,
} from "@/app/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableCell,
  TableRow,
  TableFooter,
} from "@/app/components/ui/table";
import { useBidderPullOutModalContext } from "../../context/BidderPullOutModalContext";
import { PaymentMethod } from "src/entities/models/PaymentMethod";
import { getEnabledPaymentMethods } from "@/app/(protected)/configurations/payment-methods/actions";

export const ConfirmPayment: React.FC = () => {
  const { grandTotal, payments, setPayments } =
    useBidderPullOutModalContext();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getEnabledPaymentMethods();
      if (res.ok) setPaymentMethods(res.value);
    };

    fetchInitialData();
  }, []);

  const handleAdd = () => {
    if (payments.length < paymentMethods.length) {
      setPayments([...payments, { payment_method: "", amount_paid: 0 }]);
    }
  };

  const handleMethodChange = (index: number, newMethod: string) => {
    setPayments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], payment_method: newMethod };
      return updated;
    });
  };

  const handleAmountChange = (index: number, newAmount: number) => {
    setPayments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], amount_paid: newAmount };
      return updated;
    });
  };

  const handleRemove = (index: number) => {
    const updated = [...payments];
    updated.splice(index, 1);
    setPayments(updated);
  };

  const resetToSingle = () => {
    setPayments([{ payment_method: "", amount_paid: 0 }]);
  };

  return (
    <div className="space-y-2">
      <Table>
        <TableFooter>
          <TableRow className="[&>td]:border-r last:border-r-0">
            <TableCell className="text-center text-lg">GRAND TOTAL</TableCell>
            <TableCell className="text-lg font-bold text-center">
              ₱ {grandTotal.toLocaleString()}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <Tabs defaultValue="single" onValueChange={resetToSingle}>
        <TabsList className="w-full">
          <TabsTrigger value="single">Single/Full Payment</TabsTrigger>
          <TabsTrigger value="multiple">Multiple Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Select
            required
            onValueChange={(value) => {
              setPayments([{ payment_method: value, amount_paid: grandTotal }]);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Payment Type"></SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {paymentMethods.map((item) => (
                  <SelectItem
                    key={item.payment_method_id}
                    value={item.payment_method_id}
                  >
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </TabsContent>

        <TabsContent value="multiple">
          <div className="space-y-2">
            {payments.map((item, index) => (
              <div className="flex gap-2" key={index}>
                <div className="flex-1">
                  <Select
                    required
                    value={item.payment_method}
                    onValueChange={(value) => handleMethodChange(index, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Payment Type"></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {paymentMethods.map((item) => (
                          <SelectItem
                            key={item.payment_method_id}
                            value={item.payment_method_id}
                          >
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <InputNumber
                    required
                    onChange={(e) =>
                      handleAmountChange(index, Number(e.target.value))
                    }
                  />
                </div>

                <Button
                  variant="destructive"
                  onClick={() => handleRemove(index)}
                >
                  <CircleX />
                </Button>
              </div>
            ))}

            {payments.length < paymentMethods.length && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAdd}
                disabled={payments.some((item) => item.payment_method === "")}
              >
                Add Payment Method
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
