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
import { getPaymentMethods } from "@/app/(protected)/configurations/payment-methods/actions";

type PaymentEntry = {
  method: PaymentMethod["name"] | "";
  amount: number;
};
const initialState = [{ method: "Cash", amount: 0 }];

export const ConfirmPayment: React.FC = () => {
  const { grandTotal } = useBidderPullOutModalContext();
  const [payments, setPayments] = useState<PaymentEntry[]>(initialState);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getPaymentMethods();
      if (res.ok) setPaymentMethods(res.value);
    };

    fetchInitialData();
  }, []);

  const handleAdd = () => {
    if (payments.length < paymentMethods.length) {
      setPayments([...payments, { method: "", amount: 0 }]);
    }
  };

  const handleMethodChange = (
    index: number,
    newMethod: PaymentMethod["name"]
  ) => {
    setPayments((prev) => {
      const updated = [...prev];
      updated[index].method = newMethod;
      return updated;
    });
  };

  const handleAmountChange = (index: number, newAmount: number) => {
    const updated = [...payments];
    updated[index].amount = newAmount;
    setPayments(updated);
  };

  const handleRemove = (index: number) => {
    const updated = [...payments];
    updated.splice(index, 1);
    setPayments(updated);
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
      <Tabs
        defaultValue="single"
        onValueChange={() => setPayments([...initialState])}
      >
        <TabsList className="w-full">
          <TabsTrigger value="single">Single/Full Payment</TabsTrigger>
          <TabsTrigger value="multiple">Multiple Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Select
            required
            onValueChange={(value) => handleMethodChange(0, value)}
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

          {payments.length ? (
            <input
              type="hidden"
              value={grandTotal}
              name={`PAYMENT_${payments[0].method}`}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="multiple">
          <div className="space-y-2">
            {payments.map((item, index) => (
              <div className="flex gap-2" key={index}>
                <div className="flex-1">
                  <Select
                    required
                    value={payments[index].method}
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
                    name={`PAYMENT_${item.method}_${index}`}
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
                disabled={payments.some((item) => item.method === "")}
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
