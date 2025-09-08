"use client";

import { useState } from "react";
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
import {
  PAYMENT_TYPE,
  type PAYMENT_TYPE as PaymentType,
} from "src/entities/models/Payment";
import { useBidderPullOutModalContext } from "../../context/BidderPullOutModalContext";

type PaymentEntry = {
  method: PaymentType | "";
  amount: number;
};
const initialState = [{ method: "Cash" as PaymentType, amount: 0 }];

export const ConfirmPayment: React.FC = () => {
  const { grandTotal } = useBidderPullOutModalContext();
  const [payments, setPayments] = useState<PaymentEntry[]>(initialState);

  const handleAdd = () => {
    if (payments.length < PAYMENT_TYPE.length) {
      setPayments([...payments, { method: "", amount: 0 }]);
    }
  };

  const handleMethodChange = (index: number, newMethod: PaymentType) => {
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

  // const selectedMethods = payments.map((p) => p.method).filter(Boolean);

  // const getAvailableMethods = (currentMethod: string) =>
  //   PAYMENT_TYPE.filter(
  //     (method) => !selectedMethods.includes(method) || method === currentMethod
  //   );

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
            onValueChange={(value) =>
              handleMethodChange(0, value as PaymentType)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Payment Type"></SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {PAYMENT_TYPE.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {payments.length ? (
            <input
              type="hidden"
              value={grandTotal}
              name={`${payments[0].method}`}
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
                    onValueChange={(value) =>
                      handleMethodChange(index, value as PaymentType)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Payment Type"></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {PAYMENT_TYPE.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <InputNumber
                    name={`${item.method}_${index}`}
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

            {payments.length < PAYMENT_TYPE.length && (
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
